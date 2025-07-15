import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-container">
      <header className="app-header">
        <nav>
          <Link to="/" className="nav-logo">MovieDB</Link>
          <div className="nav-links">
            <Link to="/movies">Movies</Link>
            <Link to="/search">Search</Link>
            {user && <Link to="/watchlist">Watchlist</Link>}
          </div>
          
          {user ? (
            <>
              <div className="user-info">
                Logged in as: <span>{user.email}</span>
              </div>
              <div className="auth-buttons">
                <Link to="/profile" className="profile-btn">
                  Profile
                </Link>
                <button onClick={logout} className="logout-btn">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="login-btn">
                Login
              </Link>
              <Link to="/register" className="register-btn">
                Register
              </Link>
            </div>
          )}
        </nav>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <footer className="app-footer">
        © {new Date().getFullYear()} MovieDB by Kristian Dzoic
      </footer>
    </div>
  );
}