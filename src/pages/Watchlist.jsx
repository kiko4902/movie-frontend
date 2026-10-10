import MovieGrid, { MovieGridSkeleton } from '../components/MovieGrid';
import { EmptyState, ErrorState } from '../components/States';
import { useWatchlist } from '../context/WatchlistContext';
import { usePageTitle } from '../hooks/usePageTitle';

export default function Watchlist() {
  usePageTitle('Your watchlist');
  const { status, movies, error, retry } = useWatchlist();

  return (
    <>
      <h1>Your watchlist</h1>

      {status === 'loading' && <MovieGridSkeleton count={5} />}
      {status === 'error' && (
        <ErrorState title="Could not load your watchlist" error={error} onRetry={retry} />
      )}
      {status === 'ready' &&
        (movies.length === 0 ? (
          <EmptyState
            title="Your watchlist is empty"
            action={{ to: '/movies', label: 'Browse movies' }}
          >
            Use the + button on any movie to save it here.
          </EmptyState>
        ) : (
          <MovieGrid movies={movies} />
        ))}
    </>
  );
}
