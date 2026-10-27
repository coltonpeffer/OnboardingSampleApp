import React, { useState, useEffect } from 'react';

async function request(url, options) {
  const res = await fetch(url, options);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
  return body;
}

function Import() {
  const [sources, setSources] = useState([]);
  const [sourceId, setSourceId] = useState('');
  const [clients, setClients] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    request('/api/mappings')
      .then(data => {
        setSources(data.mappings);
        setSourceId(data.mappings[0]?.id ?? '');
      })
      .catch(err => setError(err.message));
  }, []);

  useEffect(() => {
    if (!sourceId) return;
    setResult(null);
    setError(null);
    request(`/api/import/${sourceId}/clients`)
      .then(setClients)
      .catch(err => setError(err.message));
  }, [sourceId]);

  const runImport = async () => {
    setBusy(true);
    setError(null);
    try {
      setResult(await request(`/api/import/${sourceId}/clients`, { method: 'POST' }));
      setClients(await request(`/api/import/${sourceId}/clients`));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h2>Import · Clients</h2>
      <p className="lead">
        Import a customer's mapped clients into the platform. Safe to re-run.
      </p>

      <div className="toolbar">
        <label>
          Customer
          <select value={sourceId} onChange={e => setSourceId(e.target.value)}>
            {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <button className="btn btn-primary" onClick={runImport} disabled={busy || !sourceId}>
          {busy ? 'Importing…' : 'Import clients'}
        </button>
      </div>

      {error && <p role="alert" className="alert alert-error">⚠️ {error}</p>}

      {result && (
        <p data-testid="import-summary" className={`alert ${result.skipped.length ? 'alert-error' : 'alert-success'}`}>
          {result.imported} imported, {result.updated} updated, {result.skipped.length} skipped (of {result.total})
        </p>
      )}
      {result?.skipped.map(s => (
        <p key={s.externalId} className="issue-error" style={{ fontSize: '0.85rem', marginTop: '4px' }}>
          {s.externalId}: {s.issues.map(i => i.message).join('; ')}
        </p>
      ))}

      <h3 className="section-heading">Imported clients ({clients.length})</h3>
      {clients.length === 0 ? <p>Nothing imported yet.</p> : (
        <div className="table-scroll">
          <table className="data-table" data-testid="imported-clients">
            <thead><tr><th>ID</th><th>Name</th><th>Type</th><th>Status</th><th>Start</th><th>Industry</th></tr></thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.externalId}>
                  <td>{c.externalId}</td><td>{c.name}</td><td>{c.entityType}</td>
                  <td>{c.status}</td><td>{c.startDate}</td><td>{c.industry ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Import;
