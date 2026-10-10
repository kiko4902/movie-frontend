import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWatchlist } from '../context/WatchlistContext';

// variant "icon": round button over a poster. variant "full": labelled button.
export default function WatchlistButton({ movie, variant = 'icon' }) {
  const { user } = useAuth();
  const watchlist = useWatchlist();
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  const saved = watchlist.has(movie.id);
  const label = saved ? `Remove ${movie.title} from watchlist` : `Add ${movie.title} to watchlist`;

  const toggle = async () => {
    setBusy(true);
    await (saved ? watchlist.remove(movie) : watchlist.add(movie));
    setBusy(false);
  };

  return (
    <button
      type="button"
      className={`watchlist-btn watchlist-btn-${variant} ${saved ? 'is-saved' : ''}`}
      onClick={toggle}
      disabled={busy || watchlist.status === 'loading'}
      aria-pressed={saved}
      aria-label={variant === 'icon' ? label : undefined}
      title={variant === 'icon' ? label : undefined}
    >
      <span aria-hidden="true">{saved ? '✓' : '+'}</span>
      {variant === 'full' && <span>{saved ? 'In your watchlist' : 'Add to watchlist'}</span>}
    </button>
  );
}
