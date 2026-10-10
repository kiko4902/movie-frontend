// First, last, and the pages around the current one, with gaps marked by null.
function pageWindow(page, totalPages) {
  const wanted = new Set([1, totalPages, page - 1, page, page + 1]);
  const pages = [...wanted].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);

  const withGaps = [];
  for (const n of pages) {
    if (withGaps.length > 0 && n - withGaps.at(-1) > 1) withGaps.push(null);
    withGaps.push(n);
  }
  return withGaps;
}

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
      >
        Previous
      </button>

      <ul className="pagination-pages">
        {pageWindow(page, totalPages).map((n, index) =>
          n === null ? (
            <li key={`gap-${index}`} aria-hidden="true">
              …
            </li>
          ) : (
            <li key={n}>
              <button
                type="button"
                className={`btn btn-ghost ${n === page ? 'is-current' : ''}`}
                onClick={() => onChange(n)}
                aria-label={`Page ${n}`}
                aria-current={n === page ? 'page' : undefined}
              >
                {n}
              </button>
            </li>
          ),
        )}
      </ul>

      <span className="pagination-summary">
        Page {page} of {totalPages}
      </span>

      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
      >
        Next
      </button>
    </nav>
  );
}
