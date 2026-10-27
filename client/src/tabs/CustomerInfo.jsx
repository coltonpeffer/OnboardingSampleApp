import React, { useState, useEffect } from 'react';
import { request, useSourceCustomers } from '../api';
import StepPanel from '../StepPanel';

function CustomerInfo() {
  const { customers, customerId, setCustomerId, customer, error: loadError } = useSourceCustomers();
  const [validation, setValidation] = useState(null);
  const [error, setError] = useState(null);

  const sourceId = customer?.sourceId;

  useEffect(() => {
    if (!sourceId) return;
    setValidation(null);
    setError(null);
    request(`/api/customer-info/${sourceId}/clients/validation`)
      .then(setValidation)
      .catch(err => setError(err.message));
  }, [sourceId]);

  const s = validation?.summary;
  const blockedReason = !validation ? null
    : validation.missingColumns.length ? `Missing columns: ${validation.missingColumns.join(', ')}`
    : s.withErrors ? `${s.withErrors} row(s) have errors - fix the source data before completing this step`
    : null;

  return (
    <div>
      <h2>Customer Info · Clients</h2>
      <p className="lead">Validate the customer's clients file before mapping and import.</p>

      <div className="toolbar">
        <label>
          Customer
          <select value={customerId} onChange={e => setCustomerId(e.target.value)}>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
      </div>

      {(error || loadError) && <p role="alert" className="alert alert-error">⚠️ {error || loadError}</p>}
      {!validation && !error && <p>Loading...</p>}

      {validation && (
        <>
          <p data-testid="validation-summary" className="summary">
            <span>{s.total} rows:</span>
            <span className="badge badge-ok">{s.clean} clean</span>
            <span className={`badge ${s.withWarnings ? 'badge-warn' : ''}`}>{s.withWarnings} with warnings</span>
            <span className={`badge ${s.withErrors ? 'badge-error' : ''}`}>{s.withErrors} with errors</span>
          </p>
          {validation.missingColumns.length > 0 && (
            <p role="alert" className="alert alert-error">
              Missing columns: {validation.missingColumns.join(', ')}
            </p>
          )}

          <div className="table-scroll">
            <table className="data-table" data-testid="validation-rows">
              <thead>
                <tr>
                  <th>Line</th>
                  {validation.fields.map(f => <th key={f.key}>{f.column}</th>)}
                  <th>Issues</th>
                </tr>
              </thead>
              <tbody>
                {validation.rows.map(row => (
                  <tr key={row.line} className={row.issues.some(i => i.severity === 'error') ? 'has-issues' : ''}>
                    <td>{row.line}</td>
                    {validation.fields.map(f => <td key={f.key}>{row.source[f.column] || '—'}</td>)}
                    <td>
                      {row.issues.map((i, n) => (
                        <div key={n} className={i.severity === 'error' ? 'issue-error' : 'issue-warning'}>
                          {i.severity === 'error' ? '✖' : '⚠'} {i.message}
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <StepPanel
            customerId={customerId}
            stepName="Customer Info"
            endpoint="customer-info"
            warnings={s.withWarnings}
            blockedReason={blockedReason}
          />
        </>
      )}
    </div>
  );
}

export default CustomerInfo;
