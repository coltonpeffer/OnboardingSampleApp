import React, { createContext, useContext, useState, useEffect } from 'react';
import { request } from './api';

const CustomerContext = createContext(null);

/** Holds the one customer CS is currently working on; every tab follows it. */
export function CustomerProvider({ children }) {
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    request('/api/customers')
      .then(data => {
        setCustomers(data);
        setCustomerId(data[0]?.id ?? '');
      })
      .catch(err => setError(err.message));
  }, []);

  const value = { customers, customerId, setCustomerId, customer: customers.find(c => c.id === customerId), error };
  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>;
}

export function useCustomer() {
  return useContext(CustomerContext);
}

/** Shown on source-data tabs for a customer that has no files to validate/map/import. */
export function NoSourceData({ customer }) {
  return (
    <div className="placeholder">
      <h2>No source data</h2>
      <p>{customer.name} has no customer files to work with, so this step doesn't apply.</p>
    </div>
  );
}
