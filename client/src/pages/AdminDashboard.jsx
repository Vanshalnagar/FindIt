import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import Pagination from '../components/Pagination.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { EmptyState, ErrorBanner, Spinner } from '../components/Feedback.jsx';
import { STATUSES, formatDate } from '../lib/constants.js';

const STAT_LABELS = [
  ['users', 'Users'], ['items', 'Items'], ['lostItems', 'Lost'], ['foundItems', 'Found'],
  ['openItems', 'Open'], ['resolvedItems', 'Resolved'], ['closedItems', 'Closed'],
  ['hiddenItems', 'Hidden'], ['pendingClaims', 'Pending claims'], ['totalClaims', 'Total claims'],
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStats = useCallback(() => api.adminStats().then((r) => setStats(r.stats)), []);
  const loadItems = useCallback(() => api.adminItems({ page, limit: 10, status }).then(setData), [page, status]);

  const loadAll = useCallback(() => {
    setLoading(true);
    setError('');
    Promise.all([loadStats(), loadItems(), api.adminUsers().then((r) => setUsers(r.users))])
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [loadStats, loadItems]);
  useEffect(() => loadAll(), [loadAll]);

  const act = async (fn) => {
    setError('');
    try { await fn(); await Promise.all([loadItems(), loadStats()]); } catch (e) { setError(e.message); }
  };
  const toggleHide = (it) => act(() => api.hideItem(it.id, !it.hidden));
  const remove = (it) => act(async () => {
    if (!window.confirm(`Delete "${it.title}" permanently?`)) return;
    await api.deleteItem(it.id);
  });

  return (
    <div className="grid gap-8">
      <h1 className="text-2xl font-bold text-slate-900">Admin dashboard</h1>
      <ErrorBanner message={error} onRetry={loadAll} />
      {loading && !stats ? <Spinner /> : (
        <>
          {stats && (
            <section aria-label="Statistics">
              <ul className="grid grid-cols-2 gap-3 md:grid-cols-5">
                {STAT_LABELS.map(([k, label]) => (
                  <li key={k} className="card p-4">
                    <p className="text-2xl font-bold text-brand-700">{stats[k] ?? 0}</p>
                    <p className="text-xs font-medium text-slate-500">{label}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="admin-items-h">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <h2 id="admin-items-h" className="text-lg font-semibold">Items</h2>
              <div>
                <label htmlFor="admin-status" className="label">Status filter</label>
                <select id="admin-status" className="input" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                  <option value="">All</option>
                  {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
            {!data || data.items.length === 0 ? <EmptyState title="No items found" /> : (
              <div className="card overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">All items including hidden</caption>
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th scope="col" className="px-4 py-3">Title</th><th scope="col" className="px-4 py-3">Type</th>
                      <th scope="col" className="px-4 py-3">Status</th><th scope="col" className="px-4 py-3">Owner</th>
                      <th scope="col" className="px-4 py-3">Date</th><th scope="col" className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.items.map((it) => (
                      <tr key={it.id}>
                        <td className="px-4 py-3 font-medium"><Link to={`/items/${it.id}`} className="hover:underline">{it.title}</Link></td>
                        <td className="px-4 py-3"><StatusBadge status={it.type} /></td>
                        <td className="px-4 py-3"><StatusBadge status={it.status} />{it.hidden && <> <StatusBadge status="hidden" /></>}</td>
                        <td className="px-4 py-3">{it.owner?.name}</td>
                        <td className="px-4 py-3">{formatDate(it.date)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button type="button" className="btn-secondary btn-sm" onClick={() => toggleHide(it)}>{it.hidden ? 'Unhide' : 'Hide'}</button>
                            <button type="button" className="btn-danger btn-sm" onClick={() => remove(it)} aria-label={`Delete ${it.title}`}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {data && <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />}
          </section>

          <section aria-labelledby="admin-users-h">
            <h2 id="admin-users-h" className="mb-3 text-lg font-semibold">Users</h2>
            {users.length === 0 ? <EmptyState title="No users" /> : (
              <div className="card overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">Registered users</caption>
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr><th scope="col" className="px-4 py-3">Name</th><th scope="col" className="px-4 py-3">Email</th><th scope="col" className="px-4 py-3">Role</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u) => (
                      <tr key={u.id}><td className="px-4 py-3">{u.name}</td><td className="px-4 py-3">{u.email}</td><td className="px-4 py-3 capitalize">{u.role}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
