const STATUS_STYLES = {
  open: 'bg-emerald-100 text-emerald-800',
  resolved: 'bg-sky-100 text-sky-800',
  closed: 'bg-slate-200 text-slate-700',
  pending: 'bg-amber-100 text-amber-800',
  accepted: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  lost: 'bg-rose-100 text-rose-800',
  found: 'bg-indigo-100 text-indigo-800',
  hidden: 'bg-purple-100 text-purple-800',
};

export default function StatusBadge({ status, className = '' }) {
  if (!status) return null;
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[status] || 'bg-slate-100 text-slate-700'} ${className}`}>
      {status}
    </span>
  );
}
