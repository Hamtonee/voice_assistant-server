// src/contexts/AuthContext.jsx
import React, {
  createContext,
  useState,
  useEffect,
  useCallback
} from 'react';
import api from '../api';
import LottieLoader from '../components/LottieLoader';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext({
  token: null,
  user: null,
  isAuthenticated: false,
  loadingUser: true,
  sessionConflict: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  setUser: () => {},
  clearSessionConflict: () => {},
  forceLogin: async () => {},
});

export function AuthProvider({ children }) {
  // initialize from localStorage
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [sessionConflict, setSessionConflict] = useState(null);
  const navigate = useNavigate();

  // clear auth state + cancel any scheduled refresh
  const clearAuth = useCallback(() => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common.Authorization;
    setToken(null);
    setUser(null);
    if (window._refreshTimeout) {
      clearTimeout(window._refreshTimeout);
      delete window._refreshTimeout;
    }
  }, []);

  // always send credentials (if you use cookies)
  useEffect(() => {
    api.defaults.withCredentials = true;
  }, []);

  // Enhanced response interceptor to handle session conflicts with visual feedback
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          const errorCode = error.response?.data?.code;
          
          if (errorCode === 'SESSION_CONFLICT' || errorCode === 'SESSION_UPGRADE_REQUIRED') {
            setSessionConflict({
              message: error.response.data.error || 'You have been logged out because you logged in elsewhere.',
            });
            clearAuth();
            
            // Show immediate visual feedback
            if (typeof window !== 'undefined') {
              // Create a toast notification
              const notification = document.createElement('div');
              notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #ef4444;
                color: white;
                padding: 16px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                font-family: sans-serif;
                max-width: 300px;
              `;
              notification.innerHTML = `
                <strong>Session Expired</strong><br>
                You have been logged out because you logged in elsewhere.
              `;
              document.body.appendChild(notification);
              
              // Remove notification after 5 seconds
              setTimeout(() => {
                if (notification.parentNode) {
                  notification.parentNode.removeChild(notification);
                }
              }, 5000);
            }
            
            // Show browser notification if permitted
            if (typeof window !== 'undefined' && 'Notification' in window) {
              if (Notification.permission === 'granted') {
                new Notification('Session Expired', {
                  body: 'You have been logged out because you logged in elsewhere.',
                  icon: '/favicon.ico'
                });
              }
            }
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, [clearAuth]);

  // this function both refreshes the token AND schedules the next refresh
  const refreshAndSchedule = useCallback(async () => {
    try {
      const res = await api.post('/auth/refresh');
      const newToken = res.data.token;

      // persist & apply
      localStorage.setItem('token', newToken);
      api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
      setToken(newToken);

      // schedule the next one 1 minute before expiry
      const { exp } = jwtDecode(newToken);               // exp is in seconds
      const expiresInMs = exp * 1000 - Date.now();
      const buffer = 60 * 1000;                          // 1 minute
      const timeout = Math.max(expiresInMs - buffer, 0);

      if (window._refreshTimeout) clearTimeout(window._refreshTimeout);
      window._refreshTimeout = setTimeout(
        () => refreshAndSchedule(),
        timeout
      );
    } catch (err) {
      console.warn('⚠️ Silent refresh failed', err);
      clearAuth();
    } finally {
      // Only set loading to false during initialization, not during refresh
      if (initializing) {
        setLoadingUser(false);
        setInitializing(false);
      }
    }
  }, [clearAuth, initializing]);

  // on mount: either schedule based on existing token, or do an initial silent refresh
  useEffect(() => {
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;

      // schedule next refresh from this token
      const { exp } = jwtDecode(token);
      const expiresInMs = exp * 1000 - Date.now();
      const buffer = 60 * 1000;
      const timeout = Math.max(expiresInMs - buffer, 0);

      if (window._refreshTimeout) clearTimeout(window._refreshTimeout);
      window._refreshTimeout = setTimeout(
        () => refreshAndSchedule(),
        timeout
      );

      // Don't set loading to false here - let the user profile fetch handle it
    } else {
      // no token yet? try to get one from refresh endpoint
      refreshAndSchedule();
    }
  }, [token, refreshAndSchedule]);

  // once we have a valid token, fetch the user profile
  useEffect(() => {
    if (!token) {
      // No token means not authenticated
      setUser(null);
      if (initializing) {
        setLoadingUser(false);
        setInitializing(false);
      }
      return;
    }

    // Keep loading true while fetching user
    setLoadingUser(true);

    api.get('/auth/me')
      .then(res => {
        setUser(res.data.user ?? res.data);
      })
      .catch(err => {
        console.error('🔒 /auth/me failed', err);
        clearAuth();
      })
      .finally(() => {
        setLoadingUser(false);
        setInitializing(false);
      });
  }, [token, clearAuth, initializing]);

  // LOGIN: get token, persist it, schedule the silent refresh, then load profile
  // FIXED: Only navigate on complete success, always re-throw errors
  const login = async ({ email, password }, forceNewSession = false) => {
    try {
      const payload = { email, password };
      
      // Only add forceNewSession if explicitly set to true
      if (forceNewSession === true) {
        payload.forceNewSession = true;
      }
      
      // Step 1: API login call
      const res = await api.post('/auth/login', payload);
      const newToken = res.data.token;

      // Step 2: Clear any session conflict
      setSessionConflict(null);

      // Step 3: Persist & apply token
      localStorage.setItem('token', newToken);
      api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
      setToken(newToken);

      // Step 4: Schedule the refresh cycle
      const { exp } = jwtDecode(newToken);
      const expiresInMs = exp * 1000 - Date.now();
      const buffer = 60 * 1000;
      const timeout = Math.max(expiresInMs - buffer, 0);
      if (window._refreshTimeout) clearTimeout(window._refreshTimeout);
      window._refreshTimeout = setTimeout(
        () => refreshAndSchedule(),
        timeout
      );

      // Step 5: Fetch the user profile
      const me = await api.get('/auth/me');
      setUser(me.data.user ?? me.data);
      
      // Step 6: ONLY navigate if ALL steps above succeeded
      navigate('/chats', { replace: true });
      
      // Return success indicator
      return { success: true, user: me.data.user ?? me.data };
      
    } catch (error) {
      // CRITICAL: Clear any partial auth state on any error
      clearAuth();
      setSessionConflict(null);
      
      // CRITICAL: Re-throw error so Login component can handle it
      // Do NOT navigate here - let the component show the error
      throw error;
    }
  };

  // Force login (when user chooses to override existing session)
  const forceLogin = async (credentials) => {
    try {
      const result = await login(credentials, true);
      return result;
    } catch (error) {
      // Re-throw so component can handle
      throw error;
    }
  };

  // Clear session conflict notification
  const clearSessionConflict = () => {
    setSessionConflict(null);
  };

  // REGISTER - UPDATED to use full_name field to match database schema
  const register = async ({ email, password, name }) => {
    try {
      // Send full_name instead of name to match our database column
      const res = await api.post('/auth/register', { 
        email, 
        password, 
        full_name: name  // Database expects full_name column
      });
      // Don't navigate automatically - let the component handle it
      return { success: true, user: res.data.user ?? res.data };
    } catch (error) {
      // Re-throw so component can handle
      throw error;
    }
  };

  // LOGOUT: notify server, then clear state & timer
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
    clearAuth();
    setSessionConflict(null);
    navigate('/login', { replace: true });
  };

  // Determine if user is fully authenticated (has both token and user)
  const isAuthenticated = Boolean(token && user);

  // while we're determining auth status…
  if (loadingUser || initializing) {
    return <LottieLoader />;
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated,
        loadingUser,
        sessionConflict,
        login,
        register,
        logout,
        setUser,
        clearSessionConflict,
        forceLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}