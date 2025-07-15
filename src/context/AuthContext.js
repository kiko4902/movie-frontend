import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../api';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const expiryTimeoutRef = useRef(null);

  const clearSession = useCallback(() => {
    localStorage.removeItem('supabase_session');
    setUser(null);
    if (expiryTimeoutRef.current) {
      clearTimeout(expiryTimeoutRef.current);
      expiryTimeoutRef.current = null;
    }
  }, []);

  const logout = useCallback(() => {
    clearSession();
    window.location.href = '/login';
  }, [clearSession]);

  const getTokenExpiration = (token) => {
    try {
      const decoded = jwtDecode(token);
      return decoded.exp * 1000; 
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  const setSession = useCallback((sessionData) => {
    if (!sessionData?.session?.access_token) {
      clearSession();
      return;
    }

    const expiresAt = getTokenExpiration(sessionData.session.access_token);
    //const expiresAt = new Date().getTime() + (60 * 1000);
    if (!expiresAt) {
      clearSession();
      return;
    }

    localStorage.setItem('supabase_session', JSON.stringify(sessionData));
    setUser(sessionData.user);
    
    if (expiryTimeoutRef.current) {
      clearTimeout(expiryTimeoutRef.current);
    }
    
    const now = new Date().getTime();
    const timeoutDuration = expiresAt - now;
    
    if (timeoutDuration > 0) {
      expiryTimeoutRef.current = setTimeout(() => {
        logout();
      }, timeoutDuration);
    } else {
      clearSession();
    }
  }, [clearSession, logout]);

  const loadUserFromSession = useCallback(() => {
    try {
      const session = JSON.parse(localStorage.getItem('supabase_session'));
      if (!session?.session?.access_token) {
        clearSession();
        return false;
      }
      
      const expiresAt = getTokenExpiration(session.session.access_token);
      const now = new Date().getTime();
      
      if (!expiresAt || now > expiresAt) {
        clearSession();
        return false;
      }
      
      setUser(session.user);
      
      const remainingTime = expiresAt - now;
      if (remainingTime > 0) {
        expiryTimeoutRef.current = setTimeout(() => {
          logout();
        }, remainingTime);
      } else {
        clearSession();
      }
      
      return true;
    } catch (error) {
      console.error('Session load error:', error);
      clearSession();
      return false;
    }
  }, [clearSession, logout]);

  const login = async (email, password) => {
    const response = await api.auth.login(email, password);
    setSession(response.data);
    return response;
  };

  useEffect(() => {
    loadUserFromSession();
    setLoading(false);

    return () => {
      if (expiryTimeoutRef.current) {
        clearTimeout(expiryTimeoutRef.current);
      }
    };
  }, [loadUserFromSession]);

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