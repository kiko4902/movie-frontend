import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import MovieCard from '../../components/MovieCard';
import './Watchlist.css';

export default function Watchlist() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchWatchlist = async () => {
    try {
      const response = await api.watchlist.get();
      const moviesWithWatchlistFlag = (response.data || []).map(movie => ({
        ...movie,
        isInWatchlist: true
      }));
      setMovies(moviesWithWatchlistFlag);
      setError(null);
    } catch (err) {
      console.error('Watchlist error:', err);
      setError('Failed to load watchlist');
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (movieId) => {
    setMovies(movies.filter(movie => movie.id !== movieId));
  };

  useEffect(() => {
    if (user) {
      fetchWatchlist();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="watchlist-container">
        <h1>Your Watchlist</h1>
        <div className="auth-message">Please login to view your watchlist</div>
      </div>
    );
  }

  if (loading) return <div className="loading">Loading watchlist...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="watchlist-container">
      <h1>Your Watchlist</h1>
      
      {movies.length > 0 ? (
        <div className="movies-grid">
          {movies.map(movie => (
            <MovieCard 
              key={movie.id} 
              movie={movie}
              isWatchlistPage={true}
              onRemove={handleRemove}
            />
          ))}
        </div>
      ) : (
        <div className="empty-watchlist">
          <p>Your watchlist is empty</p>
          <Link to="/movies">Browse movies to add some</Link>
        </div>
      )}
    </div>
  );
}