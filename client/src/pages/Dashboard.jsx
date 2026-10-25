import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { EmptyState, ErrorBanner, Spinner } from '../components/Feedback.jsx';
import { formatDate } from '../lib/constants.js';

const TABS = [
  { id: 'reports', label: 'My reports' },
  { id: 'claims', label: 'My claims' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('reports');
  const [items, setItems] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    Promise.all([api.myItems(), api.myClaims()])
      .then(([i, c]) => { setItems(i.items); setClaims(c.claims); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => load(), [load]);

  const act = async (fn) => {
    setError('');
    try { await fn(); load(); } catch (e) { setError(e.message); }
  };
  const onClose = (it) => act(() => api.closeItem(it.id));
  const onDelete = (it) => act(async () => {
    if (!window.confirm(`Delete "${it.title}"?`)) return;
    await api.deleteItem(it.id);
  });

  const onKey = (e) => {
    const idx = TABS.findIndex((t) => t.id === tab);
    if (e.key === 'ArrowRight') setTab(TABS[(idx + 1) % TABS.length].id);
    if (e.key === 'ArrowLeft') setTab(TABS[(idx + TABS.length - 1) % TABS.length].id);
  };

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Welcome, {user?.name}</h1>
        <Link to="/items/new" className="btn-primary">Report item</Link>
      </div>

      <div role="tablist" aria-label="Dashboard sections" className="flex gap-1 border-b border-slate-200" onKeyDown={onKey}>
        {TABS.map((t) => (
          <button key={t.id} role="tab" type="button" id={`tab-${t.id}`} aria-selected={tab === t.id} aria-controls={`panel-${t.id}`} tabIndex={tab === t.id ? 0 : -1}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold ${tab === t.id ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            {t.label} ({t.id === 'reports' ? items.length : claims.length})
          </button>
        ))}
      </div>

      <ErrorBanner message={error} onRetry={load} />
      {loading ? <Spinner /> : (
        <>
          <div role="tabpanel" id="panel-reports" aria-labelledby="tab-reports" hidden={tab !== 'reports'}>
            {items.length === 0 ? (
              <EmptyState title="You have not reported anything yet"><Link to="/items/new" className="font-semibold text-brand-700 underline">Report your first item</Link></EmptyState>
            ) : (
              <ul className="grid gap-3">
                {items.map((it) => (
                  <li key={it.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <Link to={`/items/${it.id}`} className="font-semibold text-slate-900 hover:underline">{it.title}</Link>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <StatusBadge status={it.type} /><StatusBadge status={it.status} />
                        {it.hidden && <StatusBadge status="hidden" />}
                        <span>{formatDate(it.date)}</span>
                        {typeof it.claimCount === 'number' && <span>{it.claimCount} claim{it.claimCount === 1 ? '' : 's'}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link to={`/items/${it.id}/edit`} className="btn-secondary btn-sm">Edit</Link>
                      {it.status !== 'closed' && <button type="button" className="btn-secondary btn-sm" onClick={() => onClose(it)}>Close</button>}
                      <button type="button" className="btn-danger btn-sm" onClick={() => onDelete(it)}>Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div role="tabpanel" id="panel-claims" aria-labelledby="tab-claims" hidden={tab !== 'claims'}>
            {claims.length === 0 ? (
              <EmptyState title="You have not submitted any claims">Browse found items to claim something that is yours.</EmptyState>
            ) : (
              <ul className="grid gap-3">
                {claims.map((c) => (
                  <li key={c.id} className="card p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link to={`/items/${c.item?.id}`} className="font-semibold text-slate-900 hover:underline">{c.item?.title || 'Item'}</Link>
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="mt-1 text-sm text-slate-700">{c.message}</p>
                    <p className="mt-1 text-xs text-slate-500">Submitted {formatDate(c.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
