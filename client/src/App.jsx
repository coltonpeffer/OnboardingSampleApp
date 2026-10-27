import React, { useState } from 'react';
import Dashboard from './tabs/Dashboard';
import { CustomerProvider, useCustomer } from './CustomerContext';
import CustomerInfo from './tabs/CustomerInfo';
import TenantSetup from './tabs/TenantSetup';
import Import from './tabs/Import';
import DataMapping from './tabs/DataMapping';

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'customer-info', label: 'Customer Info' },
  { id: 'data-mapping', label: 'Data Mapping' },
  { id: 'tenant-setup', label: 'Tenant Setup' },
  { id: 'import', label: 'Import' }
];

function CustomerBar() {
  const { customers, customerId, setCustomerId, error } = useCustomer();
  return (
    <div className="toolbar customer-bar">
      <label>
        Working on
        <select data-testid="customer-select" value={customerId} onChange={e => setCustomerId(e.target.value)}>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <span className="muted">One customer at a time - every tab follows this selection.</span>
      {error && <span role="alert" className="issue-error">⚠️ {error}</span>}
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  return (
    <div className="app">
      <header>
        <h1>Onboarding Dashboard</h1>
        <p>Customer Success Team - Internal Tool</p>
      </header>

      <CustomerBar />

      <nav className="tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="content">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'customer-info' && (
          <CustomerInfo />
        )}
        {activeTab === 'data-mapping' && (
          <DataMapping />
        )}
        {activeTab === 'tenant-setup' && (
          <TenantSetup />
        )}
        {activeTab === 'import' && (
          <Import />
        )}
      </main>
    </div>
  );
}

function PlaceholderTab({ title, description }) {
  return (
    <div className="placeholder">
      <h2>{title}</h2>
      <p>{description}</p>
      <p style={{ marginTop: '20px', fontSize: '0.9rem' }}>
        🚧 This section is ready to be built
      </p>
    </div>
  );
}

function AppWithCustomer() {
  return (
    <CustomerProvider>
      <App />
    </CustomerProvider>
  );
}

export default AppWithCustomer;
