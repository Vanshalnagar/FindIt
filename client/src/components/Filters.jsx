import { useEffect, useState } from 'react';
import { CATEGORIES, STATUSES } from '../lib/constants.js';

export default function Filters({ values, onChange }) {
  const [search, setSearch] = useState(values.search || '');
  useEffect(() => setSearch(values.search || ''), [values.search]);

  const submit = (e) => {
    e.preventDefault();
    onChange({ ...values, search: search.trim() });
  };
  const set = (key) => (e) => onChange({ ...values, [key]: e.target.value });
  const hasFilters = values.search || values.type || values.category || values.status;

  return (
    <form onSubmit={submit} role="search" aria-label="Filter listings" className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
      <div>
        <label htmlFor="f-search" className="label">Search</label>
        <input id="f-search" type="search" className="input" placeholder="Title, description or location" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div>
        <label htmlFor="f-type" className="label">Type</label>
        <select id="f-type" className="input" value={values.type || ''} onChange={set('type')}>
          <option value="">All types</option>
          <option value="lost">Lost</option>
          <option value="found">Found</option>
        </select>
      </div>
      <div>
        <label htmlFor="f-category" className="label">Category</label>
        <select id="f-category" className="input" value={values.category || ''} onChange={set('category')}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="f-status" className="label">Status</label>
        <select id="f-status" className="input" value={values.status || ''} onChange={set('status')}>
          <option value="">Any status</option>
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
      <div className="flex items-end gap-2">
        <button type="submit" className="btn-primary">Search</button>
        {hasFilters && (
          <button type="button" className="btn-secondary" onClick={() => onChange({ search: '', type: '', category: '', status: '' })}>
            Clear
          </button>
        )}
      </div>
    </form>
  );
}
