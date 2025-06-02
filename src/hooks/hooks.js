import { useState, useEffect, useContext } from 'react';
import api from '../api';
import { AuthContext } from '../contexts/AuthContext';

let isRefreshing = false;
let isFetchingUser = false;

export function useProvideAuth() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      api.defaults.headers.common.Authorization = `Bearer ${storedToken}`;
      setToken(storedToken);
    } else {
      attemptRefreshToken();
    }
  }, []);

  useEffect(() => {
    if (!token || user || isFetchingUser) return;
    fetchUserProfile();
  }, [token]);

  const fetchUserProfile = async () => {
    isFetchingUser = true;
    setLoadingUser(true);
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user || res.data);
    } catch (err) {
      if (err.response?.status === 401) handleTokenFailure();
      else console.warn('⚠️ Fetch user error:', err.message);
    } finally {
      isFetchingUser = false;
      setLoadingUser(false);
    }
  };

  const login = async ({ email, password }) => {
    const res = await api.post('/auth/login', { email, password }, { withCredentials: true });
    const accessToken = res.data.token;
    localStorage.setItem('token', accessToken);
    api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
    setToken(accessToken);
    await fetchUserProfile();
    return accessToken;
  };

  const register = async ({ email, password, name }) => {
    const res = await api.post('/auth/register', { email, password, name });
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout', {}, { withCredentials: true });
    } catch {}
    localStorage.removeItem('token');
    delete api.defaults.headers.common.Authorization;
    setToken(null);
    setUser(null);
  };

  const attemptRefreshToken = async () => {
    if (isRefreshing) return;
    isRefreshing = true;
    try {
      const res = await api.post('/auth/refresh', {}, { withCredentials: true });
      const accessToken = res.data.token;
      localStorage.setItem('token', accessToken);
      api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
      setToken(accessToken);
    } catch {
      logout();
    } finally {
      isRefreshing = false;
    }
  };

  const handleTokenFailure = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common.Authorization;
    setToken(null);
    setUser(null);
  };

  return {
    token,
    user,
    isAuthenticated: Boolean(user),
    loadingUser,
    login,
    register,
    logout,
  };
}

// Hook to access context
export const useAuth = () => useContext(AuthContext);
