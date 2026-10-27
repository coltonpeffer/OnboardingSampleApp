const express = require('express');
const mapper = require('../mapping/mapper');
const { CLIENT_FIELDS } = require('../mapping/targetSchema');

const router = express.Router();

// Target schema + per-customer mapping configs
router.get('/', (req, res) => {
  res.json({ targetFields: CLIENT_FIELDS, mappings: mapper.listMappings() });
});

// A customer's client data mapped to the platform schema
router.get('/:id/clients', (req, res) => {
  const mapping = mapper.getMapping(req.params.id);
  if (!mapping) {
    return res.status(404).json({ error: 'Mapping not found' });
  }
  res.json(mapper.mapClients(mapping));
});

module.exports = router;
