// src/contexts/AuthContext.jsx
import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useRef
} from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../api';
import LottieLoader from '../components/LottieLoader';

// ============================================================================
// ENHANCED AUTH CONTEXT WITH COMPREHENSIVE FIX FOR ALL ISSUES
// ============================================================================

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
  // ============================================================================
  // STATE MANAGEMENT WITH ENHANCED INITIALIZATION
  // ============================================================================
  
  // Initialize token from localStorage with comprehensive validation
  const [token, setToken] = useState(() => {
    try {
      const storedToken = localStorage.getItem('access_token');
      console.log('🔍 Initial token check:', storedToken ? 'Token found' : 'No token found');
      
      if (storedToken && 
          typeof storedToken === 'string' && 
          storedToken !== 'null' && 
          storedToken !== 'undefined' && 
          storedToken.trim() &&
          storedToken.length > 10) {
        
        try {
          // Validate JWT structure and expiration
          const decoded = jwtDecode(storedToken);
          const now = Date.now() / 1000;
          
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
    } catch (error) {
      console.error('❌ Error initializing token:', error);
      return null;
    }
  });
  
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [sessionConflict, setSessionConflict] = useState(null);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  
  // Use refs to track state and prevent race conditions
  const authStateRef = useRef({
    isRefreshing: false,
    refreshPromise: null,
    lastRefreshAttempt: 0
  });
  
  const navigate = useNavigate();

  // ============================================================================
  // ENHANCED AUTH CLEANUP FUNCTION
  // ============================================================================
  
  const clearAuth = useCallback(() => {
    console.log('🧹 Clearing authentication state');
    
    // Clear all possible token storage locations
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    // Clear API headers
    delete api.defaults.headers.common.Authorization;
    
    // Reset state
    setToken(null);
    setUser(null);
    setSessionConflict(null);
    setPendingNavigation(null);
    
    // Clear any pending refresh operations
    authStateRef.current = {
      isRefreshing: false,
      refreshPromise: null,
      lastRefreshAttempt: 0
    };
    
    // Clear any refresh timeouts
    if (window._refreshTimeout) {
      clearTimeout(window._refreshTimeout);
      delete window._refreshTimeout;
    }
  }, []);

  // ============================================================================
  // ENHANCED TOKEN REFRESH WITH SMART SCHEDULING
  // ============================================================================
  
  const refreshAndSchedule = useCallback(async () => {
    console.log('🔄 refreshAndSchedule called');
    
    // Prevent multiple simultaneous refresh attempts
    if (authStateRef.current.isRefreshing) {
      console.log('🔄 Refresh already in progress, waiting...');
      return authStateRef.current.refreshPromise;
    }
    
    // Rate limiting: don't refresh more than once per minute
    const now = Date.now();
    if (now - authStateRef.current.lastRefreshAttempt < 60000) {
      console.log('🔄 Refresh rate limited, skipping');
      setLoadingUser(false);
      setInitializing(false);
      return;
    }
    
    authStateRef.current.isRefreshing = true;
    authStateRef.current.lastRefreshAttempt = now;
    
    const refreshPromise = (async () => {
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        console.log('🎫 Refresh token check:', refreshToken ? 'Found' : 'Not found');
        
        if (!refreshToken || refreshToken === 'null' || refreshToken === 'undefined' || !refreshToken.trim()) {
          console.log('❌ No valid refresh token, stopping refresh cycle');
          setLoadingUser(false);
          setInitializing(false);
          return;
        }

        console.log('📡 Making refresh request...');
        
        // Make refresh request with proper error handling
        const response = await fetch(`${api.defaults.baseURL}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${refreshToken}`
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`Refresh failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ Refresh response received');
        
        const newToken = data.access_token;
        const newRefreshToken = data.refresh_token;

        if (!newToken || typeof newToken !== 'string' || !newToken.trim()) {
          throw new Error('Invalid token received from refresh endpoint');
        }

        // Validate the new token
        const decoded = jwtDecode(newToken);
        if (!decoded.exp || decoded.exp <= Date.now() / 1000) {
          throw new Error('Received expired token from refresh');
        }

        // Store new tokens
        localStorage.setItem('access_token', newToken);
        if (newRefreshToken && newRefreshToken !== refreshToken) {
          localStorage.setItem('refresh_token', newRefreshToken);
          console.log('🔄 Refresh token updated');
        }
        
        // Update API headers
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        setToken(newToken);

        // Schedule next refresh (5 minutes before expiry, minimum 5 minutes)
        const expiresInMs = decoded.exp * 1000 - Date.now();
        const buffer = 5 * 60 * 1000; // 5 minute buffer
        const timeout = Math.max(expiresInMs - buffer, 5 * 60 * 1000); // Minimum 5 minutes

        if (window._refreshTimeout) clearTimeout(window._refreshTimeout);
        window._refreshTimeout = setTimeout(() => refreshAndSchedule(), timeout);
        
        console.log('⏰ Next refresh scheduled in:', Math.floor(timeout / 60000), 'minutes');

      } catch (err) {
        console.error('❌ Silent refresh failed:', err);
        
        // Only clear auth for specific refresh errors
        if (err.message.includes('401') || 
            err.message.includes('refresh') || 
            err.message.includes('expired') ||
            err.message.includes('invalid')) {
          console.log('🔄 Refresh token invalid, clearing auth');
          clearAuth();
        }
      } finally {
        authStateRef.current.isRefreshing = false;
        authStateRef.current.refreshPromise = null;
        setLoadingUser(false);
        setInitializing(false);
      }
    })();
    
    authStateRef.current.refreshPromise = refreshPromise;
    return refreshPromise;
  }, [clearAuth]);

  // ============================================================================
  // ENHANCED AUTHENTICATION INITIALIZATION
  // ============================================================================
  
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
        
        if (expiresInMs > 5 * 60 * 1000) { // More than 5 minutes left
          const buffer = 5 * 60 * 1000; // 5 minute buffer
          const timeout = Math.max(expiresInMs - buffer, 5 * 60 * 1000);

          if (window._refreshTimeout) clearTimeout(window._refreshTimeout);
          window._refreshTimeout = setTimeout(() => refreshAndSchedule(), timeout);
          
          console.log('⏰ Refresh scheduled in:', Math.floor(timeout / 60000), 'minutes');
          
          // Don't call refreshAndSchedule immediately if token is still valid
          setLoadingUser(false);
          setInitializing(false);
        } else {
          console.log('🔄 Token expires soon, refreshing immediately');
          refreshAndSchedule();
        }
      } catch (err) {
        console.error('❌ Invalid token format, clearing auth:', err);
        clearAuth();
        setLoadingUser(false);
        setInitializing(false);
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
  }, [token, refreshAndSchedule, clearAuth]);

  // ============================================================================
  // ENHANCED NAVIGATION HANDLING
  // ============================================================================
  
  useEffect(() => {
    if (pendingNavigation && token && !loadingUser && !initializing) {
      console.log('🚀 Executing pending navigation:', pendingNavigation);
      navigate(pendingNavigation, { replace: true });
      setPendingNavigation(null);
    }
  }, [token, loadingUser, initializing, pendingNavigation, navigate]);

  // ============================================================================
  // ENHANCED USER PROFILE FETCHING
  // ============================================================================
  
  useEffect(() => {
    if (!token || typeof token !== 'string' || !token.trim()) {
      setUser(null);
      if (initializing) {
        setLoadingUser(false);
        setInitializing(false);
      }
      return;
    }

    // Don't fetch profile if we're still initializing or in the middle of auth
    if (initializing || authStateRef.current.isRefreshing) {
      return;
    }

    console.log('👤 Fetching user profile with token');
    setLoadingUser(true);

    const fetchUserProfile = async () => {
      try {
        const response = await api.get('/auth/me');
        console.log('✅ User profile loaded:', response.data);
        setUser(response.data);
      } catch (error) {
        console.error('🔒 Failed to load user profile:', error);
        
        // Only clear auth on 401 errors, not network issues
        if (error.response?.status === 401) {
          console.log('🔒 Authentication expired, clearing auth');
          clearAuth();
        } else {
          console.warn('⚠️ Profile loading failed but continuing with authentication');
        }
      } finally {
        setLoadingUser(false);
        setInitializing(false);
      }
    };

    fetchUserProfile();
  }, [token, clearAuth, initializing]);

  // ============================================================================
  // ENHANCED LOGIN FUNCTION
  // ============================================================================
  
  const login = async ({ email, password }, forceNewSession = false) => {
    console.log('🔐 Login attempt for:', email);
    console.log('🌐 API base URL:', api.defaults.baseURL);
    
    try {
      // Clear any existing auth state
      clearAuth();
      
      const payload = { email, password };
      
      if (forceNewSession === true) {
        payload.forceNewSession = true;
        console.log('🔄 Force new session requested');
      }
      
      console.log('📡 Making login request...');
      
      const response = await api.post('/auth/login', payload);
      console.log('✅ Login response:', response.status, 'Token received:', !!response.data.access_token);
      
      const newToken = response.data.access_token;
      const refreshToken = response.data.refresh_token;

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
      
      // Schedule refresh (5 minutes before expiry, minimum 5 minutes)
      const expiresInMs = decoded.exp * 1000 - Date.now();
      const buffer = 5 * 60 * 1000; // 5 minute buffer
      const timeout = Math.max(expiresInMs - buffer, 5 * 60 * 1000);
      
      if (window._refreshTimeout) clearTimeout(window._refreshTimeout);
      window._refreshTimeout = setTimeout(() => refreshAndSchedule(), timeout);

      console.log('🚀 Login successful, preparing navigation');
      
      // Set token and navigation destination
      setToken(newToken);
      setPendingNavigation('/chats');
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Login failed:', error);
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      
      // Clear auth on login failure
      clearAuth();
      
      // Re-throw for component handling
      throw error;
    }
  };

  // ============================================================================
  // ENHANCED REGISTER FUNCTION
  // ============================================================================
  
  const register = async ({ email, password, name }) => {
    console.log('📝 Registration attempt for:', email);
    
    try {
      const response = await api.post('/auth/register', { 
        email, 
        password, 
        name
      });
      
      console.log('✅ Registration successful:', response.data);
      return { success: true, user: response.data };
      
    } catch (error) {
      console.error('❌ Registration failed:', error);
      throw error;
    }
  };

  // ============================================================================
  // FORCE LOGIN FOR SESSION CONFLICTS
  // ============================================================================
  
  const forceLogin = async (credentials) => {
    try {
      return await login(credentials, true);
    } catch (error) {
      throw error;
    }
  };

  // ============================================================================
  // CLEAR SESSION CONFLICT
  // ============================================================================
  
  const clearSessionConflict = () => {
    setSessionConflict(null);
  };

  // ============================================================================
  // ENHANCED LOGOUT FUNCTION
  // ============================================================================
  
  const logout = async () => {
    console.log('🚪 Logging out user');
    
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await api.post('/auth/logout', {}, {
          headers: {
            'Authorization': `Bearer ${refreshToken}`
          }
        });
        console.log('✅ Server logout successful');
      }
    } catch (err) {
      console.warn('⚠️ Server logout failed:', err);
      // Continue with local logout anyway
    }
    
    clearAuth();
    navigate('/login', { replace: true });
  };

  // ============================================================================
  // AUTHENTICATION STATUS COMPUTATION
  // ============================================================================
  
  const isAuthenticated = Boolean(
    token && 
    typeof token === 'string' && 
    token.trim() &&
    !authStateRef.current.isRefreshing &&
    !pendingNavigation
  );

  console.log('🔍 Auth state:', {
    hasToken: !!token,
    hasUser: !!user,
    isAuthenticated,
    loadingUser,
    initializing,
    pendingNavigation,
    isRefreshing: authStateRef.current.isRefreshing
  });

  // ============================================================================
  // LOADING STATE MANAGEMENT
  // ============================================================================
  
  // Show loader while determining auth status OR during login navigation OR during refresh
  if (loadingUser || initializing || pendingNavigation || authStateRef.current.isRefreshing) {
    return <LottieLoader />;
  }

  // ============================================================================
  // CONTEXT PROVIDER
  // ============================================================================
  
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