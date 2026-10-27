/**
 * Validates a customer's raw clients.csv before it moves on to mapping/import.
 * error   = row cannot be used as-is
 * warning = row is usable (auto-repaired or suspicious) but CS should look
 */

const fs = require('fs');
const path = require('path');
const { parseCsv, splitLine } = require('../mapping/csv');
const { SAMPLE_DATA_DIR, mapClientRow } = require('../mapping/mapper');
const { CLIENT_FIELDS } = require('../mapping/targetSchema');

const issue = (severity, field, message) => ({ severity, field, message });

function validateClients(mapping, dataDir = SAMPLE_DATA_DIR) {
  const text = fs.readFileSync(path.join(dataDir, mapping.folder, 'clients.csv'), 'utf8');
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim() !== '');
  const header = lines[0] ? splitLine(lines[0]).map(h => h.trim()) : [];
  const today = new Date().toISOString().slice(0, 10);

  const missingColumns = Object.values(mapping.columns).filter(c => !header.includes(c));
  const rows = lines.slice(1).map((line, i) => ({ line: i + 2, fieldCount: splitLine(line).length, text: line }));
  const parsed = parseCsv(text);

  const seen = new Map();
  const results = rows.map((row, i) => {
    const { source, target, issues: mappingIssues } = mapClientRow(parsed[i], mapping);
    const issues = [];

    if (row.fieldCount !== header.length) {
      issues.push(issue('warning', null,
        `Has ${row.fieldCount} fields, expected ${header.length} (unquoted comma?) - extra fields joined into "${header[header.length - 1]}"`));
    }
    for (const m of mappingIssues) issues.push(issue('error', m.field, m.message));

    if (target.externalId) {
      if (seen.has(target.externalId)) {
        issues.push(issue('error', 'externalId', `Duplicate ID "${target.externalId}" (also on line ${seen.get(target.externalId)})`));
      } else seen.set(target.externalId, row.line);
    }
    if (target.startDate && target.startDate > today) {
      issues.push(issue('warning', 'startDate', `Start date ${target.startDate} is in the future`));
    }
    if (source[mapping.columns.taxId] && !mapping.taxIdPattern.test(source[mapping.columns.taxId])) {
      issues.push(issue('warning', 'taxId', `Tax ID "${source[mapping.columns.taxId]}" does not match ${mapping.taxIdPattern}`));
    }
    if (target.annualRevenue !== null && target.annualRevenue < 0) {
      issues.push(issue('error', 'annualRevenue', `Negative revenue ${target.annualRevenue}`));
    }

    return { line: row.line, externalId: target.externalId, source, issues };
  });

  const count = sev => results.filter(r => r.issues.some(i => i.severity === sev)).length;
  return {
    fields: CLIENT_FIELDS.map(f => ({ key: f.key, label: f.label, column: mapping.columns[f.key] })),
    missingColumns,
    rows: results,
    summary: {
      total: results.length,
      withErrors: count('error'),
      withWarnings: results.filter(r => r.issues.length && r.issues.every(i => i.severity === 'warning')).length,
      clean: results.filter(r => r.issues.length === 0).length
    }
  };
}

module.exports = { validateClients };
