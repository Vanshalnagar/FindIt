import { useState } from 'react';
import { api } from '../api/client.js';

export default function ClaimForm({ itemId, onSubmitted }) {
  const [message, setMessage] = useState('');
  const [proof, setProof] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    const m = message.trim();
    const p = proof.trim();
    if (m.length < 10 || m.length > 500) errs.message = 'Message must be 10-500 characters.';
    if (p.length < 10 || p.length > 1000) errs.proof = 'Proof must be 10-1000 characters.';
    setErrors(errs);
    setFormError('');
    if (Object.keys(errs).length) return;
    setSubmitting(true);
    try {
      const r = await api.createClaim(itemId, { message: m, proof: p });
      onSubmitted?.(r.claim);
    } catch (err) {
      const fe = {};
      (err.details || []).forEach((d) => { fe[d.field] = d.message; });
      setErrors(fe);
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="card grid gap-4 p-5" aria-label="Claim this item">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Is this yours?</h2>
        <p className="text-sm text-slate-600">Submit a claim. Your proof is private and only shown to the finder and admins.</p>
      </div>
      <div>
        <label htmlFor="claim-message" className="label">Message to the finder</label>
        <textarea id="claim-message" rows={3} className={`input ${errors.message ? 'input-error' : ''}`} value={message} onChange={(e) => setMessage(e.target.value)}
          aria-invalid={errors.message ? 'true' : undefined} aria-describedby={errors.message ? 'claim-message-err' : undefined} />
        {errors.message && <p id="claim-message-err" className="field-error">{errors.message}</p>}
      </div>
      <div>
        <label htmlFor="claim-proof" className="label">Proof of ownership (private)</label>
        <textarea id="claim-proof" rows={3} className={`input ${errors.proof ? 'input-error' : ''}`} value={proof} onChange={(e) => setProof(e.target.value)}
          placeholder="Describe unique marks, contents, serial numbers..."
          aria-invalid={errors.proof ? 'true' : undefined} aria-describedby={errors.proof ? 'claim-proof-err' : undefined} />
        {errors.proof && <p id="claim-proof-err" className="field-error">{errors.proof}</p>}
      </div>
      {formError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}
      <div>
        <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit claim'}</button>
      </div>
    </form>
  );
}
