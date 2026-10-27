/**
 * In-Memory Data Store
 * Simple storage for the training exercise - no database needed
 */

const { createCustomer, createTenant, createDefaultOnboardingSteps } = require('../models');

// In-memory storage
const store = {
  customers: [],
  tenants: [],
  onboardingStates: [],
  clients: []
};

// Seed with example data
function seedData() {
  // Example customer - Acme Corporation
  const exampleCustomer = createCustomer({
    id: 'cust_001',
    name: 'Acme Corporation',
    industry: 'Manufacturing',
    region: 'North America',
    contactEmail: 'onboarding@acme.example.com',
    createdAt: '2025-01-15T10:00:00Z'
  });

  // Example tenant for Acme
  const exampleTenant = createTenant({
    id: 'tenant_001',
    customerId: 'cust_001',
    status: 'pending',
    plan: 'professional',
    createdAt: '2025-01-15T10:00:00Z'
  });
  exampleTenant.config = {
    plan: 'professional',
    displayName: 'Acme Corporation',
    region: 'North America',
    adminEmail: 'onboarding@acme.example.com'
  };

  // Example onboarding state - just started, nothing completed
  const exampleOnboardingState = {
    customerId: 'cust_001',
    steps: createDefaultOnboardingSteps(),
    progressPercent: 0
  };

  store.customers.push(exampleCustomer);
  store.tenants.push(exampleTenant);
  store.onboardingStates.push(exampleOnboardingState);

  // Customers waiting in the queue, each linked to its sample data (see sample-data/)
  const queued = [
    { id: 'cust_002', name: 'ABC Accounting', industry: 'Accounting', region: 'North America',
      contactEmail: 'onboarding@abc-accounting.example.com', sourceId: 'customer-a' },
    { id: 'cust_003', name: 'XYZ Financial Services', industry: 'Financial Services', region: 'North America',
      contactEmail: 'onboarding@xyz-financial.example.com', sourceId: 'customer-b' },
    { id: 'cust_004', name: 'Premier Bookkeeping', industry: 'Bookkeeping', region: 'United Kingdom',
      contactEmail: 'onboarding@premier-bookkeeping.example.com', sourceId: 'customer-c' }
  ];
  for (const data of queued) {
    store.customers.push(createCustomer({ ...data, createdAt: '2025-01-20T10:00:00Z' }));
    store.onboardingStates.push({ customerId: data.id, steps: createDefaultOnboardingSteps(), progressPercent: 0 });
  }
}

// Initialize with seed data
seedData();

// Store access functions
function getCustomers() {
  return [...store.customers];
}

function getCustomerById(id) {
  return store.customers.find(c => c.id === id);
}

function addCustomer(customer) {
  store.customers.push(customer);
  return customer;
}

function getTenants() {
  return [...store.tenants];
}

function getTenantByCustomerId(customerId) {
  return store.tenants.find(t => t.customerId === customerId);
}

function addTenant(tenant) {
  store.tenants.push(tenant);
  return tenant;
}

function updateTenant(customerId, updates) {
  const index = store.tenants.findIndex(t => t.customerId === customerId);
  if (index === -1) return null;
  store.tenants[index] = { ...store.tenants[index], ...updates };
  return store.tenants[index];
}

function getClients(sourceId) {
  return store.clients.filter(c => c.sourceId === sourceId);
}

// Insert or replace a client keyed by (sourceId, externalId)
function upsertClient(client) {
  const index = store.clients.findIndex(c => c.sourceId === client.sourceId && c.externalId === client.externalId);
  if (index === -1) {
    store.clients.push(client);
    return { client, created: true };
  }
  store.clients[index] = client;
  return { client, created: false };
}

function getOnboardingState(customerId) {
  return store.onboardingStates.find(s => s.customerId === customerId);
}

function getAllOnboardingStates() {
  return [...store.onboardingStates];
}

function addOnboardingState(state) {
  store.onboardingStates.push(state);
  return state;
}

function updateOnboardingState(customerId, updates) {
  const index = store.onboardingStates.findIndex(s => s.customerId === customerId);
  if (index !== -1) {
    store.onboardingStates[index] = { ...store.onboardingStates[index], ...updates };
    return store.onboardingStates[index];
  }
  return null;
}

module.exports = {
  getCustomers,
  getCustomerById,
  addCustomer,
  getTenants,
  getTenantByCustomerId,
  addTenant,
  getClients,
  upsertClient,
  updateTenant,
  getOnboardingState,
  getAllOnboardingStates,
  addOnboardingState,
  updateOnboardingState
};
