/**
 * Tenant configuration and provisioning.
 * Provisioning is simulated (instant, in-memory); swap provisionTenant's body
 * for a real platform call later without changing the callers.
 */

const store = require('../data/store');
const { createTenant } = require('../models');
const { STEPS, completeStep } = require('../steps/steps');

const PLANS = ['starter', 'professional', 'enterprise'];

class ProvisioningError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function validateConfig(config) {
  const errors = [];
  if (!PLANS.includes(config.plan)) errors.push(`plan must be one of: ${PLANS.join(', ')}`);
  if (!config.displayName || !config.displayName.trim()) errors.push('displayName is required');
  if (!config.region || !config.region.trim()) errors.push('region is required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.adminEmail || '')) errors.push('adminEmail must be a valid email');
  return errors;
}

// Defaults for a customer with no tenant yet, taken from its customer record
function defaultConfig(customer) {
  return {
    plan: 'starter',
    displayName: customer.name,
    region: customer.region,
    adminEmail: customer.contactEmail
  };
}

// A tenant's config, falling back to customer defaults for tenants created without one
function effectiveConfig(tenant, customer) {
  return { ...defaultConfig(customer), plan: tenant.plan, ...tenant.config };
}

function pickConfig(input) {
  const { plan, displayName, region, adminEmail } = input || {};
  return Object.fromEntries(Object.entries({ plan, displayName, region, adminEmail }).filter(([, v]) => v !== undefined));
}

/** Create or update a tenant's configuration. Active tenants are locked. */
function configureTenant(customerId, input) {
  const customer = store.getCustomerById(customerId);
  if (!customer) throw new ProvisioningError(404, 'Customer not found');

  const existing = store.getTenantByCustomerId(customerId);
  if (existing && existing.status === 'active') {
    throw new ProvisioningError(409, 'Tenant is already active and cannot be reconfigured');
  }

  const config = { ...(existing ? effectiveConfig(existing, customer) : defaultConfig(customer)), ...pickConfig(input) };
  const errors = validateConfig(config);
  if (errors.length) throw new ProvisioningError(400, errors.join('; '));

  if (!existing) {
    return store.addTenant({ ...createTenant({ customerId, plan: config.plan }), config });
  }
  return store.updateTenant(customerId, { plan: config.plan, config });
}

/** Provision a configured tenant: pending/failed -> active, completes the Tenant Setup step. */
function provisionTenant(customerId) {
  const tenant = store.getTenantByCustomerId(customerId);
  if (!tenant) throw new ProvisioningError(404, 'Tenant not found - configure it first');
  if (tenant.status === 'active') throw new ProvisioningError(409, 'Tenant is already active');
  if (tenant.status === 'provisioning') throw new ProvisioningError(409, 'Provisioning already in progress');

  const config = effectiveConfig(tenant, store.getCustomerById(customerId));
  const errors = validateConfig(config);
  if (errors.length) throw new ProvisioningError(400, errors.join('; '));

  const provisioned = store.updateTenant(customerId, { config, status: 'active', provisionedAt: new Date().toISOString() });
  if (store.getOnboardingState(customerId)) completeStep(customerId, STEPS.tenantSetup);
  return provisioned;
}

module.exports = { PLANS, ProvisioningError, defaultConfig, configureTenant, provisionTenant };
