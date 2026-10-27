/**
 * Data import: loads a customer's mapped clients into the platform.
 * Re-running is safe - clients are upserted on (sourceId, externalId).
 * Rows with mapping issues are skipped and reported, never imported partially.
 */

const store = require('../data/store');
const mapper = require('../mapping/mapper');

function importClients(mapping, dataDir) {
  const { rows } = mapper.mapClients(mapping, dataDir);
  const result = { total: rows.length, imported: 0, updated: 0, skipped: [] };

  for (const { target, issues } of rows) {
    if (issues.length > 0) {
      result.skipped.push({ externalId: target.externalId, issues });
      continue;
    }
    const { created } = store.upsertClient({ ...target, sourceId: mapping.id, importedAt: new Date().toISOString() });
    if (created) result.imported++;
    else result.updated++;
  }
  return result;
}

module.exports = { importClients };
