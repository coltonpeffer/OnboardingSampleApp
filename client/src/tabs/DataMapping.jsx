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
      <div className="alert alert-error" role="alert">⚠️ Failed to load data mapping: {error}</div>
    );
  }
  if (!config) return <div className="placeholder"><p>Loading...</p></div>;

  const mapping = config.mappings.find(m => m.id === selectedId);

  return (
    <div>
      <h2>Data Mapping · Clients</h2>
      <p className="lead">
        Map a customer's client data to the platform's Client schema.
      </p>

      <div className="toolbar">
        <label>
          Customer
          <select value={selectedId ?? ''} onChange={e => setSelectedId(e.target.value)}>
            {config.mappings.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </label>
        {mapping && <span className="badge">Dates: {mapping.dateFormat}</span>}
      </div>

      {mapping && (
        <>
          <h3 className="section-heading">Column mapping</h3>
          <div className="table-scroll"><table className="data-table" data-testid="column-mapping">
            <thead><tr><th>Platform field</th><th>Customer column</th><th>Value mapping</th></tr></thead>
            <tbody>
              {config.targetFields.map(f => (
                <tr key={f.key}>
                  <td>{f.label}{f.required ? ' *' : ''}</td>
                  <td><code>{mapping.columns[f.key]}</code></td>
                  <td>
                    {mapping.valueMaps[f.key]
                      ? Object.entries(mapping.valueMaps[f.key]).map(([from, to]) => (
                          <span key={from} className="chip">{from} → {to}</span>
                        ))
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </>
      )}

      <h3 className="section-heading">Preview</h3>
      {!result ? <p>Loading...</p> : (
        <>
          <p data-testid="mapping-summary" className="summary">
            <span className={`badge ${result.summary.withIssues ? 'badge-error' : 'badge-ok'}`}>
              {result.summary.total} clients mapped, {result.summary.withIssues} with issues
            </span>
          </p>
          <div className="table-scroll">
            <table className="data-table" data-testid="mapping-preview">
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
