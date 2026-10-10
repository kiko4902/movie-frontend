import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import { EmptyState } from './components/States';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { WatchlistProvider } from './context/WatchlistContext';
import Home from './pages/Home';
import Login from './pages/Login';
import MovieDetail from './pages/MovieDetail';
import Movies from './pages/Movies';
import Profile from './pages/Profile';
import Register from './pages/Register';
import Search from './pages/Search';
import Watchlist from './pages/Watchlist';

// Sends visitors to the login page and remembers where they were going.
function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

// Login and sign-up are for visitors; once signed in, carry on to where they were going.
function GuestOnly({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (user) return <Navigate to={location.state?.from || '/movies'} replace />;
  return children;
}

function NotFound() {
  return (
    <EmptyState title="Page not found" action={{ to: '/', label: 'Go to the home page' }}>
      There is nothing at this address.
    </EmptyState>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="movies" element={<Movies />} />
        <Route path="movies/:id" element={<MovieDetail />} />
        <Route path="search" element={<Search />} />
        <Route
          path="login"
          element={
            <GuestOnly>
              <Login />
            </GuestOnly>
          }
        />
        <Route
          path="register"
          element={
            <GuestOnly>
              <Register />
            </GuestOnly>
          }
        />
        <Route
          path="watchlist"
          element={
            <RequireAuth>
              <Watchlist />
            </RequireAuth>
          }
        />
        <Route
          path="profile"
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

// Order matters: auth reports expiry through toasts, the watchlist needs the user.
export function Providers({ children }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <WatchlistProvider>{children}</WatchlistProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Providers>
        <AppRoutes />
      </Providers>
    </BrowserRouter>
  );
}
