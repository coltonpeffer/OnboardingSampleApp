import React, { useState, useEffect } from 'react';
import { request, post } from './api';

/**
 * Shows an onboarding step's status for a customer and, when `endpoint` is given,
 * lets CS complete it once its validator passes. `warnings` must be acknowledged first.
 * `refreshKey` re-reads the status (e.g. after an import).
 */
function StepPanel({ customerId, stepName, endpoint, warnings = 0, blockedReason = null, refreshKey = 0, hint }) {
  const [step, setStep] = useState(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setAcknowledged(false);
    setError(null);
    request(`/api/customers/${customerId}/onboarding`)
      .then(state => setStep(state.steps.find(s => s.name === stepName) ?? null))
      .catch(err => setError(err.message));
  }, [customerId, stepName, refreshKey]);

  const complete = async () => {
    setBusy(true);
    setError(null);
    try {
      const state = await post(`/api/customers/${customerId}/steps/${endpoint}/complete`, { acknowledgeWarnings: acknowledged });
      setStep(state.steps.find(s => s.name === stepName));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!step) return error ? <p role="alert" className="alert alert-error">⚠️ {error}</p> : null;

  const done = step.status === 'completed';
  const needsAck = warnings > 0 && !acknowledged;

  return (
    <div className="step-panel" data-testid="step-panel">
      <div className="step-panel-head">
        <strong>Step: {stepName}</strong>
        <span data-testid="step-status" className={`badge ${done ? 'badge-ok' : 'badge-pending'}`}>
          {done ? 'completed' : 'not completed'}
        </span>
      </div>

      {done ? (
        <p className="muted">
          ✅ Step complete{step.acknowledgedWarnings ? ` (${step.acknowledgedWarnings} warning(s) acknowledged)` : ''}
        </p>
      ) : endpoint ? (
        <>
          {blockedReason && <p className="issue-error">{blockedReason}</p>}
          {!blockedReason && warnings > 0 && (
            <label className="ack">
              <input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)} />
              I've reviewed the {warnings} row(s) with warnings
            </label>
          )}
          <button className="btn btn-primary" onClick={complete} disabled={busy || !!blockedReason || needsAck}>
            {warnings > 0 ? 'Clear warnings & complete step' : 'Mark step complete'}
          </button>
        </>
      ) : (
        <p className="muted">{hint}</p>
      )}

      {error && <p role="alert" className="alert alert-error">⚠️ {error}</p>}
    </div>
  );
}

export default StepPanel;
