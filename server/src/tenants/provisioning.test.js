const { describe, it } = require('node:test');
const assert = require('node:assert');
const store = require('../data/store');
const { createCustomer, createDefaultOnboardingSteps } = require('../models');
const { configureTenant, provisionTenant, ProvisioningError } = require('./provisioning');

function newCustomer(id) {
  store.addCustomer(createCustomer({ id, name: 'Test Co', region: 'EMEA', contactEmail: 'admin@test.example.com' }));
  store.addOnboardingState({ customerId: id, steps: createDefaultOnboardingSteps(), progressPercent: 0 });
}

describe('Tenant provisioning', () => {
  it('creates a pending tenant with defaults from the customer', () => {
    newCustomer('t1');
    const tenant = configureTenant('t1', {});
    assert.strictEqual(tenant.status, 'pending');
    assert.deepStrictEqual(tenant.config, {
      plan: 'starter', displayName: 'Test Co', region: 'EMEA', adminEmail: 'admin@test.example.com'
    });
  });

  it('updates configuration while pending', () => {
    newCustomer('t2');
    configureTenant('t2', {});
    const tenant = configureTenant('t2', { plan: 'enterprise' });
    assert.strictEqual(tenant.plan, 'enterprise');
    assert.strictEqual(tenant.config.plan, 'enterprise');
  });

  it('rejects invalid configuration', () => {
    newCustomer('t3');
    assert.throws(() => configureTenant('t3', { plan: 'gold', adminEmail: 'nope' }),
      e => e instanceof ProvisioningError && e.status === 400 && /plan/.test(e.message) && /adminEmail/.test(e.message));
  });

  it('rejects unknown customers', () => {
    assert.throws(() => configureTenant('missing', {}), e => e.status === 404);
  });

  it('provisioning activates the tenant and completes the Tenant Setup step', () => {
    newCustomer('t4');
    configureTenant('t4', {});
    const tenant = provisionTenant('t4');
    assert.strictEqual(tenant.status, 'active');
    const state = store.getOnboardingState('t4');
    assert.strictEqual(state.steps.find(s => s.name === 'Tenant Setup').status, 'completed');
    assert.strictEqual(state.progressPercent, 25);
  });

  it('cannot provision twice or reconfigure an active tenant', () => {
    newCustomer('t5');
    configureTenant('t5', {});
    provisionTenant('t5');
    assert.throws(() => provisionTenant('t5'), e => e.status === 409);
    assert.throws(() => configureTenant('t5', { plan: 'enterprise' }), e => e.status === 409);
  });

  it('provisions a tenant that was created without a config', () => {
    newCustomer('t7');
    store.addTenant({ id: 'tenant_t7', customerId: 't7', status: 'pending', plan: 'professional' });
    const tenant = provisionTenant('t7');
    assert.strictEqual(tenant.status, 'active');
    assert.strictEqual(tenant.config.plan, 'professional');
    assert.strictEqual(tenant.config.displayName, 'Test Co');
  });

  it('cannot provision without configuring first', () => {
    newCustomer('t6');
    assert.throws(() => provisionTenant('t6'), e => e.status === 404);
  });
});
