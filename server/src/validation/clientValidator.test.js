const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { customerMappings } = require('../mapping/customerMappings');
const { validateClients } = require('./clientValidator');

const [mappingA, mappingB, mappingC] = customerMappings;

describe('Client validation', () => {
  it('ABC and Premier sample data is clean', () => {
    for (const m of [mappingA, mappingC]) {
      const { summary } = validateClients(m);
      assert.strictEqual(summary.clean, summary.total, m.name);
    }
  });

  it('flags every XYZ row for the unquoted-comma trap as a usable warning', () => {
    const { rows, summary } = validateClients(mappingB);
    assert.strictEqual(summary.withErrors, 0);
    assert.strictEqual(summary.withWarnings, summary.total);
    assert.match(rows[0].issues[0].message, /11 fields, expected 10/);
    assert.strictEqual(rows[0].source.mainContact, 'Williams, Robert');
  });

  describe('bad data', () => {
    let dir;
    const write = (...rows) => {
      fs.writeFileSync(path.join(dir, mappingA.folder, 'clients.csv'),
        [Object.values(mappingA.columns).join(','), ...rows].join('\n'));
      return validateClients(mappingA, dir);
    };
    const messages = r => r.issues.map(i => `${i.severity}:${i.field}`);

    beforeEach(() => {
      dir = fs.mkdtempSync(path.join(os.tmpdir(), 'validate-test-'));
      fs.mkdirSync(path.join(dir, mappingA.folder));
    });

    it('catches duplicates, bad dates, bad tax ids, negative revenue and missing required values', () => {
      const { rows, summary } = write(
        'C1,One,LLC,Active,01/15/2023,12-3456789,100,Retail,Net 30,A',
        'C1,Dup,LLC,Active,01/15/2023,12-3456789,100,Retail,Net 30,A',
        'C2,Two,LLC,Active,13/45/2023,12-3456789,100,Retail,Net 30,A',
        'C3,Three,LLC,Active,01/15/2023,123,100,Retail,Net 30,A',
        'C4,Four,LLC,Active,01/15/2023,12-3456789,-5,Retail,Net 30,A',
        'C5,,LLC,Active,01/15/2099,12-3456789,100,Retail,Net 30,A'
      );
      assert.deepStrictEqual(messages(rows[0]), []);
      assert.ok(messages(rows[1]).includes('error:externalId'));
      assert.ok(messages(rows[2]).includes('error:startDate'));
      assert.ok(messages(rows[3]).includes('warning:taxId'));
      assert.ok(messages(rows[4]).includes('error:annualRevenue'));
      assert.ok(messages(rows[5]).includes('error:name'));
      assert.ok(messages(rows[5]).includes('warning:startDate'));
      assert.strictEqual(summary.total, 6);
      assert.strictEqual(summary.clean, 1);
    });

    it('reports header columns missing from the file', () => {
      fs.writeFileSync(path.join(dir, mappingA.folder, 'clients.csv'), 'Client ID,Client Name\nC1,One');
      assert.ok(validateClients(mappingA, dir).missingColumns.includes('Tax ID'));
    });
  });
});
