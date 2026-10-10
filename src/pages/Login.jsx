import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';

const DEMO_ENABLED = import.meta.env.VITE_ENABLE_DEMO === 'true';

export default function Login() {
  usePageTitle('Log in');
  const { login, loginAsDemo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(null); // 'login' | 'demo' | null

  // Back to the page that asked for a login, if there was one.
  const destination = location.state?.from || '/movies';

  const run = async (kind, signIn) => {
    setError('');
    setPending(kind);
    try {
      await signIn();
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message || 'Could not log in');
      setPending(null);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    run('login', () => login(email, password));
  };

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h1>Log in</h1>

        {error && (
          <p className="alert alert-error" role="alert">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={pending !== null}>
            {pending === 'login' ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        {DEMO_ENABLED && (
          <div className="demo-login">
            <p className="muted">Just looking around?</p>
            <button
              type="button"
              className="btn btn-secondary btn-block"
              onClick={() => run('demo', loginAsDemo)}
              disabled={pending !== null}
            >
              {pending === 'demo' ? 'Starting demo…' : 'Try the demo account'}
            </button>
          </div>
        )}

        <p className="auth-footer">
          No account yet? <Link to="/register">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
