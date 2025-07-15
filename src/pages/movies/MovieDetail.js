import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import ReviewForm from '../../components/ReviewForm';
import api from '../../api';
import './MovieDetail.css';

export default function MovieDetail() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(null);
  const [hasUserReviewed, setHasUserReviewed] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editReviewData, setEditReviewData] = useState({ rating: 0, comment: '' });
  const { user } = useAuth();

  useEffect(() => {
    console.log('Initial editReviewData:', editReviewData, 'Type:', typeof editReviewData.rating);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [movieResponse, watchlistResponse, reviewsResponse] = await Promise.all([
          api.movies.getById(id),
          user ? api.watchlist.get() : Promise.resolve({data: []}),
          api.reviews.getForMovie(id)
        ]);

        const movieData = transformMovieData(movieResponse.data);
        setMovie(movieData);

        if (user) {
          setIsInWatchlist(watchlistResponse.data.some(m => m.id === movieData.id));
          const userReviews = reviewsResponse.data.filter(review => review.user_id === user.id);
          setHasUserReviewed(userReviews.length > 0);
        }

        const formattedReviews = reviewsResponse.data.map(review => {
          const numRating = Number(review.rating);
          console.log('Review from API:', {
            id: review.id,
            originalRating: review.rating,
            originalType: typeof review.rating,
            convertedRating: numRating,
            convertedType: typeof numRating
          });
          
          return {
            ...review,
            rating: numRating,
            created_at: new Date(review.created_at).toISOString(),
            updated_at: review.updated_at ? new Date(review.updated_at).toISOString() : null
          };
        });

        setReviews(formattedReviews || []);
        
        if (reviewsResponse.data?.length > 0) {
          const total = formattedReviews.reduce((sum, review) => sum + review.rating, 0);
          setAverageRating((total / formattedReviews.length).toFixed(1));
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, user]);

  const handleWatchlistToggle = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      await api.watchlist.toggle(movie.id);
      setIsInWatchlist(!isInWatchlist);
    } catch (err) {
      console.error('Watchlist error:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReviewSubmit = async (reviewData) => {
    try {
      const finalRating = Number(reviewData.rating);
      if (isNaN(finalRating)) {
        throw new Error(`Invalid rating value: ${reviewData.rating}`);
      }

      const response = await api.reviews.create(movie.id, {
        rating: finalRating,
        comment: reviewData.comment
      });

      const newReview = {
        ...response.data,
        username: response.data.username || user?.email || 'Anonymous',
        user_id: user?.id,
        rating: Number(response.data.rating), 
        created_at: new Date().toISOString()
      };

      setReviews(prev => [...prev, newReview]);
      setHasUserReviewed(true);
      
      const total = [...reviews, newReview].reduce((sum, r) => sum + r.rating, 0);
      setAverageRating((total / (reviews.length + 1)).toFixed(1));

      console.groupEnd();
    } catch (err) {
      console.error('REVIEW SUBMISSION ERROR:', {
        message: err.message,
        response: err.response?.data,
        requestData: err.config?.data,
        ratingType: typeof err.config?.data?.rating
      });
      
      if (err.response?.data?.error?.includes('must be a number')) {
        alert('SERVER ERROR: Rating must be a number between 1-5');
      } else {
        alert(`Error: ${err.response?.data?.error || err.message}`);
      }
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await api.reviews.delete(reviewId);
      const updatedReviews = reviews.filter(r => r.id !== reviewId);
      setReviews(updatedReviews);
      setHasUserReviewed(false);
      
      if (updatedReviews.length > 0) {
        const total = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
        setAverageRating((total / updatedReviews.length).toFixed(1));
      } else {
        setAverageRating(null);
      }
    } catch (err) {
      console.error('Failed to delete review:', err);
    }
  };

  const handleEditReview = (review) => {
    console.log('Editing review:', {
      review,
      ratingType: typeof review.rating
    });
    setEditingReviewId(review.id);
    setEditReviewData({
      rating: review.rating,
      comment: review.comment
    });
  };

  const handleEditSubmit = async (reviewId) => {
    try {
      console.group('Updating Review');
      console.log('Current editReviewData:', editReviewData);
      console.log('Rating type before conversion:', typeof editReviewData.rating);
      
      const ratingValue = +editReviewData.rating;
      console.log('Converted rating:', ratingValue, 'Type:', typeof ratingValue);

      if (typeof ratingValue !== 'number' || isNaN(ratingValue)) {
        throw new Error(`Invalid rating value: ${editReviewData.rating}`);
      }

      const payload = {
        rating: ratingValue,
        comment: editReviewData.comment
      };

      console.log('Update payload:', payload);
      console.log('Payload rating type:', typeof payload.rating);

      const response = await api.reviews.update(reviewId, payload);
      console.log('API response:', response.data);
      
      const updatedReview = {
        ...response.data,
        username: reviews.find(r => r.id === reviewId)?.username || 'Anonymous',
        updated_at: new Date().toISOString(),
        rating: +response.data.rating
      };

      console.log('Updated review:', updatedReview);
      
      setReviews(reviews.map(r => r.id === reviewId ? updatedReview : r));
      
      const total = reviews.reduce((sum, r) => sum + (r.id === reviewId ? ratingValue : r.rating), 0);
      setAverageRating((total / reviews.length).toFixed(1));
      
      setEditingReviewId(null);
      console.groupEnd();
    } catch (err) {
      console.group('Review Update Error');
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        requestPayload: {
          rating: editReviewData.rating,
          type: typeof editReviewData.rating
        },
        stack: err.stack
      });
      console.groupEnd();
      
      alert(`Failed to update review: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleEditCancel = () => {
    setEditingReviewId(null);
  };

  const transformMovieData = (data) => {
    return {
      ...data,
      poster_url: data.poster_url?.includes('m.media-amazon.com') 
        ? data.poster_url.replace('_V1_UX67_CR0,0,67,98_AL_', '_V1_UX512_CR0,0,512,750_AL_')
        : data.poster_url
    };
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!movie) return <div className="error">Movie not found</div>;

  return (
    <div className="movie-detail-container">
      <div className="movie-header">
        <img 
          src={movie.poster_url} 
          alt={movie.title}
          className="movie-poster"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/placeholder-movie.png';
          }}
        />
        <div className="movie-info">
          <h1>{movie.title} ({new Date(movie.release_date).getFullYear()})</h1>
          
          {user && (
            <button 
              onClick={handleWatchlistToggle}
              className={`watchlist-btn ${isInWatchlist ? 'in-watchlist' : ''}`}
              disabled={isUpdating}
            >
              {isUpdating ? '...' : isInWatchlist ? "Remove from Watchlist" : "+ Add to Watchlist"}
            </button>
          )}
          
          <div className="movie-meta">
            {movie.certificate && <span>{movie.certificate}</span>}
            {movie.runtime && <span>{movie.runtime}</span>}
            <span className="rating-badge imdb">
              IMDb ⭐ {movie.imdb_rating}/10
            </span>
            {averageRating && (
              <span className="rating-badge user">
                User ⭐ {averageRating}/5
              </span>
            )}
            {movie.meta_score && <span>Metascore: {movie.meta_score}</span>}
          </div>
          
          <p className="overview">{movie.overview}</p>
          
          {movie.gross && <p><strong>Box Office:</strong> ${movie.gross}</p>}
          
          {movie.genres && movie.genres.length > 0 && (
            <div className="genres">
              {movie.genres.map(genre => (
                <span key={genre.name} className="genre-tag">{genre.name}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      <section>
        <h2 className="section-title">Reviews</h2>
        
        {user ? (
          hasUserReviewed ? (
            <div className="review-notice">
              <p>You've already reviewed this movie.</p>
            </div>
          ) : (
            <div className="review-form-container">
              <h3>Write a Review</h3>
              <ReviewForm movieId={id} onSubmit={handleReviewSubmit} />
            </div>
          )
        ) : (
          <div className="review-notice">
            <p>Please log in to write a review.</p>
          </div>
        )}
        
        <div className="reviews-container">
          {reviews.length > 0 ? (
            <>
              {reviews.map(review => (
                <div key={review.id} className="review-card">
                  {editingReviewId === review.id ? (
                    <div className="edit-review-form">
                      <select
                        value={editReviewData.rating}
                        onChange={(e) => {
                          const num = Number(e.target.value); 
                          setEditReviewData({
                            ...editReviewData,
                            rating: num
                          });
                        }}
                      >
                        {[1, 2, 3, 4, 5].map(num => (
                          <option key={num} value={num}>{num} stars</option>
                        ))}
                      </select>
                      <textarea
                        value={editReviewData.comment}
                        onChange={(e) => setEditReviewData({
                          ...editReviewData,
                          comment: e.target.value
                        })}
                      />
                      <div className="edit-actions">
                        <button onClick={() => handleEditSubmit(review.id)}>Save</button>
                        <button onClick={handleEditCancel}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="review-header">
                        <span className="review-author">
                          {review.username || 'Anonymous'}
                        </span>
                        <span className="review-rating">⭐ {review.rating}/5</span>
                        {user?.id === review.user_id && (
                          <div className="review-actions">
                            <button 
                              onClick={() => handleEditReview(review)}
                              className="edit-review-btn"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteReview(review.id)}
                              className="delete-review-btn"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                        <span className="review-date">
                          {new Date(review.created_at).toLocaleDateString()}
                          {review.updated_at && ` (edited ${new Date(review.updated_at).toLocaleDateString()})`}
                        </span>
                      </div>
                      <p className="review-content">{review.comment}</p>
                    </>
                  )}
                </div>
              ))}
            </>
          ) : (
            <p>No reviews yet. Be the first to review!</p>
          )}
        </div>
      </section>
    </div>
  );
}