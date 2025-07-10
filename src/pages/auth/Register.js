import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import './AuthForms.css';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setIsSubmitting(true);
  
  try {
    await api.auth.signup(email, password);
    await login(email, password);
    navigate('/movies');
  } catch (err) {
    if (err.response?.data?.error.includes('already exists')) {
      setError('An account with this email already exists');
    } else {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    }
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="auth-container">
      <div className="auth-illustration">
        <h2>Join MovieDB</h2>
        <p>Create an account to save your favorite movies and build your watchlist.</p>
      </div>
      
      <div className="auth-form-container">
        <div className="auth-form">
          <h1>Create Account</h1>
          {error && <div className="alert alert-error">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password (min 6 characters)"
                minLength="6"
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}