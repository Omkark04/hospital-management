import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, logout as apiLogout, getProfile } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      getProfile()
        .then(({ data }) => setUser(data))
        .catch(() => {
          localStorage.clear();
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (username, password) => {
    const { data } = await apiLogin(username, password);
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    setUser({
      id: data.user_id,
      username: data.username,
      full_name: data.full_name,
      role: data.role,
      branch_id: data.branch_id,
      branch_name: data.branch_name,
    });
    return data.role;
  }, []);

  const logout = useCallback(async () => {
    const refresh = localStorage.getItem('refresh_token');
    try { await apiLogout(refresh); } catch { /* ignore */ }
    localStorage.clear();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const { data } = await getProfile();
    setUser(data);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export default AuthContext;
