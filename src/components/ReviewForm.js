import { useState } from 'react';
import './ReviewForm.css';

export default function ReviewForm({ movieId, onSubmit }) {
  const [formData, setFormData] = useState({
    rating: 5, 
    comment: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    if (!movieId || isNaN(Number(movieId))) {
      setError('Invalid movie ID');
      setIsSubmitting(false);
      return;
    }

    if (!formData.comment.trim()) {
      setError('Please write a review');
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        rating: Number(formData.rating),
        comment: formData.comment.trim()
      };

      if (onSubmit) {
        await onSubmit(payload);
        setFormData({
          rating: 5,
          comment: ''
        });
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'rating' ? Number(value) : value
    }));
  };

  return (
    <div className="review-form-container">
      <h3 className="review-form-title">Add Your Review</h3>
      {error && <p className="review-error">{error}</p>}
      
      <form className="review-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="rating">Rating</label>
          <select
            id="rating"
            name="rating"
            className="rating-select"
            value={formData.rating}
            onChange={handleChange}
            disabled={isSubmitting}
          >
            {[1, 2, 3, 4, 5].map(num => (
              <option key={num} value={num}>
                {'⭐'.repeat(num)} ({num}/5)
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="comment">Your Review</label>
          <textarea
            id="comment"
            name="comment"
            className="review-textarea"
            value={formData.comment}
            onChange={handleChange}
            placeholder="Share your thoughts about this movie..."
            rows="5"
            disabled={isSubmitting}
            required
            minLength="10"
          />
        </div>
        
        <button 
          type="submit" 
          className="submit-review-btn"
          disabled={isSubmitting || !formData.comment.trim()}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
}