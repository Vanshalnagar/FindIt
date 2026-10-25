import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.me()
      .then((r) => active && setUser(r.user))
      .catch(() => active && setUser(null))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const login = useCallback(async (email, password) => {
    const r = await api.login({ email, password });
    setUser(r.user);
    return r.user;
  }, []);
  const register = useCallback(async (name, email, password) => {
    const r = await api.register({ name, email, password });
    setUser(r.user);
    return r.user;
  }, []);
  const logout = useCallback(async () => {
    try { await api.logout(); } finally { setUser(null); }
  }, []);

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
