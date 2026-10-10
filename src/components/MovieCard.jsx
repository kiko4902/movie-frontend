import { Link } from 'react-router-dom';
import Poster from './Poster';
import WatchlistButton from './WatchlistButton';

// The link and the watchlist button are siblings, not nested: a button inside
// a link is invalid HTML and unusable with a keyboard or screen reader.
export default function MovieCard({ movie }) {
  return (
    <article className="movie-card">
      <Link to={`/movies/${movie.id}`} className="movie-card-link">
        <div className="movie-card-poster">
          <Poster src={movie.poster_thumb_url} title={movie.title} />
        </div>
        <div className="movie-card-body">
          <h3 className="movie-card-title">{movie.title}</h3>
          <p className="movie-card-meta">
            <span>{movie.year ?? 'Year unknown'}</span>
            {movie.imdb_rating !== null && (
              <span className="rating" aria-label={`IMDb rating ${movie.imdb_rating} out of 10`}>
                <span aria-hidden="true">★</span> {movie.imdb_rating}
              </span>
            )}
          </p>
        </div>
      </Link>
      <WatchlistButton movie={movie} />
    </article>
  );
}
