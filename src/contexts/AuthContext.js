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
  // Initialize from localStorage with validation
  const [token, setToken] = useState(() => {
    const storedToken = localStorage.getItem('access_token'); // Changed from 'token' to 'access_token'
    console.log('Initial token check:', storedToken ? 'Token found' : 'No token found');
    
    // Validate token is a proper string
    if (storedToken && typeof storedToken === 'string' && storedToken !== 'null' && storedToken !== 'undefined' && storedToken.trim()) {
      return storedToken.trim();
    }
    return null;
  });
  
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [sessionConflict, setSessionConflict] = useState(null);
  const navigate = useNavigate();

  // Clear auth state + cancel any scheduled refresh
  const clearAuth = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    delete api.defaults.headers.common.Authorization;
    setToken(null);
    setUser(null);
    if (window._refreshTimeout) {
      clearTimeout(window._refreshTimeout);
      delete window._refreshTimeout;
    }
  }, []);

  // Always send credentials (if you use cookies)
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
          const errorDetail = error.response?.data?.detail;
          
          // Handle token format errors specifically
          if (errorDetail && errorDetail.includes('Invalid token format')) {
            console.warn('🔒 Invalid token format detected, clearing auth');
            clearAuth();
            return Promise.reject(error);
          }
          
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

  // This function both refreshes the token AND schedules the next refresh
  const refreshAndSchedule = useCallback(async () => {
    console.log('🔄 refreshAndSchedule called');
    try {
      // Check if we have a refresh token first
      const refreshToken = localStorage.getItem('refresh_token');
      console.log('🎫 Refresh token check:', refreshToken ? 'Found' : 'Not found');
      
      if (!refreshToken || refreshToken === 'null' || refreshToken === 'undefined') {
        console.log('❌ No refresh token available, skipping refresh');
        setLoadingUser(false);
        setInitializing(false);
        return;
      }

      console.log('📡 Making refresh request to:', '/auth/refresh');
      // FIXED: Remove /api prefix - your base URL already includes it
      const res = await api.post('/auth/refresh');
      console.log('✅ Refresh response received:', res.data);
      
      const newToken = res.data.access_token; // Backend returns access_token

      // Validate token before using
      if (!newToken || typeof newToken !== 'string' || !newToken.trim()) {
        throw new Error('Invalid token received from refresh endpoint');
      }

      // Persist & apply
      localStorage.setItem('access_token', newToken);
      api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
      setToken(newToken);

      // Schedule the next one 1 minute before expiry
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
      console.error('❌ Silent refresh failed:', err);
      console.error('Error details:', err.response?.data || err.message);
      clearAuth();
    } finally {
      // Always set loading to false to prevent infinite spinner
      console.log('🏁 Setting loading to false');
      setLoadingUser(false);
      setInitializing(false);
    }
  }, [clearAuth, initializing]);

  // On mount: either schedule based on existing token, or check if we have refresh token
  useEffect(() => {
    console.log('🚀 AuthProvider useEffect triggered');
    console.log('Current token:', token ? 'Present' : 'None');
    console.log('API base URL:', api.defaults.baseURL);
    
    if (token && typeof token === 'string' && token.trim()) {
      console.log('✅ Valid token found, setting up refresh schedule');
      api.defaults.headers.common.Authorization = `Bearer ${token}`;

      try {
        // Schedule next refresh from this token
        const { exp } = jwtDecode(token);
        const expiresInMs = exp * 1000 - Date.now();
        const buffer = 60 * 1000;
        const timeout = Math.max(expiresInMs - buffer, 0);

        if (window._refreshTimeout) clearTimeout(window._refreshTimeout);
        window._refreshTimeout = setTimeout(
          () => refreshAndSchedule(),
          timeout
        );
      } catch (err) {
        console.error('❌ Invalid token format, clearing auth:', err);
        clearAuth();
      }

      // Don't set loading to false here - let the user profile fetch handle it
    } else {
      // No access token - check if we have a refresh token before trying to refresh
      const refreshToken = localStorage.getItem('refresh_token');
      console.log('🎫 Checking for refresh token:', refreshToken ? 'Found' : 'Not found');
      
      if (refreshToken && refreshToken !== 'null' && refreshToken !== 'undefined' && refreshToken.trim()) {
        console.log('🔄 Attempting to refresh with existing refresh token');
        // We have a refresh token, try to get a new access token
        refreshAndSchedule();
      } else {
        // No tokens at all - user is not authenticated
        console.log('❌ No tokens found, user not authenticated');
        setLoadingUser(false);
        setInitializing(false);
      }
    }
  }, [token, refreshAndSchedule]);

  // Once we have a valid token, fetch the user profile
  useEffect(() => {
    if (!token || typeof token !== 'string' || !token.trim()) {
      // No valid token means not authenticated
      setUser(null);
      if (initializing) {
        setLoadingUser(false);
        setInitializing(false);
      }
      return;
    }

    // Keep loading true while fetching user
    setLoadingUser(true);

    // FIXED: Remove /api prefix - your base URL already includes it
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
    console.log('🔐 Login attempt started for:', email);
    console.log('API base URL:', api.defaults.baseURL);
    
    try {
      const payload = { email, password };
      
      // Only add forceNewSession if explicitly set to true
      if (forceNewSession === true) {
        payload.forceNewSession = true;
        console.log('🔄 Force new session requested');
      }
      
      console.log('📡 Making login request to:', '/auth/login');
      // Step 1: API login call - FIXED: Remove /api prefix
      const res = await api.post('/auth/login', payload);
      console.log('✅ Login response received:', res.status, res.data);
      
      const newToken = res.data.access_token; // Backend returns access_token

      // Validate token before using
      if (!newToken || typeof newToken !== 'string' || !newToken.trim()) {
        throw new Error('Invalid token received from login endpoint');
      }

      console.log('🎫 Valid token received, storing...');

      // Step 2: Clear any session conflict
      setSessionConflict(null);

      // Step 3: Persist & apply token
      localStorage.setItem('access_token', newToken);
      
      // Also store refresh token if provided
      if (res.data.refresh_token) {
        localStorage.setItem('refresh_token', res.data.refresh_token);
        console.log('🔄 Refresh token stored');
      }
      
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

      console.log('👤 Fetching user profile...');
      // Step 5: Fetch the user profile - FIXED: Remove /api prefix
      const me = await api.get('/auth/me');
      console.log('✅ User profile received:', me.data);
      setUser(me.data.user ?? me.data);
      
      // Step 6: ONLY navigate if ALL steps above succeeded
      console.log('🚀 Login successful, navigating to chats');
      navigate('/chats', { replace: true });
      
      // Return success indicator
      return { success: true, user: me.data.user ?? me.data };
      
    } catch (error) {
      console.error('❌ Login failed:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
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

  // REGISTER - Keep original full_name mapping
  const register = async ({ email, password, name }) => {
    try {
      // Keep original full_name mapping as it was working
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
      // Get refresh token for logout
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        // FIXED: Remove /api prefix and send refresh token
        await api.post('/auth/logout', { refresh_token: refreshToken });
      }
    } catch (err) {
      console.warn('Logout request failed:', err);
      // ignore errors and continue with local logout
    }
    clearAuth();
    setSessionConflict(null);
    navigate('/login', { replace: true });
  };

  // Determine if user is fully authenticated (has both valid token and user)
  const isAuthenticated = Boolean(
    token && 
    typeof token === 'string' && 
    token.trim() && 
    user
  );

  // While we're determining auth status…
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