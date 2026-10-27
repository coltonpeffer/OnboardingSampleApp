import React, { useState, useEffect } from 'react';

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function Dashboard() {
  const [customers, setCustomers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getJson('/api/onboarding')
      .then(data => {
        if (!Array.isArray(data)) throw new Error('Invalid response format');
        setCustomers(data);
        setSelectedId(data[0]?.customerId ?? null);
        setError(null);
      })
      .catch(err => {
        console.error('Failed to fetch onboarding data:', err);
        setError(err.message);
        setCustomers([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="placeholder"><p>Loading...</p></div>;

  if (error) {
    return <div className="alert alert-error" role="alert">⚠️ Failed to load onboarding data: {error}</div>;
  }

  if (customers.length === 0) {
    return <div className="placeholder"><p>No customers in the onboarding queue</p></div>;
  }

  const selected = customers.find(c => c.customerId === selectedId);

  return (
    <div>
      <h2>Onboarding Queue</h2>
      <p className="lead">{customers.length} customer(s) awaiting onboarding</p>

      <div className="queue-layout">
        <div className="queue-list" role="list">
          {customers.map(item => (
            <button
              key={item.customerId}
              role="listitem"
              className={`customer-card ${item.customerId === selectedId ? 'selected' : ''}`}
              onClick={() => setSelectedId(item.customerId)}
            >
              <h3>{item.customerName}</h3>
              <div className="customer-meta">
                <span>📍 {item.customerRegion}</span>
                <span>🏭 {item.customerIndustry}</span>
              </div>
              <ProgressBar percent={item.progressPercent} />
            </button>
          ))}
        </div>

        {selected && <CustomerDetail key={selected.customerId} item={selected} />}
      </div>
    </div>
  );
}

function CustomerDetail({ item }) {
  const [tenant, setTenant] = useState(null);
  const [importedCount, setImportedCount] = useState(null);

  useEffect(() => {
    fetch(`/api/tenants/${item.customerId}`)
      .then(res => (res.ok ? res.json() : null))
      .then(setTenant)
      .catch(() => setTenant(null));

    if (item.sourceId) {
      getJson(`/api/import/${item.sourceId}/clients`)
        .then(clients => setImportedCount(clients.length))
        .catch(() => setImportedCount(null));
    }
  }, [item.customerId, item.sourceId]);

  return (
    <section className="customer-detail" data-testid="customer-detail">
      <h3>{item.customerName}</h3>
      <div className="customer-meta">
        <span>📍 {item.customerRegion}</span>
        <span>🏭 {item.customerIndustry}</span>
        {item.customerEmail && <span>✉️ {item.customerEmail}</span>}
      </div>

      <dl className="facts">
        <div>
          <dt>Tenant</dt>
          <dd>
            <span className={`badge badge-${tenant ? tenant.status : ''}`}>{tenant ? tenant.status : 'not created'}</span>
            {tenant && <span className="muted"> · {tenant.plan}</span>}
          </dd>
        </div>
        <div>
          <dt>Clients imported</dt>
          <dd>{item.sourceId ? (importedCount ?? '…') : 'n/a'}</dd>
        </div>
      </dl>

      <div className="progress-section">
        <ProgressBar percent={item.progressPercent} />
        <Checklist steps={item.steps} />
      </div>
    </section>
  );
}

function ProgressBar({ percent }) {
  return (
    <div className="progress-bar-container">
      <div className="progress-bar" style={{ width: `${Math.max(percent, 0)}%` }}>
        {percent > 0 ? `${percent}%` : ''}
      </div>
    </div>
  );
}

function Checklist({ steps }) {
  return (
    <ul className="checklist">
      {steps.map(step => (
        <li key={step.id}>
          <span className={`step-status ${step.status}`}>
            {step.status === 'completed' ? '✓' : step.order}
          </span>
          <span>{step.name}</span>
          <span className="muted" style={{ marginLeft: 'auto', fontSize: '0.85rem' }}>
            {step.status.replace('_', ' ')}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default Dashboard;
