const express = require('express');
const store = require('../data/store');
const mapper = require('../mapping/mapper');
const { importClients } = require('../import/importer');

const router = express.Router();

function withMapping(req, res, next) {
  req.mapping = mapper.getMapping(req.params.sourceId);
  if (!req.mapping) return res.status(404).json({ error: 'Mapping not found' });
  next();
}

// Clients already imported for a source
router.get('/:sourceId/clients', withMapping, (req, res) => {
  res.json(store.getClients(req.mapping.id));
});

// Import (or re-import) a source's mapped clients
router.post('/:sourceId/clients', withMapping, (req, res) => {
  res.json(importClients(req.mapping));
});

module.exports = router;
