function pageList(page, total) {
  const pages = new Set([1, total, page, page - 1, page + 1]);
  const list = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  list.forEach((p, i) => {
    if (i > 0 && p - list[i - 1] > 1) out.push('gap-' + p);
    out.push(p);
  });
  return out;
}

export default function Pagination({ page, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-8 flex flex-wrap items-center justify-center gap-1">
      <button type="button" className="btn-secondary btn-sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Previous
      </button>
      {pageList(page, totalPages).map((p) =>
        typeof p === 'string' ? (
          <span key={p} aria-hidden="true" className="px-1 text-slate-400">...</span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-label={`Page ${p}`}
            aria-current={p === page ? 'page' : undefined}
            className={`btn btn-sm ${p === page ? 'bg-brand-600 text-white' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}`}
          >
            {p}
          </button>
        )
      )}
      <button type="button" className="btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        Next
      </button>
    </nav>
  );
}
