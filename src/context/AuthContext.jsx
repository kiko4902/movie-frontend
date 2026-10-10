import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { sessionStore } from '../api';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const toast = useToast();
  const [stored, setStored] = useState(() => sessionStore.get());

  useEffect(() => {
    const unsubscribe = sessionStore.subscribe(setStored);
    const unsubscribeExpired = sessionStore.onExpired(() => {
      toast.error('Your session has expired. Please sign in again.');
    });
    // Signing in or out in another tab updates this one too.
    const onStorage = () => setStored(sessionStore.get());
    window.addEventListener('storage', onStorage);
    return () => {
      unsubscribe();
      unsubscribeExpired();
      window.removeEventListener('storage', onStorage);
    };
  }, [toast]);

  // Each of these resolves with the API response; a response without a
  // session means the account still needs email confirmation.
  const start = useCallback((response) => {
    if (response.session) sessionStore.set(response);
    return response;
  }, []);

  const login = useCallback(
    (email, password) => api.auth.login(email, password).then(start),
    [start],
  );
  const register = useCallback((fields) => api.auth.register(fields).then(start), [start]);
  const loginAsDemo = useCallback(() => api.auth.demo().then(start), [start]);
  const logout = useCallback(() => sessionStore.set(null), []);

  const updateUser = useCallback((changes) => {
    const current = sessionStore.get();
    if (current) sessionStore.set({ ...current, user: { ...current.user, ...changes } });
  }, []);

  const user = stored?.user ?? null;
  const value = useMemo(
    () => ({ user, login, register, loginAsDemo, logout, updateUser }),
    [user, login, register, loginAsDemo, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
