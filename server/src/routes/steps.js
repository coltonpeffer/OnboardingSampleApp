const express = require('express');
const { StepError, completeCustomerInfo, completeDataMapping } = require('../steps/steps');

const router = express.Router();

function handle(fn) {
  return (req, res) => {
    try {
      res.json(fn(req));
    } catch (err) {
      if (err instanceof StepError) return res.status(err.status).json({ error: err.message });
      throw err;
    }
  };
}

router.post('/:customerId/steps/customer-info/complete', handle(req =>
  completeCustomerInfo(req.params.customerId, { acknowledgeWarnings: req.body?.acknowledgeWarnings === true })));

router.post('/:customerId/steps/data-mapping/complete', handle(req =>
  completeDataMapping(req.params.customerId)));

module.exports = router;
