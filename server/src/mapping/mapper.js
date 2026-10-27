/**
 * Maps raw customer client rows onto the platform's Client schema.
 * Unmappable values become null and are reported as issues - never guessed.
 */

const fs = require('fs');
const path = require('path');
const { parseCsv } = require('./csv');
const { CLIENT_FIELDS } = require('./targetSchema');
const { customerMappings } = require('./customerMappings');

const SAMPLE_DATA_DIR = path.join(__dirname, '../../../sample-data');

function parseDate(value, format) {
  const parts = value.split(/[-/]/).map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
  const [y, m, d] = {
    'MM/DD/YYYY': [parts[2], parts[0], parts[1]],
    'YYYY-MM-DD': [parts[0], parts[1], parts[2]],
    'DD-MM-YYYY': [parts[2], parts[1], parts[0]]
  }[format] || [];
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return date.toISOString().slice(0, 10);
}

function parseNumber(value) {
  const n = Number(value.replace(/[^0-9.-]/g, ''));
  return value.trim() === '' || Number.isNaN(n) ? null : n;
}

// "Net 30", "NET30", "30 Days" -> 30; "Due on Receipt", "COD", "Immediate" -> 0
function parsePaymentTermsDays(value) {
  if (/^(due on receipt|cod|immediate)$/i.test(value)) return 0;
  const match = value.match(/^(?:net\s*)?(\d+)(?:\s*days)?$/i);
  return match ? Number(match[1]) : null;
}

function mapValue(field, raw, mapping) {
  if (raw === '') return null;
  if (field === 'startDate') return parseDate(raw, mapping.dateFormat);
  if (field === 'annualRevenue') return parseNumber(raw);
  if (field === 'paymentTermsDays') return parsePaymentTermsDays(raw);
  const valueMap = mapping.valueMaps[field];
  if (valueMap) return valueMap[raw] ?? (field === 'industry' ? raw : null);
  return raw;
}

function mapClientRow(row, mapping) {
  const target = {};
  const issues = [];
  for (const field of CLIENT_FIELDS) {
    const sourceColumn = mapping.columns[field.key];
    const raw = row[sourceColumn] ?? '';
    const value = mapValue(field.key, raw, mapping);
    target[field.key] = value;
    if (value === null) {
      if (raw !== '') issues.push({ field: field.key, message: `Unmapped value "${raw}" in "${sourceColumn}"` });
      else if (field.required) issues.push({ field: field.key, message: `Missing required value in "${sourceColumn}"` });
    }
  }
  return { source: row, target, issues };
}

function listMappings() {
  return customerMappings.map(({ id, name, folder, dateFormat, columns, valueMaps }) => ({
    id, name, folder, dateFormat, columns, valueMaps
  }));
}

function getMapping(id) {
  return customerMappings.find(m => m.id === id);
}

function mapClients(mapping, dataDir = SAMPLE_DATA_DIR) {
  const text = fs.readFileSync(path.join(dataDir, mapping.folder, 'clients.csv'), 'utf8');
  const rows = parseCsv(text).map(row => mapClientRow(row, mapping));
  return {
    rows,
    summary: {
      total: rows.length,
      withIssues: rows.filter(r => r.issues.length > 0).length
    }
  };
}

module.exports = { listMappings, getMapping, mapClients, mapClientRow, parseDate, parsePaymentTermsDays };
