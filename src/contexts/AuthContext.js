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
  // Initialize from localStorage with enhanced validation
  const [token, setToken] = useState(() => {
    const storedToken = localStorage.getItem('access_token');
    console.log('🔍 Initial token check:', storedToken ? 'Token found' : 'No token found');
    
    // Enhanced token validation
    if (storedToken && 
        typeof storedToken === 'string' && 
        storedToken !== 'null' && 
        storedToken !== 'undefined' && 
        storedToken.trim() &&
        storedToken.length > 10) { // Basic token length check
      
      try {
        // Try to decode the token to verify it's valid JWT
        const decoded = jwtDecode(storedToken);
        const now = Date.now() / 1000;
        
        // Check if token is not expired
        if (decoded.exp && decoded.exp > now) {
          console.log('✅ Valid token found, expires:', new Date(decoded.exp * 1000));
          return storedToken.trim();
        } else {
          console.log('❌ Token expired, clearing storage');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      } catch (error) {
        console.log('❌ Invalid token format, clearing storage:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
    }
    return null;
  });
  
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [sessionConflict, setSessionConflict] = useState(null);
  
  // 🔧 FIX: Add state to handle login navigation
  const [pendingNavigation, setPendingNavigation] = useState(null);
  
  const navigate = useNavigate();

  // Enhanced auth cleanup
  const clearAuth = useCallback(() => {
    console.log('🧹 Clearing authentication state');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    delete api.defaults.headers.common.Authorization;
    setToken(null);
    setUser(null);
    setSessionConflict(null);
    setPendingNavigation(null); // 🔧 FIX: Clear pending navigation
    if (window._refreshTimeout) {
      clearTimeout(window._refreshTimeout);
      delete window._refreshTimeout;
    }
  }, []);

  // FIXED: Much safer response interceptor that doesn't interfere with auth
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        const url = error.config?.url || '';
        
        // COMPLETELY IGNORE all errors during auth operations
        if (url.includes('/auth/')) {
          console.log('🔓 Ignoring error during auth operation:', url, error.response?.status);
          return Promise.reject(error);
        }
        
        // Only handle 401 for protected endpoints (non-auth)
        if (error.response?.status === 401) {
          const errorDetail = error.response?.data?.detail || '';
          const errorMessage = error.response?.data?.message || '';
          
          console.warn('🔒 401 on protected endpoint:', url);
          
          // Handle session conflicts
          if (errorMessage.includes('logged in elsewhere') || 
              errorDetail.includes('SESSION_CONFLICT')) {
            setSessionConflict({
              message: 'You have been logged out because you logged in elsewhere.',
            });
            clearAuth();
          } else if (errorDetail.includes('Invalid or expired refresh token')) {
            // Only clear for refresh token issues
            console.log('🔄 Refresh token invalid, clearing auth');
            clearAuth();
          }
        }
        
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, [clearAuth]);

  // Enhanced token refresh with new refresh token handling
  const refreshAndSchedule = useCallback(async () => {
    console.log('🔄 refreshAndSchedule called');
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      console.log('🎫 Refresh token check:', refreshToken ? 'Found' : 'Not found');
      
      if (!refreshToken || refreshToken === 'null' || refreshToken === 'undefined' || !refreshToken.trim()) {
        console.log('❌ No valid refresh token, stopping refresh cycle');
        setLoadingUser(false);
        setInitializing(false);
        return;
      }

      console.log('📡 Making refresh request to: /api/auth/refresh');
      
      // Set the refresh token as bearer token for the refresh request
      const tempHeader = api.defaults.headers.common.Authorization;
      api.defaults.headers.common.Authorization = `Bearer ${refreshToken}`;
      
      // 🔧 FIX: Use correct API path
      const res = await api.post('/api/auth/refresh');
      console.log('✅ Refresh response received:', res.data);
      
      // Restore previous header
      api.defaults.headers.common.Authorization = tempHeader;
      
      const newToken = res.data.access_token;
      const newRefreshToken = res.data.refresh_token;

      if (!newToken || typeof newToken !== 'string' || !newToken.trim()) {
        throw new Error('Invalid token received from refresh endpoint');
      }

      // Validate the new token
      const decoded = jwtDecode(newToken);
      if (!decoded.exp || decoded.exp <= Date.now() / 1000) {
        throw new Error('Received expired token from refresh');
      }

      // Store tokens - Update refresh token if provided
      localStorage.setItem('access_token', newToken);
      if (newRefreshToken && newRefreshToken !== refreshToken) {
        localStorage.setItem('refresh_token', newRefreshToken);
        console.log('🔄 Refresh token updated');
      }
      
      api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
      setToken(newToken);

      // Schedule next refresh (1 minute before expiry)
      const expiresInMs = decoded.exp * 1000 - Date.now();
      const buffer = 60 * 1000; // 1 minute buffer
      const timeout = Math.max(expiresInMs - buffer, 5000); // Minimum 5 seconds

      if (window._refreshTimeout) clearTimeout(window._refreshTimeout);
      window._refreshTimeout = setTimeout(() => refreshAndSchedule(), timeout);
      
      console.log('⏰ Next refresh scheduled in:', Math.floor(timeout / 1000), 'seconds');

    } catch (err) {
      console.error('❌ Silent refresh failed:', err);
      
      // Only clear auth for specific refresh errors
      if (err.response?.status === 401) {
        const errorDetail = err.response?.data?.detail || '';
        if (errorDetail.includes('Invalid or expired refresh token') || 
            errorDetail.includes('refresh token')) {
          console.log('🔄 Refresh token invalid, clearing auth');
          clearAuth();
        }
      } else {
        clearAuth();
      }
    } finally {
      setLoadingUser(false);
      setInitializing(false);
    }
  }, [clearAuth]);

  // Initialize auth state
  useEffect(() => {
    console.log('🚀 AuthProvider initialization');
    console.log('Current token:', token ? 'Present' : 'None');
    console.log('API base URL:', api.defaults.baseURL);
    
    if (token && typeof token === 'string' && token.trim()) {
      console.log('✅ Valid token found, setting up API header and refresh schedule');
      api.defaults.headers.common.Authorization = `Bearer ${token}`;

      try {
        const { exp } = jwtDecode(token);
        const expiresInMs = exp * 1000 - Date.now();
        
        if (expiresInMs > 60000) { // More than 1 minute left
          const buffer = 60 * 1000;
          const timeout = Math.max(expiresInMs - buffer, 5000);

          if (window._refreshTimeout) clearTimeout(window._refreshTimeout);
          window._refreshTimeout = setTimeout(() => refreshAndSchedule(), timeout);
          
          console.log('⏰ Refresh scheduled in:', Math.floor(timeout / 1000), 'seconds');
        } else {
          console.log('🔄 Token expires soon, refreshing immediately');
          refreshAndSchedule();
        }
      } catch (err) {
        console.error('❌ Invalid token format, clearing auth:', err);
        clearAuth();
      }
    } else {
      // No access token - check for refresh token
      const refreshToken = localStorage.getItem('refresh_token');
      console.log('🎫 Checking for refresh token:', refreshToken ? 'Found' : 'Not found');
      
      if (refreshToken && refreshToken !== 'null' && refreshToken !== 'undefined' && refreshToken.trim()) {
        console.log('🔄 Attempting to refresh with existing refresh token');
        refreshAndSchedule();
      } else {
        console.log('❌ No tokens found, user not authenticated');
        setLoadingUser(false);
        setInitializing(false);
      }
    }
  }, [token, refreshAndSchedule]);

  // 🔧 FIX: Handle navigation after token state is updated
  useEffect(() => {
    if (pendingNavigation && token && !loadingUser && !initializing) {
      console.log('🚀 Executing pending navigation:', pendingNavigation);
      navigate(pendingNavigation, { replace: true });
      setPendingNavigation(null);
    }
  }, [token, loadingUser, initializing, pendingNavigation, navigate]);

  // Fetch user profile when token is available
  useEffect(() => {
    if (!token || typeof token !== 'string' || !token.trim()) {
      setUser(null);
      if (initializing) {
        setLoadingUser(false);
        setInitializing(false);
      }
      return;
    }

    console.log('👤 Fetching user profile with token');
    setLoadingUser(true);

    // 🔧 FIX: Use correct API path
    api.get('/api/auth/me')
      .then(res => {
        console.log('✅ User profile loaded:', res.data);
        setUser(res.data);
      })
      .catch(err => {
        console.error('🔒 Failed to load user profile:', err);
        // Don't clear auth here if it's just a profile loading issue
        // User profile loading failure doesn't mean authentication failed
        console.warn('⚠️ Continuing with authentication despite profile loading failure');
      })
      .finally(() => {
        setLoadingUser(false);
        setInitializing(false);
      });
  }, [token, clearAuth, initializing]);

  // 🔧 FIX: Completely rewritten login function with proper state management
  const login = async ({ email, password }, forceNewSession = false) => {
    console.log('🔐 Login attempt for:', email);
    console.log('🌐 API base URL:', api.defaults.baseURL);
    
    try {
      const payload = { email, password };
      
      if (forceNewSession === true) {
        payload.forceNewSession = true;
        console.log('🔄 Force new session requested');
      }
      
      console.log('📡 Making login request to: /api/auth/login');
      
      // 🔧 FIX: Use correct API path
      const res = await api.post('/api/auth/login', payload);
      console.log('✅ Login response:', res.status, 'Token received:', !!res.data.access_token);
      
      const newToken = res.data.access_token;
      const refreshToken = res.data.refresh_token;

      // Enhanced token validation
      if (!newToken || typeof newToken !== 'string' || !newToken.trim()) {
        throw new Error('Invalid access token received');
      }

      // Validate token structure
      let decoded;
      try {
        decoded = jwtDecode(newToken);
        if (!decoded.exp || decoded.exp <= Date.now() / 1000) {
          throw new Error('Received expired token');
        }
      } catch (decodeError) {
        throw new Error('Invalid token format received');
      }

      console.log('🎫 Storing tokens and setting up auth');

      // Clear session conflict
      setSessionConflict(null);

      // Store tokens
      localStorage.setItem('access_token', newToken);
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
        console.log('🔄 Refresh token stored');
      }
      
      // Set API header
      api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
      
      // Schedule refresh
      const expiresInMs = decoded.exp * 1000 - Date.now();
      const buffer = 60 * 1000;
      const timeout = Math.max(expiresInMs - buffer, 5000);
      
      if (window._refreshTimeout) clearTimeout(window._refreshTimeout);
      window._refreshTimeout = setTimeout(() => refreshAndSchedule(), timeout);

      console.log('🚀 Login successful, preparing navigation');
      
      // 🔧 FIX: Set token and navigation destination, let useEffect handle the actual navigation
      setToken(newToken);
      setPendingNavigation('/chats');
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Login failed:', error);
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      
      // Only clear auth on actual login failure, not network issues
      if (error.response?.status === 401) {
        clearAuth();
      }
      
      // Re-throw for component handling
      throw error;
    }
  };

  // Force login for session conflicts
  const forceLogin = async (credentials) => {
    try {
      return await login(credentials, true);
    } catch (error) {
      throw error;
    }
  };

  // Enhanced register function
  const register = async ({ email, password, name }) => {
    console.log('📝 Registration attempt for:', email);
    
    try {
      // 🔧 FIX: Use correct API path
      const res = await api.post('/api/auth/register', { 
        email, 
        password, 
        name
      });
      
      console.log('✅ Registration successful:', res.data);
      return { success: true, user: res.data };
      
    } catch (error) {
      console.error('❌ Registration failed:', error);
      throw error;
    }
  };

  // Clear session conflict
  const clearSessionConflict = () => {
    setSessionConflict(null);
  };

  // Enhanced logout
  const logout = async () => {
    console.log('🚪 Logging out user');
    
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        // 🔧 FIX: Use correct API path
        await api.post('/api/auth/logout', { refresh_token: refreshToken });
        console.log('✅ Server logout successful');
      }
    } catch (err) {
      console.warn('⚠️ Server logout failed:', err);
      // Continue with local logout anyway
    }
    
    clearAuth();
    navigate('/login', { replace: true });
  };

  // 🔧 FIX: Update authentication logic to only require valid token
  const isAuthenticated = Boolean(
    token && 
    typeof token === 'string' && 
    token.trim() &&
    !pendingNavigation // Ensure we're not in the middle of a login process
  );

  console.log('🔍 Auth state:', {
    hasToken: !!token,
    hasUser: !!user,
    isAuthenticated,
    loadingUser,
    initializing,
    pendingNavigation
  });

  // 🔧 FIX: Show loader while determining auth status OR during login navigation
  if (loadingUser || initializing || pendingNavigation) {
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