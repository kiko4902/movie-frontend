import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthButtons.css'; 

export default function AuthButtons() {
  const { user, logout } = useAuth();

  return user ? (
    <div className="auth-buttons">
      <Link to="/profile" className="profile-btn">
        Profile
      </Link>
      <button onClick={logout} className="logout-btn">
        Logout
      </button>
    </div>
  ) : (
    <div className="auth-buttons">
      <Link to="/login" className="login-btn">
        Login
      </Link>
      <Link to="/register" className="register-btn">
        Register
      </Link>
    </div>
  );
}