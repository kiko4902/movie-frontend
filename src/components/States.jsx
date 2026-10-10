import { Link } from 'react-router-dom';

// What a page shows instead of content when a request failed.
export function ErrorState({ title = 'Something went wrong', error, onRetry }) {
  return (
    <div className="state state-error" role="alert">
      <h2>{title}</h2>
      <p>{error?.message || 'Please try again.'}</p>
      {onRetry && (
        <button type="button" className="btn btn-primary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

// What a page shows when the request worked and there is simply nothing there.
export function EmptyState({ title, children, action }) {
  return (
    <div className="state">
      <h2>{title}</h2>
      {children && <p>{children}</p>}
      {action && (
        <Link to={action.to} className="btn btn-primary">
          {action.label}
        </Link>
      )}
    </div>
  );
}
