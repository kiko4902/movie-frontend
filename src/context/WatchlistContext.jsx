import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const WatchlistContext = createContext(null);

const EMPTY = { userId: null, movies: [], error: null };

// The watchlist is fetched once per signed-in user and shared, so a grid of
// movie cards asks "is this one saved?" without any request of its own.
export function WatchlistProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const userId = user?.id ?? null;

  // Tagged with the user it belongs to, so a previous user's list is never shown.
  const [loaded, setLoaded] = useState(EMPTY);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    api.watchlist.list(controller.signal).then(
      (movies) => setLoaded({ userId, movies, error: null }),
      (error) => {
        if (!controller.signal.aborted) setLoaded({ userId, movies: [], error });
      },
    );
    return () => controller.abort();
  }, [userId, attempt]);

  const isCurrent = userId !== null && loaded.userId === userId;
  const movies = isCurrent ? loaded.movies : EMPTY.movies;
  const status = !userId ? 'idle' : !isCurrent ? 'loading' : loaded.error ? 'error' : 'ready';

  const ids = useMemo(() => new Set(movies.map((movie) => movie.id)), [movies]);

  const setMovies = useCallback((update) => {
    setLoaded((current) => ({ ...current, movies: update(current.movies) }));
  }, []);

  // Both update the UI straight away and undo it if the server refuses.
  const add = useCallback(
    async (movie) => {
      setMovies((list) => [
        { ...movie, added_at: new Date().toISOString() },
        ...list.filter((item) => item.id !== movie.id),
      ]);
      try {
        await api.watchlist.add(movie.id);
        toast.success(`Added “${movie.title}” to your watchlist`);
      } catch (err) {
        setMovies((list) => list.filter((item) => item.id !== movie.id));
        toast.error(err.message);
      }
    },
    [setMovies, toast],
  );

  const remove = useCallback(
    async (movie) => {
      setMovies((list) => list.filter((item) => item.id !== movie.id));
      try {
        await api.watchlist.remove(movie.id);
        toast.success(`Removed “${movie.title}” from your watchlist`);
      } catch (err) {
        // Reload rather than guess where the movie sat in the list.
        setAttempt((count) => count + 1);
        toast.error(err.message);
      }
    },
    [setMovies, toast],
  );

  const value = useMemo(
    () => ({
      status,
      movies,
      error: isCurrent ? loaded.error : null,
      has: (movieId) => ids.has(movieId),
      add,
      remove,
      retry: () => setAttempt((count) => count + 1),
    }),
    [status, movies, isCurrent, loaded.error, ids, add, remove],
  );

  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWatchlist() {
  return useContext(WatchlistContext);
}
