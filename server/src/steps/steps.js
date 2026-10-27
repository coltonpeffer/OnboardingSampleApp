/**
 * Onboarding step completion. A step is only completed once its validator passes:
 *   Customer Info - no errors; warnings must be acknowledged
 *   Data Mapping  - every client maps with no issues (needs Customer Info)
 *   Tenant Setup  - tenant provisioned (see tenants/provisioning.js)
 *   Import        - nothing skipped (needs Data Mapping + an active tenant)
 */

const store = require('../data/store');
const mapper = require('../mapping/mapper');
const { validateClients } = require('../validation/clientValidator');
const { calculateProgress } = require('../models');

const STEPS = {
  customerInfo: 'Customer Info',
  dataMapping: 'Data Mapping',
  tenantSetup: 'Tenant Setup',
  import: 'Import'
};

class StepError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function getCustomer(customerId) {
  const customer = store.getCustomerById(customerId);
  if (!customer) throw new StepError(404, 'Customer not found');
  return customer;
}

function getMapping(customer) {
  const mapping = customer.sourceId && mapper.getMapping(customer.sourceId);
  if (!mapping) throw new StepError(409, `${customer.name} has no source data to validate`);
  return mapping;
}

function isComplete(customerId, stepName) {
  const state = store.getOnboardingState(customerId);
  return !!state && state.steps.some(s => s.name === stepName && s.status === 'completed');
}

function requireComplete(customerId, stepName) {
  if (!isComplete(customerId, stepName)) throw new StepError(409, `Complete the "${stepName}" step first`);
}

/** Mark a step completed (idempotent) and recompute progress. Returns the onboarding state. */
function completeStep(customerId, stepName, extra = {}) {
  const state = store.getOnboardingState(customerId);
  if (!state) throw new StepError(404, 'Onboarding state not found');
  const steps = state.steps.map(s => (s.name === stepName ? { ...s, ...extra, status: 'completed' } : s));
  return store.updateOnboardingState(customerId, { steps, progressPercent: calculateProgress(steps) });
}

function completeCustomerInfo(customerId, { acknowledgeWarnings = false } = {}) {
  const customer = getCustomer(customerId);
  const { summary, missingColumns } = validateClients(getMapping(customer));

  if (missingColumns.length > 0) {
    throw new StepError(409, `Missing columns: ${missingColumns.join(', ')}`);
  }
  if (summary.withErrors > 0) {
    throw new StepError(409, `${summary.withErrors} row(s) have errors - fix the source data and validate again`);
  }
  if (summary.withWarnings > 0 && !acknowledgeWarnings) {
    throw new StepError(409, `${summary.withWarnings} row(s) have warnings - acknowledge them to complete this step`);
  }
  return completeStep(customerId, STEPS.customerInfo, { acknowledgedWarnings: summary.withWarnings });
}

function completeDataMapping(customerId) {
  const customer = getCustomer(customerId);
  const mapping = getMapping(customer);
  requireComplete(customerId, STEPS.customerInfo);

  const { summary } = mapper.mapClients(mapping);
  if (summary.withIssues > 0) {
    throw new StepError(409, `${summary.withIssues} client(s) cannot be mapped - fix the mapping first`);
  }
  return completeStep(customerId, STEPS.dataMapping);
}

/** Called after an import run. Never throws: returns { completed, reason? } for the UI. */
function completeImportStep(customerId, importResult) {
  try {
    if (importResult.skipped.length > 0) {
      throw new StepError(409, `${importResult.skipped.length} client(s) were skipped - fix them and import again`);
    }
    requireComplete(customerId, STEPS.dataMapping);
    const tenant = store.getTenantByCustomerId(customerId);
    if (!tenant || tenant.status !== 'active') throw new StepError(409, 'Provision the tenant before completing the import');
    completeStep(customerId, STEPS.import, { importedCount: importResult.imported + importResult.updated });
    return { completed: true };
  } catch (err) {
    if (err instanceof StepError) return { completed: false, reason: err.message };
    throw err;
  }
}

module.exports = {
  STEPS, StepError, isComplete, completeStep, completeCustomerInfo, completeDataMapping, completeImportStep
};
