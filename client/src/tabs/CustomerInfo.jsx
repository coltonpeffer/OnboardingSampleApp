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
      <p style={{ color: '#6b7280', marginBottom: '16px' }}>
        Validate the customer's clients file before mapping and import.
      </p>

      <label>
        Customer:{' '}
        <select value={sourceId} onChange={e => setSourceId(e.target.value)}>
          {sources.map(src => <option key={src.id} value={src.id}>{src.name}</option>)}
        </select>
      </label>

      {error && <p role="alert" style={{ color: '#dc2626', marginTop: '12px' }}>⚠️ {error}</p>}
      {!validation && !error && <p>Loading...</p>}

      {validation && (
        <>
          <p data-testid="validation-summary" style={{ margin: '16px 0 8px' }}>
            {s.total} rows: <strong>{s.clean} clean</strong>,{' '}
            <span style={{ color: s.withWarnings ? '#d97706' : undefined }}>{s.withWarnings} with warnings</span>,{' '}
            <span style={{ color: s.withErrors ? '#dc2626' : undefined }}>{s.withErrors} with errors</span>
          </p>
          {validation.missingColumns.length > 0 && (
            <p role="alert" style={{ color: '#dc2626' }}>
              Missing columns: {validation.missingColumns.join(', ')}
            </p>
          )}

          <div className="mapping-scroll">
            <table className="mapping-table" data-testid="validation-rows">
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
                        <div key={n} style={{ color: i.severity === 'error' ? '#dc2626' : '#d97706' }}>
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
