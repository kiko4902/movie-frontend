// Home.js
import { Link } from 'react-router-dom';
import './Home.css';

export default function Home() {
  return (
    <div className="home-container">
      <div className="hero-section">
        <div className="hero-content">
          <h1>Welcome to MovieDB</h1>
          <p className="hero-subtitle">Discover, watch, and review your favorite films</p>
          <div className="hero-buttons">
            <Link to="/movies" className="btn-primary">
              Browse Movies
            </Link>
            <Link to="/register" className="btn-secondary">
              Join Now
            </Link>
          </div>
        </div>
      </div>

      <div className="features-section">
        <h2 className="section-title">Why Choose MovieDB?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🎬</div>
            <h3>Extensive Collection</h3>
            <p>Thousands of movies from classics to new releases</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">❤️</div>
            <h3>Personal Watchlist</h3>
            <p>Save movies you want to watch later</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⭐</div>
            <h3>Rate & Review</h3>
            <p>Share your opinions and see what others think</p>
          </div>
        </div>
      </div>

      <div className="cta-section">
        <h2>Ready to explore?</h2>
        <Link to="/movies" className="btn-primary btn-large">
          Start Browsing Movies
        </Link>
      </div>
    </div>
  );
}