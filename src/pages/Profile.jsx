import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { ErrorState } from '../components/States';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAsync } from '../hooks/useAsync';
import { usePageTitle } from '../hooks/usePageTitle';
import { USERNAME_PATTERN } from '../lib/username';

function UsernameForm({ profile }) {
  const { updateUser } = useAuth();
  const toast = useToast();
  const [username, setUsername] = useState(profile.username);
  const [saved, setSaved] = useState(profile.username);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const updated = await api.users.updateProfile({ username: username.trim() });
      setUsername(updated.username);
      setSaved(updated.username);
      updateUser({ username: updated.username }); // the header shows it
      toast.success('Username updated');
    } catch (err) {
      setError(err.message || 'Could not update your username');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <p className="alert alert-error" role="alert">
          {error}
        </p>
      )}
      <div className="field">
        <label htmlFor="profile-username">Username</label>
        <input
          id="profile-username"
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          pattern={USERNAME_PATTERN}
          autoComplete="username"
          aria-describedby="profile-username-hint"
          required
        />
        <p id="profile-username-hint" className="field-hint">
          3–30 letters, numbers, dots, dashes or underscores. Shown next to your reviews.
        </p>
      </div>
      <button
        type="submit"
        className="btn btn-primary"
        disabled={saving || username.trim() === saved}
      >
        {saving ? 'Saving…' : 'Save username'}
      </button>
    </form>
  );
}

export default function Profile() {
  usePageTitle('Your profile');
  const { user } = useAuth();
  const {
    status,
    data: profile,
    error,
    retry,
  } = useAsync((signal) => api.users.getProfile(signal), `profile-${user.id}`);

  return (
    <div className="narrow">
      <h1>Your profile</h1>

      {status === 'loading' && (
        <div className="card" role="status" aria-label="Loading profile">
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line skeleton-line-short" />
        </div>
      )}
      {status === 'error' && (
        <ErrorState title="Could not load your profile" error={error} onRetry={retry} />
      )}
      {status === 'ready' && (
        <div className="card">
          <dl className="facts">
            <div>
              <dt>Email</dt>
              <dd>{profile.email}</dd>
            </div>
            <div>
              <dt>Member since</dt>
              <dd>{new Date(profile.created_at).toLocaleDateString()}</dd>
            </div>
          </dl>
          <UsernameForm profile={profile} />
          <p>
            <Link to="/watchlist">Go to your watchlist</Link>
          </p>
        </div>
      )}
    </div>
  );
}
