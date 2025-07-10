import { useState, useEffect } from 'react';
import api from '../../api';
import MovieCard from '../../components/MovieCard';
import './MovieList.css';
import { useAuth } from '../../context/AuthContext';

export default function MovieList() {
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.movies.getPaginated(page);
        const moviesData = Array.isArray(response.data?.data) 
          ? response.data.data 
          : [];
        setMovies(moviesData);
        setTotalPages(Math.ceil(response.data?.pagination?.total / 20) || 1);
      } catch (err) {
        setError(err.message);
        console.error('Failed to load movies:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, [page]);

  if (loading) return <div className="loading">Loading movies...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!movies.length) return <div className="no-movies">No movies found</div>;

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <div className="movie-list-container">
      <h1>Movies</h1>
      <div className="movies-grid">
        {movies.map(movie => (
          <MovieCard 
            key={movie.id} 
            movie={movie} 
          />
        ))}
      </div>
      
      <div className="pagination">
        <button 
          onClick={() => handlePageChange(1)}
          disabled={page === 1}
          className="pagination-button"
        >
          First
        </button>
        
        <button 
          onClick={() => handlePageChange(page - 5)}
          disabled={page - 5 < 1}
          className="pagination-button"
        >
          -5
        </button>
        
        <button 
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
          className="pagination-button"
        >
          Previous
        </button>
        
        <span className="page-info">
          Page {page} of {totalPages}
        </span>
        
        <button 
          onClick={() => handlePageChange(page + 1)}
          disabled={page === totalPages}
          className="pagination-button"
        >
          Next
        </button>
        
        <button 
          onClick={() => handlePageChange(page + 5)}
          disabled={page + 5 > totalPages}
          className="pagination-button"
        >
          +5
        </button>
        
        <button 
          onClick={() => handlePageChange(totalPages)}
          disabled={page === totalPages}
          className="pagination-button"
        >
          Last
        </button>
      </div>
    </div>
  );
}