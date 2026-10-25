import StatusBadge from './StatusBadge.jsx';
import { formatDate } from '../lib/constants.js';

export default function ClaimList({ claims, onDecide, busyId }) {
  if (!claims.length) return <p className="text-sm text-slate-500">No claims have been submitted yet.</p>;
  return (
    <ul className="grid gap-3">
      {claims.map((c) => (
        <li key={c.id} className="card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium text-slate-900">{c.claimant?.name} <span className="text-xs font-normal text-slate-500">on {formatDate(c.createdAt)}</span></p>
            <StatusBadge status={c.status} />
          </div>
          <p className="mt-2 text-sm text-slate-700"><span className="font-semibold">Message:</span> {c.message}</p>
          <p className="mt-1 rounded-md bg-amber-50 p-2 text-sm text-slate-700"><span className="font-semibold">Private proof:</span> {c.proof}</p>
          {c.status === 'pending' && (
            <div className="mt-3 flex gap-2">
              <button type="button" className="btn-primary btn-sm" disabled={busyId === c.id} onClick={() => onDecide(c, 'accepted')}>Accept</button>
              <button type="button" className="btn-secondary btn-sm" disabled={busyId === c.id} onClick={() => onDecide(c, 'rejected')}>Reject</button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
