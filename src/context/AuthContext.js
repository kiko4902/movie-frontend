import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUserFromSession = () => {
    try {
      const session = JSON.parse(localStorage.getItem('supabase_session'));
      if (session?.user) {
        setUser(session.user);
        return true;
      }
    } catch (error) {
      console.error('Error loading session:', error);
    }
    return false;
  };

  useEffect(() => {
    loadUserFromSession();
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await api.auth.login(email, password);
    localStorage.setItem('supabase_session', JSON.stringify(response.data));
    setUser(response.data.user);
    return response;
  };

  const logout = () => {
    localStorage.removeItem('supabase_session');
    setUser(null);
    window.location.href = '/';
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}