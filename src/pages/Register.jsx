import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { USERNAME_PATTERN } from '../lib/username';

export default function Register() {
  usePageTitle('Sign up');
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fields, setFields] = useState({ email: '', username: '', password: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set = (name) => (event) => setFields({ ...fields, [name]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const response = await register(fields);
      if (response.session) {
        navigate('/movies', { replace: true });
      } else {
        // The project requires email confirmation before the first login.
        setNotice(response.message || 'Check your email to confirm your account.');
      }
    } catch (err) {
      setError(err.message || 'Could not create your account');
    } finally {
      setSubmitting(false);
    }
  };

  if (notice) {
    return (
      <div className="auth-page">
        <div className="card auth-card" role="status">
          <h1>Almost there</h1>
          <p>{notice}</p>
          <Link to="/login" className="btn btn-primary btn-block">
            Go to log in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h1>Create your account</h1>

        {error && (
          <p className="alert alert-error" role="alert">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="register-email">Email</label>
            <input
              id="register-email"
              type="email"
              value={fields.email}
              onChange={set('email')}
              autoComplete="email"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="register-username">Username</label>
            <input
              id="register-username"
              type="text"
              value={fields.username}
              onChange={set('username')}
              autoComplete="username"
              pattern={USERNAME_PATTERN}
              aria-describedby="register-username-hint"
              required
            />
            <p id="register-username-hint" className="field-hint">
              3–30 letters, numbers, dots, dashes or underscores. Shown next to your reviews.
            </p>
          </div>
          <div className="field">
            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              type="password"
              value={fields.password}
              onChange={set('password')}
              autoComplete="new-password"
              minLength={6}
              aria-describedby="register-password-hint"
              required
            />
            <p id="register-password-hint" className="field-hint">
              At least 6 characters.
            </p>
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Sign up'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
