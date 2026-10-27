const express = require('express');
const store = require('../data/store');
const { PLANS, ProvisioningError, defaultConfig, configureTenant, provisionTenant } = require('../tenants/provisioning');

const router = express.Router();

function handle(fn) {
  return (req, res) => {
    try {
      res.json(fn(req));
    } catch (err) {
      if (err instanceof ProvisioningError) return res.status(err.status).json({ error: err.message });
      throw err;
    }
  };
}

// Plans offered + defaults for a customer without a tenant yet
router.get('/:customerId/defaults', (req, res) => {
  const customer = store.getCustomerById(req.params.customerId);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  res.json({ plans: PLANS, config: defaultConfig(customer) });
});

// Create or update the tenant's configuration
router.put('/:customerId', handle(req => configureTenant(req.params.customerId, req.body)));

// Provision the configured tenant
router.post('/:customerId/provision', handle(req => provisionTenant(req.params.customerId)));

module.exports = router;
