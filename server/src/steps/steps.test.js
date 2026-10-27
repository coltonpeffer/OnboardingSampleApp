const { describe, it } = require('node:test');
const assert = require('node:assert');
const store = require('../data/store');
const { importClients } = require('../import/importer');
const { customerMappings } = require('../mapping/customerMappings');
const { configureTenant, provisionTenant } = require('../tenants/provisioning');
const steps = require('./steps');

const status = (id, name) => store.getOnboardingState(id).steps.find(s => s.name === name).status;
const rejects = (fn, code, pattern) =>
  assert.throws(fn, e => e instanceof steps.StepError && e.status === code && pattern.test(e.message));

describe('Step completion', () => {
  it('Customer Info: clean data completes the step and moves progress', () => {
    const state = steps.completeCustomerInfo('cust_002'); // ABC - clean
    assert.strictEqual(status('cust_002', 'Customer Info'), 'completed');
    assert.strictEqual(state.progressPercent, 25);
  });

  it('Customer Info: warnings must be acknowledged', () => {
    rejects(() => steps.completeCustomerInfo('cust_003'), 409, /12 row\(s\) have warnings/); // XYZ
    assert.strictEqual(status('cust_003', 'Customer Info'), 'pending');

    steps.completeCustomerInfo('cust_003', { acknowledgeWarnings: true });
    const step = store.getOnboardingState('cust_003').steps.find(s => s.name === 'Customer Info');
    assert.strictEqual(step.status, 'completed');
    assert.strictEqual(step.acknowledgedWarnings, 12);
  });

  it('rejects customers without source data and unknown customers', () => {
    rejects(() => steps.completeCustomerInfo('cust_001'), 409, /no source data/); // Acme
    rejects(() => steps.completeCustomerInfo('nope'), 404, /not found/);
  });

  it('Data Mapping: requires Customer Info first', () => {
    rejects(() => steps.completeDataMapping('cust_004'), 409, /"Customer Info" step first/); // Premier
    steps.completeCustomerInfo('cust_004');
    steps.completeDataMapping('cust_004');
    assert.strictEqual(status('cust_004', 'Data Mapping'), 'completed');
  });

  it('Import: completes only with mapping done, tenant active and nothing skipped', () => {
    const mapping = customerMappings[2]; // Premier (cust_004, mapping done above)
    const run = () => steps.completeImportStep('cust_004', importClients(mapping));

    const blocked = run();
    assert.strictEqual(blocked.completed, false);
    assert.match(blocked.reason, /Provision the tenant/);

    configureTenant('cust_004', {});
    provisionTenant('cust_004');
    assert.deepStrictEqual(run(), { completed: true });

    const state = store.getOnboardingState('cust_004');
    assert.strictEqual(state.progressPercent, 100);
    assert.strictEqual(state.steps.find(s => s.name === 'Import').importedCount, 12);
  });

  it('Import: skipped rows block completion', () => {
    const result = steps.completeImportStep('cust_002', { imported: 5, updated: 0, skipped: [{ externalId: 'X' }] });
    assert.strictEqual(result.completed, false);
    assert.match(result.reason, /1 client\(s\) were skipped/);
  });
});
