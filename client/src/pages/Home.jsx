import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Filters from '../components/Filters.jsx';
import ItemCard from '../components/ItemCard.jsx';
import Pagination from '../components/Pagination.jsx';
import { EmptyState, ErrorBanner, Spinner } from '../components/Feedback.jsx';

const LIMIT = 9;

export default function Home() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const filters = {
    search: params.get('search') || '',
    type: params.get('type') || '',
    category: params.get('category') || '',
    status: params.get('status') || '',
  };
  const page = Math.max(1, parseInt(params.get('page') || '1', 10) || 1);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const query = params.toString();
  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    setError('');
    api.listItems({ ...filters, page, limit: LIMIT })
      .then((r) => active && setData(r))
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => load(), [load]);

  const updateFilters = (next) => {
    const p = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => v && p.set(k, v));
    setParams(p);
  };
  const changePage = (n) => {
    const p = new URLSearchParams(params);
    p.set('page', String(n));
    setParams(p);
    window.scrollTo?.({ top: 0 });
  };

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 px-6 py-10 text-white sm:px-10">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Lost something? Found something?</h1>
        <p className="mt-2 max-w-xl text-brand-100">FindIt helps students reunite lost belongings with their owners across campus.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to={user ? '/items/new' : '/register'} className="btn bg-white text-brand-800 hover:bg-brand-50">
            {user ? 'Report an item' : 'Get started'}
          </Link>
          {!user && <Link to="/login" className="btn border border-white/40 text-white hover:bg-white/10">Log in</Link>}
        </div>
      </section>

      <Filters values={filters} onChange={updateFilters} />

      <section aria-labelledby="listings-heading" aria-busy={loading}>
        <h2 id="listings-heading" className="mb-3 text-lg font-semibold text-slate-900">
          Listings {data && !loading && <span className="text-sm font-normal text-slate-500">({data.total} found)</span>}
        </h2>
        {error && <ErrorBanner message={error} onRetry={load} />}
        {loading && <Spinner label="Loading listings..." />}
        {!loading && !error && data && data.items.length === 0 && (
          <EmptyState title="No items match your search">Try clearing the filters or report a new item.</EmptyState>
        )}
        {!loading && !error && data && data.items.length > 0 && (
          <>
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.items.map((it) => <li key={it.id}><ItemCard item={it} /></li>)}
            </ul>
            <Pagination page={data.page} totalPages={data.totalPages} onPageChange={changePage} />
          </>
        )}
      </section>
    </div>
  );
}
