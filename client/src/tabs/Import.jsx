import React, { useState, useEffect } from 'react';
import { request, useSourceCustomers } from '../api';
import StepPanel from '../StepPanel';

function Import() {
  const { customers, customerId, setCustomerId, customer, error: loadError } = useSourceCustomers();
  const [clients, setClients] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const sourceId = customer?.sourceId;

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
      setRefreshKey(k => k + 1);
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
          <select value={customerId} onChange={e => setCustomerId(e.target.value)}>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <button className="btn btn-primary" onClick={runImport} disabled={busy || !sourceId}>
          {busy ? 'Importing…' : 'Import clients'}
        </button>
      </div>

      {(error || loadError) && <p role="alert" className="alert alert-error">⚠️ {error || loadError}</p>}

      {result && (
        <p data-testid="import-summary" className={`alert ${result.skipped.length ? 'alert-error' : 'alert-success'}`}>
          {result.imported} imported, {result.updated} updated, {result.skipped.length} skipped (of {result.total})
        </p>
      )}
      {result?.step && !result.step.completed && (
        <p data-testid="import-step-blocked" className="issue-warning" style={{ marginTop: '6px' }}>
          Import step not completed: {result.step.reason}
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

      {customerId && (
        <StepPanel
          customerId={customerId}
          stepName="Import"
          refreshKey={refreshKey}
          hint="Completes automatically after a clean import, once Data Mapping is done and the tenant is active."
        />
      )}
    </div>
  );
}

export default Import;
