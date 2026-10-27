import React, { useState, useEffect } from 'react';

async function getJson(url) {
  const res = await fetch(url);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
  return body;
}

function CustomerInfo() {
  const [sources, setSources] = useState([]);
  const [sourceId, setSourceId] = useState('');
  const [validation, setValidation] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getJson('/api/mappings')
      .then(data => {
        setSources(data.mappings);
        setSourceId(data.mappings[0]?.id ?? '');
      })
      .catch(err => setError(err.message));
  }, []);

  useEffect(() => {
    if (!sourceId) return;
    setValidation(null);
    setError(null);
    getJson(`/api/customer-info/${sourceId}/clients/validation`)
      .then(setValidation)
      .catch(err => setError(err.message));
  }, [sourceId]);

  const s = validation?.summary;

  return (
    <div>
      <h2>Customer Info · Clients</h2>
      <p className="lead">
        Validate the customer's clients file before mapping and import.
      </p>

      <div className="toolbar">
        <label>
          Customer
          <select value={sourceId} onChange={e => setSourceId(e.target.value)}>
            {sources.map(src => <option key={src.id} value={src.id}>{src.name}</option>)}
          </select>
        </label>
      </div>

      {error && <p role="alert" className="alert alert-error">⚠️ {error}</p>}
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
        </>
      )}
    </div>
  );
}

export default CustomerInfo;
