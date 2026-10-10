import { useState } from 'react';
import ReviewForm from './ReviewForm';

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

function Review({ review, isOwn, onUpdate, onDelete }) {
  const [mode, setMode] = useState('view'); // view | edit | confirm-delete
  const [deleting, setDeleting] = useState(false);

  if (mode === 'edit') {
    return (
      <li className="review">
        <ReviewForm
          initial={review}
          submitLabel="Save changes"
          onCancel={() => setMode('view')}
          onSubmit={async (changes) => {
            await onUpdate(review.id, changes);
            setMode('view');
          }}
        />
      </li>
    );
  }

  const confirmDelete = async () => {
    setDeleting(true);
    const deleted = await onDelete(review.id);
    if (!deleted) {
      setDeleting(false);
      setMode('view');
    }
  };

  return (
    <li className="review">
      <div className="review-header">
        <strong>{review.username}</strong>
        <span className="rating" aria-label={`${review.rating} out of 5 stars`}>
          <span aria-hidden="true">
            {'★'.repeat(review.rating)}
            {'☆'.repeat(5 - review.rating)}
          </span>
        </span>
        <span className="muted">
          {formatDate(review.created_at)}
          {review.updated_at && ` · edited ${formatDate(review.updated_at)}`}
        </span>
      </div>

      {review.comment && <p className="review-comment">{review.comment}</p>}

      {isOwn && mode === 'view' && (
        <div className="review-actions">
          <button type="button" className="btn btn-ghost btn-small" onClick={() => setMode('edit')}>
            Edit
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-small"
            onClick={() => setMode('confirm-delete')}
          >
            Delete
          </button>
        </div>
      )}

      {isOwn && mode === 'confirm-delete' && (
        <div className="review-actions" role="group" aria-label="Confirm deleting your review">
          <span>Delete your review?</span>
          <button
            type="button"
            className="btn btn-danger btn-small"
            onClick={confirmDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting…' : 'Yes, delete'}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-small"
            onClick={() => setMode('view')}
            disabled={deleting}
          >
            Keep it
          </button>
        </div>
      )}
    </li>
  );
}

export default function ReviewList({ reviews, currentUserId, onUpdate, onDelete }) {
  if (reviews.length === 0) {
    return <p className="muted">No reviews yet. Be the first to write one.</p>;
  }

  return (
    <ul className="review-list">
      {reviews.map((review) => (
        <Review
          key={review.id}
          review={review}
          isOwn={review.user_id === currentUserId}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
