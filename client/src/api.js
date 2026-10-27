import { useState, useEffect } from 'react';

export async function request(url, options) {
  const res = await fetch(url, options);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
  return body;
}

export const post = (url, body) => request(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body ?? {})
});

/** Customers that have source data to validate/map/import, with the current selection. */
export function useSourceCustomers() {
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    request('/api/customers')
      .then(all => {
        const withSource = all.filter(c => c.sourceId);
        setCustomers(withSource);
        setCustomerId(withSource[0]?.id ?? '');
      })
      .catch(err => setError(err.message));
  }, []);

  return { customers, customerId, setCustomerId, customer: customers.find(c => c.id === customerId), error };
}
