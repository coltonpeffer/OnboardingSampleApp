const express = require('express');
const mapper = require('../mapping/mapper');
const { validateClients } = require('../validation/clientValidator');

const router = express.Router();

// Validate a customer's raw clients.csv
router.get('/:sourceId/clients/validation', (req, res) => {
  const mapping = mapper.getMapping(req.params.sourceId);
  if (!mapping) return res.status(404).json({ error: 'Customer not found' });
  res.json(validateClients(mapping));
});

module.exports = router;
