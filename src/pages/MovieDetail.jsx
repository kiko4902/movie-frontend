import { Link, useLocation, useParams } from 'react-router-dom';
import api from '../api';
import Poster from '../components/Poster';
import ReviewForm from '../components/ReviewForm';
import ReviewList from '../components/ReviewList';
import { EmptyState, ErrorState } from '../components/States';
import WatchlistButton from '../components/WatchlistButton';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAsync } from '../hooks/useAsync';
import { usePageTitle } from '../hooks/usePageTitle';

function DetailSkeleton() {
  return (
    <div className="movie-detail" role="status" aria-label="Loading movie">
      <div className="movie-detail-poster skeleton" />
      <div className="movie-detail-info" aria-hidden="true">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line skeleton-line-short" />
      </div>
    </div>
  );
}

const averageOf = (reviews) =>
  reviews.length === 0
    ? null
    : (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1);

export default function MovieDetail() {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const toast = useToast();

  // One request: the movie comes with its genres and reviews.
  const {
    status,
    data: movie,
    error,
    retry,
    setData,
  } = useAsync((signal) => api.movies.get(id, signal), `movie-${id}`);

  usePageTitle(movie ? `${movie.title}${movie.year ? ` (${movie.year})` : ''}` : 'Movie');

  if (status === 'loading') return <DetailSkeleton />;

  if (status === 'error') {
    // A missing movie and a malformed id are both "not found" to the visitor.
    if (error.status === 404 || error.status === 400) {
      return (
        <EmptyState title="Movie not found" action={{ to: '/movies', label: 'Browse all movies' }}>
          This movie does not exist or has been removed.
        </EmptyState>
      );
    }
    return <ErrorState title="Could not load this movie" error={error} onRetry={retry} />;
  }

  const setReviews = (update) =>
    setData((current) => ({ ...current, reviews: update(current.reviews) }));

  const createReview = async (fields) => {
    const review = await api.reviews.create(movie.id, fields);
    setReviews((reviews) => [review, ...reviews]);
    toast.success('Review posted');
  };

  const updateReview = async (reviewId, fields) => {
    const updated = await api.reviews.update(reviewId, fields);
    setReviews((reviews) => reviews.map((review) => (review.id === reviewId ? updated : review)));
    toast.success('Review updated');
  };

  // Resolves to whether the review was deleted, so the row can reset itself if not.
  const deleteReview = async (reviewId) => {
    try {
      await api.reviews.remove(reviewId);
      setReviews((reviews) => reviews.filter((review) => review.id !== reviewId));
      toast.success('Review deleted');
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    }
  };

  const userAverage = averageOf(movie.reviews);
  const hasReviewed = user && movie.reviews.some((review) => review.user_id === user.id);

  return (
    <article>
      <div className="movie-detail">
        <div className="movie-detail-poster">
          <Poster src={movie.poster_large_url} title={movie.title} eager />
        </div>

        <div className="movie-detail-info">
          <h1>
            {movie.title} {movie.year && <span className="muted">({movie.year})</span>}
          </h1>

          <dl className="facts">
            {movie.imdb_rating !== null && (
              <div>
                <dt>IMDb rating</dt>
                <dd>
                  <span aria-hidden="true">★</span> {movie.imdb_rating}/10
                </dd>
              </div>
            )}
            {userAverage && (
              <div>
                <dt>User rating</dt>
                <dd>
                  <span aria-hidden="true">★</span> {userAverage}/5
                </dd>
              </div>
            )}
            {movie.meta_score !== null && (
              <div>
                <dt>Metascore</dt>
                <dd>{movie.meta_score}</dd>
              </div>
            )}
            {movie.runtime && (
              <div>
                <dt>Runtime</dt>
                <dd>{movie.runtime}</dd>
              </div>
            )}
            {movie.certificate && (
              <div>
                <dt>Certificate</dt>
                <dd>{movie.certificate}</dd>
              </div>
            )}
            {movie.gross && (
              <div>
                <dt>Box office</dt>
                <dd>${movie.gross}</dd>
              </div>
            )}
          </dl>

          {movie.genres.length > 0 && (
            <ul className="chips" aria-label="Genres">
              {movie.genres.map((genre) => (
                <li key={genre.id}>
                  <Link className="chip" to={`/search?genres=${genre.id}`}>
                    {genre.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {movie.overview && <p className="overview">{movie.overview}</p>}

          <WatchlistButton movie={movie} variant="full" />
        </div>
      </div>

      <section className="reviews" aria-labelledby="reviews-heading">
        <h2 id="reviews-heading">
          Reviews{' '}
          {movie.reviews.length > 0 && <span className="muted">({movie.reviews.length})</span>}
        </h2>

        {!user && (
          <p className="notice">
            <Link to="/login" state={{ from: location.pathname }}>
              Log in
            </Link>{' '}
            to write a review.
          </p>
        )}
        {user && !hasReviewed && (
          <div className="card">
            <h3>Write a review</h3>
            <ReviewForm onSubmit={createReview} />
          </div>
        )}

        <ReviewList
          reviews={movie.reviews}
          currentUserId={user?.id}
          onUpdate={updateReview}
          onDelete={deleteReview}
        />
      </section>
    </article>
  );
}
