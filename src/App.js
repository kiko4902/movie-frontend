import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import MovieList from './pages/movies/MovieList';
import MovieDetail from './pages/movies/MovieDetail';
import Watchlist from './pages/user/Watchlist';
import Profile from './pages/user/Profile';
import './components/Layout.css';
import Search from './pages/Search';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={!user ? <Login /> : <Navigate to="/" replace />} />
        <Route path="register" element={!user ? <Register /> : <Navigate to="/" replace />} />
        <Route path="movies" element={<MovieList />} />
        <Route path="movies/:id" element={<MovieDetail />} />
        <Route path="search" element={<Search />} />
        <Route path="watchlist" element={user ? <Watchlist /> : <Navigate to="/login" replace />} />
        <Route path="profile" element={user ? <Profile /> : <Navigate to="/login" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}