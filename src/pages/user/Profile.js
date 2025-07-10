import { useState, useEffect } from 'react';
import api from '../../api';
import './Profile.css';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ username: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.users.getProfile();
        setFormData({ username: response.data.username || '' });
        setError(null);
      } catch (err) {
        setError('Failed to load profile. Please try again.');
        console.error('Profile load error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchProfile();
  }, [user]);

const handleSubmit = async (e) => {
  e.preventDefault();
  setError(null);
  setSuccess(null);
  
  if (!formData.username.trim()) {
    setError('Username cannot be empty');
    return;
  }

  try {
    const response = await api.users.updateProfile({ 
      username: formData.username 
    });
    setFormData({ username: response.data.username });
    setSuccess('Profile updated successfully!');
  } catch (err) {
    setError(err.response?.data?.error || 'Update failed. Please try again.');
    console.error('Update failed:', err);
  }
};

  if (!user) return (
    <div className="auth-message">
      <p>Please login to view your profile</p>
      <Link to="/login" className="auth-link">Login</Link>
    </div>
  );

  if (loading) return <div className="loading">Loading profile...</div>;

  return (
    <div className="profile-container">
      <h1>Your Profile</h1>
      
      <div className="profile-card">
        <div className="profile-info">
          <div className="profile-field">
            <span className="field-label">Email:</span>
            <span className="field-value">{user.email}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="username" className="form-label">Username</label>
            <input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ username: e.target.value })}
              placeholder="Choose a username"
              className="form-input"
            />
          </div>
          
          {error && <div className="alert error">{error}</div>}
          {success && <div className="alert success">{success}</div>}

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              Update Profile
            </button>
          </div>
        </form>

        <div className="profile-actions">
          <Link to="/watchlist" className="btn-secondary">
            View Your Watchlist
          </Link>
        </div>
      </div>
    </div>
  );
}