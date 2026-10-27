/**
 * Platform target schema for a Client - what the platform needs for configuration.
 */

const CLIENT_FIELDS = [
  { key: 'externalId', label: 'External ID', type: 'string', required: true },
  { key: 'name', label: 'Name', type: 'string', required: true },
  { key: 'entityType', label: 'Entity Type', type: 'enum', required: true,
    values: ['corporation', 's_corporation', 'llc', 'llp', 'partnership', 'sole_proprietor', 'non_profit'] },
  { key: 'status', label: 'Status', type: 'enum', required: true,
    values: ['active', 'inactive', 'pending'] },
  { key: 'startDate', label: 'Start Date', type: 'date (ISO YYYY-MM-DD)', required: true },
  { key: 'taxId', label: 'Tax ID', type: 'string', required: false },
  { key: 'annualRevenue', label: 'Annual Revenue', type: 'number', required: false },
  { key: 'industry', label: 'Industry', type: 'string', required: false },
  { key: 'paymentTermsDays', label: 'Payment Terms (days)', type: 'integer', required: false },
  { key: 'primaryContact', label: 'Primary Contact', type: 'string', required: false }
];

module.exports = { CLIENT_FIELDS };
