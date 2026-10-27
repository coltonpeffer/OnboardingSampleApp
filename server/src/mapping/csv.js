/**
 * Minimal CSV parser (no dependencies).
 * Supports quoted fields. Rows with more fields than the header (e.g. an
 * unquoted "Last, First" name) have the surplus rejoined into the last column.
 */

function splitLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else current += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { fields.push(current); current = ''; }
    else current += ch;
  }
  fields.push(current);
  return fields;
}

function parseCsv(text) {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length === 0) return [];
  const header = splitLine(lines[0]).map(h => h.trim());
  return lines.slice(1).map(line => {
    const fields = splitLine(line);
    if (fields.length > header.length) {
      const extra = fields.splice(header.length - 1);
      fields.push(extra.map(f => f.trim()).join(', '));
    }
    return Object.fromEntries(header.map((h, i) => [h, (fields[i] ?? '').trim()]));
  });
}

module.exports = { parseCsv, splitLine };
