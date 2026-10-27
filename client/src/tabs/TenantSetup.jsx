import React, { useState, useEffect } from 'react';

async function request(url, options) {
  const res = await fetch(url, options);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
  return body;
}

const json = (method, body) => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
});

function TenantSetup() {
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [tenant, setTenant] = useState(null);
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    request('/api/customers')
      .then(data => {
        setCustomers(data);
        setCustomerId(data[0]?.id ?? '');
      })
      .catch(err => setError(err.message));
  }, []);

  useEffect(() => {
    if (!customerId) return;
    setTenant(null);
    setForm(null);
    setError(null);
    Promise.all([
      request(`/api/tenants/${customerId}/defaults`),
      fetch(`/api/tenants/${customerId}`).then(res => (res.ok ? res.json() : null))
    ])
      .then(([defaults, existing]) => {
        setPlans(defaults.plans);
        setTenant(existing);
        setForm(existing?.config ?? defaults.config);
      })
      .catch(err => setError(err.message));
  }, [customerId]);

  const act = async (fn) => {
    setBusy(true);
    setError(null);
    try {
      const updated = await fn();
      setTenant(updated);
      setForm(updated.config);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const save = () => act(() => request(`/api/tenants/${customerId}`, json('PUT', form)));
  const provision = () => act(async () => {
    await request(`/api/tenants/${customerId}`, json('PUT', form));
    return request(`/api/tenants/${customerId}/provision`, { method: 'POST' });
  });

  const locked = tenant?.status === 'active';
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <div>
      <h2>Tenant Setup</h2>
      <p className="lead">
        Configure and provision the customer's platform tenant.
      </p>

      <div className="toolbar">
        <label>
          Customer
          <select value={customerId} onChange={e => setCustomerId(e.target.value)}>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
      </div>

      {error && <p role="alert" className="alert alert-error">⚠️ {error}</p>}

      {form && (
        <div className="tenant-form">
          <p data-testid="tenant-status">
            Status:{' '}
            <span className={`badge badge-${tenant ? tenant.status : ''}`}>{tenant ? tenant.status : 'not created'}</span>
          </p>

          <label>Display name
            <input value={form.displayName} onChange={set('displayName')} disabled={locked} />
          </label>
          <label>Region
            <input value={form.region} onChange={set('region')} disabled={locked} />
          </label>
          <label>Admin email
            <input value={form.adminEmail} onChange={set('adminEmail')} disabled={locked} />
          </label>
          <label>Plan
            <select value={form.plan} onChange={set('plan')} disabled={locked}>
              {plans.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>

          {locked ? (
            <p className="alert alert-success">✅ Tenant provisioned{tenant.provisionedAt ? ` at ${new Date(tenant.provisionedAt).toLocaleString()}` : ''}</p>
          ) : (
            <div className="tenant-actions">
              <button className="btn" onClick={save} disabled={busy}>Save configuration</button>
              <button className="btn btn-primary" onClick={provision} disabled={busy}>Provision tenant</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TenantSetup;
