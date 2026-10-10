import MovieCard from './MovieCard';

export default function MovieGrid({ movies }) {
  return (
    <ul className="movie-grid">
      {movies.map((movie) => (
        <li key={movie.id}>
          <MovieCard movie={movie} />
        </li>
      ))}
    </ul>
  );
}

// Same boxes as the real grid, so nothing moves when the movies arrive.
export function MovieGridSkeleton({ count = 20 }) {
  return (
    <div role="status" aria-label="Loading movies">
      <ul className="movie-grid" aria-hidden="true">
        {Array.from({ length: count }, (_, index) => (
          <li key={index}>
            <div className="movie-card">
              <div className="movie-card-poster skeleton" />
              <div className="movie-card-body">
                <div className="skeleton skeleton-line" />
                <div className="skeleton skeleton-line skeleton-line-short" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
