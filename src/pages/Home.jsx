import { Link } from 'react-router-dom';
import api from '../api';
import MovieGrid, { MovieGridSkeleton } from '../components/MovieGrid';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks/useAsync';
import { usePageTitle } from '../hooks/usePageTitle';

const TOP_RATED_COUNT = 6;

export default function Home() {
  const { user } = useAuth();
  usePageTitle('');

  const topRated = useAsync(
    (signal) => api.movies.list({ sortBy: 'rating', limit: TOP_RATED_COUNT }, signal),
    'home-top-rated',
  );

  return (
    <>
      <section className="hero">
        <h1>Find your next favourite film</h1>
        <p>Browse 1,000 top-rated movies, keep a watchlist, and share what you thought.</p>
        <div className="hero-actions">
          <Link to="/movies" className="btn btn-primary btn-large">
            Browse movies
          </Link>
          {user ? (
            <Link to="/watchlist" className="btn btn-secondary btn-large">
              Your watchlist
            </Link>
          ) : (
            <Link to="/register" className="btn btn-secondary btn-large">
              Join now
            </Link>
          )}
        </div>
      </section>

      {/* If this request fails the rest of the page is still useful, so the section just hides. */}
      {topRated.status !== 'error' && (
        <section aria-labelledby="top-rated-heading">
          <div className="section-heading">
            <h2 id="top-rated-heading">Top rated</h2>
            <Link to="/movies?sortBy=rating">See all</Link>
          </div>
          {topRated.status === 'loading' ? (
            <MovieGridSkeleton count={TOP_RATED_COUNT} />
          ) : (
            <MovieGrid movies={topRated.data.data} />
          )}
        </section>
      )}

      <section aria-labelledby="features-heading">
        <h2 id="features-heading" className="visually-hidden">
          What you can do
        </h2>
        <ul className="feature-list">
          <li>
            <h3>Search and filter</h3>
            <p>Find films by title, genre, year or rating.</p>
          </li>
          <li>
            <h3>Personal watchlist</h3>
            <p>Save the movies you want to watch later.</p>
          </li>
          <li>
            <h3>Rate and review</h3>
            <p>Share your opinion and see what others think.</p>
          </li>
        </ul>
      </section>
    </>
  );
}
