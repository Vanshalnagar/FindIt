import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge.jsx';
import { categoryLabel, formatDate } from '../lib/constants.js';

export default function ItemCard({ item }) {
  return (
    <article className="card flex flex-col overflow-hidden transition hover:shadow-md">
      <Link to={`/items/${item.id}`} className="flex h-full flex-col focus-visible:ring-offset-0" aria-label={`${item.type} item: ${item.title}`}>
        <div className="relative aspect-[4/3] bg-slate-100">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl text-slate-300" aria-hidden="true">
              {item.type === 'lost' ? '?' : '!'}
            </div>
          )}
          <div className="absolute left-2 top-2 flex gap-1">
            <StatusBadge status={item.type} />
            {item.hidden && <StatusBadge status="hidden" />}
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 text-base font-semibold text-slate-900">{item.title}</h3>
            <StatusBadge status={item.status} />
          </div>
          <p className="line-clamp-2 text-sm text-slate-600">{item.description}</p>
          <dl className="mt-auto grid gap-0.5 text-xs text-slate-500">
            <div className="flex gap-1"><dt className="sr-only">Category</dt><dd>{categoryLabel(item.category)}</dd></div>
            <div className="flex gap-1"><dt className="sr-only">Location</dt><dd>{item.location}</dd></div>
            <div className="flex gap-1"><dt className="sr-only">Date</dt><dd>{formatDate(item.date)}</dd></div>
          </dl>
        </div>
      </Link>
    </article>
  );
}
