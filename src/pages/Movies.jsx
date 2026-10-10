import { useSearchParams } from 'react-router-dom';
import api from '../api';
import MovieGrid, { MovieGridSkeleton } from '../components/MovieGrid';
import Pagination from '../components/Pagination';
import SortSelect from '../components/SortSelect';
import { EmptyState, ErrorState } from '../components/States';
import { useAsync } from '../hooks/useAsync';
import { usePageTitle } from '../hooks/usePageTitle';
import { DEFAULT_SORT, SORT_OPTIONS } from '../lib/sort';

const isSort = (value) => SORT_OPTIONS.some((option) => option.value === value);

export default function Movies() {
  usePageTitle('Movies');

  // Page and sort live in the URL, so they survive reload, back and sharing.
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number.parseInt(params.get('page'), 10) || 1);
  const sortBy = isSort(params.get('sortBy')) ? params.get('sortBy') : DEFAULT_SORT;

  const { status, data, error, retry } = useAsync(
    (signal) => api.movies.list({ page, sortBy }, signal),
    `movies-${page}-${sortBy}`,
  );

  const goTo = (nextPage, nextSort = sortBy) => {
    const next = {};
    if (nextSort !== DEFAULT_SORT) next.sortBy = nextSort;
    if (nextPage > 1) next.page = String(nextPage);
    setParams(next);
    window.scrollTo({ top: 0 });
  };

  return (
    <>
      <div className="page-heading">
        <h1>Movies</h1>
        <SortSelect id="movies-sort" value={sortBy} onChange={(value) => goTo(1, value)} />
      </div>

      {status === 'loading' && <MovieGridSkeleton />}
      {status === 'error' && (
        <ErrorState title="Could not load movies" error={error} onRetry={retry} />
      )}
      {status === 'ready' &&
        (data.data.length === 0 ? (
          <EmptyState
            title="No movies on this page"
            action={{ to: '/movies', label: 'Back to the first page' }}
          />
        ) : (
          <>
            <MovieGrid movies={data.data} />
            <Pagination
              page={data.pagination.page}
              totalPages={data.pagination.total_pages}
              onChange={(nextPage) => goTo(nextPage)}
            />
          </>
        ))}
    </>
  );
}
