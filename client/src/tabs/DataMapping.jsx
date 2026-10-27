import React, { useState, useEffect } from 'react';

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function DataMapping() {
  const [config, setConfig] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getJson('/api/mappings')
      .then(data => {
        setConfig(data);
        setSelectedId(data.mappings[0]?.id ?? null);
      })
      .catch(err => setError(err.message));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setResult(null);
    getJson(`/api/mappings/${selectedId}/clients`)
      .then(data => { setResult(data); setError(null); })
      .catch(err => setError(err.message));
  }, [selectedId]);

  if (error) {
    return (
      <div className="placeholder">
        <p style={{ color: '#dc2626' }}>⚠️ Failed to load data mapping</p>
        <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>{error}</p>
      </div>
    );
  }
  if (!config) return <div className="placeholder"><p>Loading...</p></div>;

  const mapping = config.mappings.find(m => m.id === selectedId);

  return (
    <div>
      <h2>Data Mapping · Clients</h2>
      <p style={{ color: '#6b7280', marginBottom: '16px' }}>
        Map a customer's client data to the platform's Client schema.
      </p>

      <label>
        Customer:{' '}
        <select value={selectedId ?? ''} onChange={e => setSelectedId(e.target.value)}>
          {config.mappings.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </label>

      {mapping && (
        <>
          <h3 className="mapping-heading">Column mapping (dates: {mapping.dateFormat})</h3>
          <table className="mapping-table" data-testid="column-mapping">
            <thead><tr><th>Platform field</th><th>Customer column</th><th>Value mapping</th></tr></thead>
            <tbody>
              {config.targetFields.map(f => (
                <tr key={f.key}>
                  <td>{f.label}{f.required ? ' *' : ''}</td>
                  <td><code>{mapping.columns[f.key]}</code></td>
                  <td>
                    {mapping.valueMaps[f.key]
                      ? Object.entries(mapping.valueMaps[f.key]).map(([from, to]) => `${from} → ${to}`).join(', ')
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <h3 className="mapping-heading">Preview</h3>
      {!result ? <p>Loading...</p> : (
        <>
          <p data-testid="mapping-summary" style={{ color: result.summary.withIssues ? '#dc2626' : '#16a34a' }}>
            {result.summary.total} clients mapped, {result.summary.withIssues} with issues
          </p>
          <div className="mapping-scroll">
            <table className="mapping-table" data-testid="mapping-preview">
              <thead>
                <tr>
                  {config.targetFields.map(f => <th key={f.key}>{f.label}</th>)}
                  <th>Issues</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row, i) => (
                  <tr key={i} className={row.issues.length ? 'has-issues' : ''}>
                    {config.targetFields.map(f => <td key={f.key}>{row.target[f.key] ?? '—'}</td>)}
                    <td>{row.issues.map(issue => issue.message).join('; ')}</td>
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

export default DataMapping;
