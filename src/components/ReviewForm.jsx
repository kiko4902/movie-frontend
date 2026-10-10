import { useId, useState } from 'react';

export const MAX_COMMENT_LENGTH = 500;

// Used both to write a new review and to edit an existing one (`initial`).
// `onSubmit` may reject; its message is shown in the form.
export default function ReviewForm({ initial, onSubmit, onCancel, submitLabel = 'Post review' }) {
  const id = useId();
  const [rating, setRating] = useState(initial?.rating ?? 5);
  const [comment, setComment] = useState(initial?.comment ?? '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await onSubmit({ rating, comment: comment.trim() });
      if (!initial) {
        setRating(5);
        setComment('');
      }
    } catch (err) {
      setError(err.message || 'Could not save your review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="review-form" onSubmit={handleSubmit} noValidate>
      {error && (
        <p className="alert alert-error" role="alert">
          {error}
        </p>
      )}

      <div className="field">
        <label htmlFor={`${id}-rating`}>Rating</label>
        <select
          id={`${id}-rating`}
          value={rating}
          onChange={(event) => setRating(Number(event.target.value))}
          disabled={submitting}
        >
          {[5, 4, 3, 2, 1].map((stars) => (
            <option key={stars} value={stars}>
              {stars} {stars === 1 ? 'star' : 'stars'}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor={`${id}-comment`}>Review (optional)</label>
        <textarea
          id={`${id}-comment`}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={4}
          maxLength={MAX_COMMENT_LENGTH}
          placeholder="What did you think?"
          disabled={submitting}
          aria-describedby={`${id}-count`}
        />
        <p id={`${id}-count`} className="field-hint">
          {comment.length}/{MAX_COMMENT_LENGTH} characters
        </p>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
