const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const store = require('../data/store');
const { customerMappings } = require('../mapping/customerMappings');
const { importClients } = require('./importer');

const mappingA = customerMappings[0];
const mappingB = customerMappings[1];

describe('Client import', () => {
  it('imports every mapped client for a customer', () => {
    const result = importClients(mappingA);
    assert.strictEqual(result.imported, result.total);
    assert.strictEqual(result.updated, 0);
    assert.deepStrictEqual(result.skipped, []);
    const clients = store.getClients(mappingA.id);
    assert.strictEqual(clients.length, result.total);
    assert.match(clients[0].startDate, /^\d{4}-\d{2}-\d{2}$/);
    assert.strictEqual(clients[0].sourceId, mappingA.id);
  });

  it('is idempotent: re-importing updates instead of duplicating', () => {
    const first = importClients(mappingB);
    const second = importClients(mappingB);
    assert.strictEqual(second.imported, 0);
    assert.strictEqual(second.updated, first.total);
    assert.strictEqual(store.getClients(mappingB.id).length, first.total);
  });

  it('keeps customers separate even when ids could overlap', () => {
    importClients(mappingA);
    importClients(mappingB);
    assert.ok(store.getClients(mappingA.id).every(c => c.sourceId === mappingA.id));
  });

  describe('rows with mapping issues', () => {
    let dir;
    beforeEach(() => {
      dir = fs.mkdtempSync(path.join(os.tmpdir(), 'import-test-'));
      fs.mkdirSync(path.join(dir, mappingA.folder));
      fs.writeFileSync(path.join(dir, mappingA.folder, 'clients.csv'), [
        Object.values(mappingA.columns).join(','),
        'BAD-1,Bad Co,Cooperative,Active,01/15/2023,1,100,Retail,Net 30,Jo',
        'GOOD-1,Good Co,LLC,Active,01/15/2023,2,200,Retail,Net 30,Al'
      ].join('\n'));
    });

    it('skips and reports them, importing the rest', () => {
      const result = importClients({ ...mappingA, id: 'issue-test' }, dir);
      assert.strictEqual(result.total, 2);
      assert.strictEqual(result.imported, 1);
      assert.strictEqual(result.skipped.length, 1);
      assert.strictEqual(result.skipped[0].externalId, 'BAD-1');
      assert.ok(result.skipped[0].issues.some(i => i.field === 'entityType'));
      assert.deepStrictEqual(store.getClients('issue-test').map(c => c.externalId), ['GOOD-1']);
    });
  });
});
