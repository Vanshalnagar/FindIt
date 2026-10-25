import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import ClaimForm from '../components/ClaimForm.jsx';
import ClaimList from '../components/ClaimList.jsx';
import { ErrorBanner, Spinner } from '../components/Feedback.jsx';
import { categoryLabel, formatDate } from '../lib/constants.js';

export default function ItemDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [claims, setClaims] = useState([]);
  const [myClaim, setMyClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const isOwner = !!(user && item && item.owner?.id === user.id);
  const isAdmin = user?.role === 'admin';
  const canManage = isOwner || isAdmin;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { item: it } = await api.getItem(id);
      setItem(it);
      setClaims([]);
      setMyClaim(null);
      if (user) {
        const manage = it.owner?.id === user.id || user.role === 'admin';
        if (manage) {
          const r = await api.itemClaims(id);
          setClaims(r.claims);
        } else if (it.type === 'found') {
          const r = await api.myClaims();
          setMyClaim(r.claims.find((c) => (c.item?.id || c.item) === it.id) || null);
        }
      }
    } catch (e) {
      setError(e.message);
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => { load(); }, [load]);

  const run = async (fn) => {
    setActionError('');
    try { await fn(); } catch (e) { setActionError(e.message); }
  };

  const onClose = () => run(async () => {
    const r = await api.closeItem(id);
    setItem((i) => ({ ...i, ...r.item }));
  });
  const onDelete = () => run(async () => {
    if (!window.confirm('Delete this listing permanently? Claims will be deleted too.')) return;
    await api.deleteItem(id);
    navigate('/dashboard');
  });
  const onDecide = (claim, status) => run(async () => {
    setBusyId(claim.id);
    try {
      await api.updateClaim(claim.id, status);
      await load();
    } finally {
      setBusyId(null);
    }
  });

  if (loading && !item) return <Spinner label="Loading item..." />;
  if (error) {
    return (
      <div className="grid gap-4">
        <ErrorBanner message={error} />
        <Link to="/" className="text-sm font-semibold text-brand-700 underline">Back to listings</Link>
      </div>
    );
  }
  if (!item) return null;

  const canClaim = user && !isOwner && item.type === 'found' && item.status === 'open' && !item.hidden && !myClaim;

  return (
    <div className="grid gap-6">
      <Link to="/" className="text-sm font-semibold text-brand-700 underline">&larr; Back to listings</Link>
      <article className="card overflow-hidden md:grid md:grid-cols-2">
        <div className="bg-slate-100">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={`Photo of ${item.title}`} className="h-full max-h-96 w-full object-cover md:max-h-none" />
          ) : (
            <div className="flex h-64 items-center justify-center text-slate-400">No photo provided</div>
          )}
        </div>
        <div className="grid content-start gap-4 p-6">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={item.type} />
            <StatusBadge status={item.status} />
            {item.hidden && <StatusBadge status="hidden" />}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{item.title}</h1>
          <p className="whitespace-pre-line text-slate-700">{item.description}</p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="font-semibold text-slate-500">Category</dt><dd>{categoryLabel(item.category)}</dd>
            <dt className="font-semibold text-slate-500">Location</dt><dd>{item.location}</dd>
            <dt className="font-semibold text-slate-500">Date</dt><dd>{formatDate(item.date)}</dd>
            <dt className="font-semibold text-slate-500">Posted by</dt><dd>{item.owner?.name}</dd>
          </dl>
          {canManage && (
            <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
              <Link to={`/items/${item.id}/edit`} className="btn-secondary btn-sm">Edit</Link>
              {item.status !== 'closed' && <button type="button" className="btn-secondary btn-sm" onClick={onClose}>Close listing</button>}
              <button type="button" className="btn-danger btn-sm" onClick={onDelete}>Delete</button>
            </div>
          )}
          {actionError && <ErrorBanner message={actionError} />}
        </div>
      </article>

      {canClaim && <ClaimForm itemId={item.id} onSubmitted={load} />}
      {!user && item.type === 'found' && item.status === 'open' && (
        <p className="card p-4 text-sm text-slate-600">
          <Link to="/login" state={{ from: { pathname: `/items/${item.id}` } }} className="font-semibold text-brand-700 underline">Log in</Link> to claim this item.
        </p>
      )}
      {myClaim && (
        <section className="card p-5" aria-labelledby="my-claim-h">
          <h2 id="my-claim-h" className="mb-2 text-lg font-semibold">Your claim</h2>
          <StatusBadge status={myClaim.status} />
          <p className="mt-2 text-sm"><span className="font-semibold">Message:</span> {myClaim.message}</p>
          <p className="mt-1 text-sm"><span className="font-semibold">Your proof:</span> {myClaim.proof}</p>
        </section>
      )}
      {canManage && (
        <section aria-labelledby="claims-h">
          <h2 id="claims-h" className="mb-3 text-lg font-semibold text-slate-900">Claims ({claims.length})</h2>
          <ClaimList claims={claims} onDecide={onDecide} busyId={busyId} />
        </section>
      )}
    </div>
  );
}
