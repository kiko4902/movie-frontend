import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  // The menu remembers which page it was opened on, so following a link
  // closes it without an effect.
  const [menuOpenAt, setMenuOpenAt] = useState(null);
  const menuOpen = menuOpenAt === location.key;
  const toggleMenu = () => setMenuOpenAt(menuOpen ? null : location.key);

  return (
    <div className="app">
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <header className="site-header">
        <div className="site-header-inner">
          <Link to="/" className="logo">
            MovieDB
          </Link>

          <button
            type="button"
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="site-nav"
            onClick={toggleMenu}
          >
            <span className="menu-toggle-bars" aria-hidden="true" />
            <span className="visually-hidden">Menu</span>
          </button>

          <nav id="site-nav" className={`site-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Main">
            <div className="nav-links">
              <NavLink to="/movies">Movies</NavLink>
              <NavLink to="/search">Search</NavLink>
              {user && <NavLink to="/watchlist">Watchlist</NavLink>}
            </div>

            <div className="nav-account">
              {user ? (
                <>
                  <NavLink to="/profile" className="nav-user">
                    {user.username || user.email}
                  </NavLink>
                  <button type="button" className="btn btn-ghost" onClick={logout}>
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <NavLink to="/login">Log in</NavLink>
                  <Link to="/register" className="btn btn-primary">
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      <main id="main" className="site-main" tabIndex={-1}>
        <Outlet />
      </main>

      <footer className="site-footer">
        <p>© {new Date().getFullYear()} MovieDB by Kristian Dzoic</p>
        <p className="muted">
          Movie data from the IMDb Top 1000 dataset. Not affiliated with IMDb.
        </p>
      </footer>
    </div>
  );
}
