import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import './MovieCard.css';

export default function MovieCard({ movie, isWatchlistPage = false, onRemove }) {
  const { user } = useAuth();
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const checkWatchlistStatus = async () => {
      if (user) {
        try {
          const response = await api.watchlist.get();
          const isInWatchlist = response.data.some(m => m.id === movie.id);
          setIsInWatchlist(isInWatchlist);
        } catch (err) {
          console.error('Error checking watchlist:', err);
        }
      }
    };
    checkWatchlistStatus();
  }, [user, movie.id]);

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating / 2);
    const hasHalfStar = rating % 2 >= 1;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<span key={i} className="star full">★</span>);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<span key={i} className="star half">★</span>);
      } else {
        stars.push(<span key={i} className="star">★</span>);
      }
    }
    
    return stars;
  };

  const handleWatchlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isUpdating || !user) return;
    
    setIsUpdating(true);
    try {
      await api.watchlist.toggle(movie.id);
      const newStatus = !isInWatchlist;
      setIsInWatchlist(newStatus);
      
      if (isWatchlistPage && !newStatus && onRemove) {
        onRemove(movie.id);
      }
    } catch (err) {
      console.error('Watchlist error:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Link to={`/movies/${movie.id}`} className="movie-card">
      <div className="card-poster">
        <img 
          src={movie.poster_url || '/placeholder-movie.jpg'} 
          alt={movie.title}
          loading="lazy"
        />
        <div className="card-overlay">
          {user && !isWatchlistPage && (
            <button 
              onClick={handleWatchlistToggle}
              className={`watchlist-btn ${isInWatchlist ? 'in-watchlist' : ''}`}
              disabled={isUpdating}
              aria-label={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
            >
              {isUpdating ? '...' : isInWatchlist ? "Remove from Watchlist" : "+ Add to Watchlist"}
            </button>
          )}
          {user && isWatchlistPage && (
            <button 
              onClick={handleWatchlistToggle}
              className="remove-from-watchlist-btn"
              disabled={isUpdating}
              aria-label="Remove from watchlist"
            >
              −
            </button>
          )}
        </div>
      </div>
      <div className="card-details">
        <h3 className="card-title" title={movie.title}>
          {movie.title}
        </h3>
        <div className="card-rating">
          <div className="stars">
            {renderStars(movie.imdb_rating)}
          </div>
          <span className="rating-text">{movie.imdb_rating}/10</span>
        </div>
        <p className="card-year">{movie.release_date || 'N/A'}</p>
      </div>
    </Link>
  );
}