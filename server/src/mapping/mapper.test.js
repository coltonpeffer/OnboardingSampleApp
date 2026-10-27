const { describe, it } = require('node:test');
const assert = require('node:assert');
const { customerMappings } = require('./customerMappings');
const { mapClients, mapClientRow, parseDate, parsePaymentTermsDays } = require('./mapper');
const { parseCsv } = require('./csv');
const { CLIENT_FIELDS } = require('./targetSchema');

describe('Client data mapping', () => {
  describe('parseDate', () => {
    it('normalises each customer date format to ISO', () => {
      assert.strictEqual(parseDate('01/15/2023', 'MM/DD/YYYY'), '2023-01-15');
      assert.strictEqual(parseDate('2023-01-15', 'YYYY-MM-DD'), '2023-01-15');
      assert.strictEqual(parseDate('15-01-2023', 'DD-MM-YYYY'), '2023-01-15');
    });

    it('rejects impossible dates', () => {
      assert.strictEqual(parseDate('13/45/2023', 'MM/DD/YYYY'), null);
    });
  });

  describe('parsePaymentTermsDays', () => {
    it('handles every customer wording', () => {
      assert.strictEqual(parsePaymentTermsDays('Net 30'), 30);
      assert.strictEqual(parsePaymentTermsDays('NET45'), 45);
      assert.strictEqual(parsePaymentTermsDays('60 Days'), 60);
      for (const v of ['Due on Receipt', 'COD', 'Immediate']) assert.strictEqual(parsePaymentTermsDays(v), 0);
      assert.strictEqual(parsePaymentTermsDays('whenever'), null);
    });
  });

  describe('parseCsv', () => {
    it('rejoins surplus fields into the last column', () => {
      const [row] = parseCsv('a,b\n1,Williams, Robert');
      assert.deepStrictEqual(row, { a: '1', b: 'Williams, Robert' });
    });
  });

  for (const mapping of customerMappings) {
    it(`maps every ${mapping.name} client with no issues`, () => {
      const { rows, summary } = mapClients(mapping);
      assert.ok(summary.total >= 10);
      assert.strictEqual(summary.withIssues, 0, JSON.stringify(rows.filter(r => r.issues.length)));
      for (const { target } of rows) {
        assert.match(target.startDate, /^\d{4}-\d{2}-\d{2}$/);
        assert.strictEqual(typeof target.annualRevenue, 'number');
        const enums = CLIENT_FIELDS.filter(f => f.type === 'enum');
        for (const f of enums) assert.ok(f.values.includes(target[f.key]), `${f.key}=${target[f.key]}`);
      }
    });
  }

  it('reports unmapped picklist values as issues instead of guessing', () => {
    const mapping = customerMappings[0];
    const row = { 'Client ID': 'X', 'Client Name': 'N', 'Business Type': 'Cooperative', Status: 'Active',
      'Date Onboarded': '01/15/2023' };
    const { target, issues } = mapClientRow(row, mapping);
    assert.strictEqual(target.entityType, null);
    assert.ok(issues.some(i => i.field === 'entityType'));
  });
});
