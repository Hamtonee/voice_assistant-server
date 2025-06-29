// src/contexts/AuthContext.jsx
import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useContext
} from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../api';
import LottieLoader from '../components/LottieLoader';

// ============================================================================
// ENHANCED AUTH CONTEXT WITH COMPREHENSIVE FIX FOR ALL ISSUES
// ============================================================================

// Create context with meaningful defaults
export const AuthContext = createContext(null);

// Custom hook for consuming auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }) {
  // ============================================================================
  // STATE MANAGEMENT WITH ENHANCED INITIALIZATION
  // ============================================================================
  
  const [token, setToken] = useState(localStorage.getItem('access_token'));
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [sessionConflict, setSessionConflict] = useState(null);
  // Removed unused pendingNavigation state
  
  // Ref for tracking refresh state
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
  // SMART TOKEN REFRESH SCHEDULING
  // ============================================================================
  
  const scheduleTokenRefresh = useCallback((expTimestamp) => {
    if (window._refreshTimeout) {
      clearTimeout(window._refreshTimeout);
    }
    
    const now = Date.now() / 1000;
    const timeUntilExpiry = expTimestamp - now;
    
    const refreshTime = Math.max(timeUntilExpiry * 0.8, timeUntilExpiry - 300);
    const refreshDelay = Math.max(refreshTime * 1000, 60000);
    
    console.log(`⏰ Scheduling token refresh in ${Math.round(refreshDelay / 1000)} seconds`);
    
    window._refreshTimeout = setTimeout(async () => {
      console.log('⏰ Scheduled refresh triggered');
      try {
        const response = await api.post('/auth/refresh', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const { access_token } = response.data;
        localStorage.setItem('access_token', access_token);
        setToken(access_token);
        
        const decoded = jwtDecode(access_token);
        scheduleTokenRefresh(decoded.exp);
      } catch (error) {
        console.error('Failed to refresh token:', error);
        clearAuth();
        navigate('/login');
      }
    }, refreshDelay);
  }, [token, clearAuth, navigate]);

  // ============================================================================
  // ENHANCED USER PROFILE FETCHING
  // ============================================================================
  
  const fetchUserProfile = useCallback(async () => {
    try {
      console.log('👤 Fetching user profile...');
      const response = await api.get('/auth/me');
      
      if (response.data) {
        console.log('✅ User profile fetched successfully');
        setUser(response.data);
        return response.data;
      } else {
        throw new Error('No user data received');
      }
    } catch (error) {
      console.error('❌ Failed to fetch user profile:', error);
      
      if (error.response?.status === 401) {
        console.log('🔄 Token invalid, attempting refresh...');
        await refreshToken();
      } else {
        clearAuth();
      }
      throw error;
    }
  }, [clearAuth]);

  // ============================================================================
  // ENHANCED TOKEN REFRESH WITH RETRY LOGIC
  // ============================================================================
  
  const refreshToken = useCallback(async () => {
    if (authStateRef.current.isRefreshing) {
      console.log('🔄 Refresh already in progress, waiting...');
      return authStateRef.current.refreshPromise;
    }
    
    const now = Date.now();
    const timeSinceLastAttempt = now - authStateRef.current.lastRefreshAttempt;
    if (timeSinceLastAttempt < 10000) {
      console.log('⏳ Too soon to refresh, waiting...');
      return;
    }
    
    authStateRef.current.isRefreshing = true;
    authStateRef.current.lastRefreshAttempt = now;
    
    const refreshPromise = (async () => {
      try {
        const response = await api.post('/auth/refresh');
        const { access_token } = response.data;
        
        if (!access_token) {
          throw new Error('No token received from refresh endpoint');
        }
        
        api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
        localStorage.setItem('access_token', access_token);
        setToken(access_token);
        
        const decoded = jwtDecode(access_token);
        scheduleTokenRefresh(decoded.exp);
        
        await fetchUserProfile();
        
        return access_token;
      } catch (error) {
        console.error('❌ Token refresh failed:', error);
        clearAuth();
        throw error;
      } finally {
        authStateRef.current.isRefreshing = false;
        setLoadingUser(false);
        setInitializing(false);
      }
    })();
    
    authStateRef.current.refreshPromise = refreshPromise;
    return refreshPromise;
  }, [clearAuth, scheduleTokenRefresh, fetchUserProfile, setToken, setLoadingUser, setInitializing]);

  // ============================================================================
  // ENHANCED LOGIN FUNCTION WITH IMPROVED STATE MANAGEMENT
  // ============================================================================
  
  const login = useCallback(async (credentials) => {
    // Clear any existing state first
    clearAuth();
    
    try {
      setLoadingUser(true);
      setError(null);
      console.log('🔑 AuthContext login attempt:', credentials.email);
      
      const response = await api.post('/auth/login', credentials);
      console.log('🔍 Login response data:', response.data);
      
      // Handle different response formats from server
      let access_token, userData;
      
      // Check for different possible response structures
      if (response.data.access_token && response.data.user) {
        // Format 1: { access_token: "...", user: {...} }
        ({ access_token, user: userData } = response.data);
      } else if (response.data.token && response.data.user) {
        // Format 2: { token: "...", user: {...} }
        access_token = response.data.token;
        userData = response.data.user;
      } else if (response.data.access_token && response.data.email) {
        // Format 3: { access_token: "...", email: "...", name: "..." } - user data in root
        access_token = response.data.access_token;
        userData = {
          email: response.data.email,
          name: response.data.name,
          id: response.data.id || response.data.user_id
        };
      } else if (response.data.token) {
        // Format 4: Just token, need to fetch user separately
        access_token = response.data.token;
        // We'll fetch user data after setting up the token
      } else {
        console.error('❌ Unexpected login response format:', response.data);
        throw new Error('Invalid response format from server');
      }
      
      if (!access_token) {
        console.error('❌ No access token found in response:', response.data);
        throw new Error('Invalid response from server - no access token');
      }
      
      console.log('✅ Login successful, storing token and user data');
      
      // Set up API authorization first
      api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
      localStorage.setItem('access_token', access_token);
      
      // Store refresh token if provided
      if (response.data.refresh_token) {
        localStorage.setItem('refresh_token', response.data.refresh_token);
      }
      
      // Decode token and validate expiry
      const decoded = jwtDecode(access_token);
      const now = Date.now() / 1000;
      
      if (decoded.exp <= now) {
        throw new Error('Token expired on arrival');
      }
      
      // If we don't have user data yet, fetch it
      if (!userData) {
        try {
          console.log('👤 Fetching user profile after login...');
          const userResponse = await api.get('/auth/me');
          userData = userResponse.data;
        } catch (fetchError) {
          console.error('❌ Failed to fetch user profile after login:', fetchError);
          // Don't fail the login if we can't fetch user profile
          // Create basic user data from token
          userData = {
            email: decoded.email || credentials.email,
            name: decoded.name || 'User',
            id: decoded.sub || decoded.user_id
          };
        }
      }
      
      // Update states atomically
      setToken(access_token);
      setUser(userData);
      
      // Schedule token refresh
      scheduleTokenRefresh(decoded.exp);
      
      console.log('✅ Login completed successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Login failed:', error);
      console.error('❌ Login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      setError(error.message || 'Login failed');
      clearAuth();
      throw error;
    } finally {
      setLoadingUser(false);
    }
  }, [clearAuth, setLoadingUser, setError, setToken, setUser, scheduleTokenRefresh]);

  // ============================================================================
  // ENHANCED REGISTRATION FUNCTION
  // ============================================================================
  
  const register = async ({ email, password, name }) => {
    try {
      setLoadingUser(true);
      console.log('📝 Attempting registration for:', email);
      
      const response = await api.post('/auth/register', {
        email: email.trim().toLowerCase(),
        password,
        name: name?.trim() || ''
      });
      
      console.log('✅ Registration successful');
      return { success: true, user: response.data };
      
    } catch (error) {
      console.error('❌ Registration failed:', error);
      throw error;
    } finally {
      setLoadingUser(false);
    }
  };

  // ============================================================================
  // FORCE LOGIN FOR SESSION CONFLICTS
  // ============================================================================
  
  const forceLogin = async (credentials) => {
    console.log('🔄 Force login initiated');
    setSessionConflict(null);
    return await login(credentials.email, credentials.password);
  };

  // ============================================================================
  // CLEAR SESSION CONFLICT
  // ============================================================================
  
  const clearSessionConflict = () => {
    console.log('🧹 Clearing session conflict');
    setSessionConflict(null);
  };

  // ============================================================================
  // ENHANCED LOGOUT FUNCTION
  // ============================================================================
  
  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    setToken(null);
    setUser(null);
    if (window._refreshTimeout) {
      clearTimeout(window._refreshTimeout);
    }
    navigate('/login');
  }, [navigate, setToken, setUser]);

  // ============================================================================
  // INITIALIZATION EFFECT WITH CLEANUP
  // ============================================================================
  
  useEffect(() => {
    let mounted = true;
    const abortController = new AbortController();
    
    const initializeAuth = async () => {
      console.log('🚀 Initializing authentication...');
      
      // Set a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        if (mounted) {
          console.warn('⚠️ Auth initialization timeout, forcing completion');
          setLoadingUser(false);
          setInitializing(false);
        }
      }, 10000);
      
      try {
        if (!token) {
          console.log('❌ No token found, user not authenticated');
          if (mounted) {
            setLoadingUser(false);
            setInitializing(false);
          }
          return;
        }
        
        // Validate token
        try {
          const decoded = jwtDecode(token);
          const now = Date.now() / 1000;
          
          if (decoded.exp <= now) {
            console.log('🕒 Token expired, attempting refresh');
            await refreshToken();
          } else {
            console.log('✅ Token valid, scheduling refresh');
            scheduleTokenRefresh(decoded.exp);
            await fetchUserProfile();
          }
        } catch (error) {
          console.error('❌ Token validation failed:', error);
          clearAuth();
        }
      } catch (error) {
        console.error('❌ Auth initialization failed:', error);
        clearAuth();
      } finally {
        clearTimeout(timeoutId);
        if (mounted) {
          setLoadingUser(false);
          setInitializing(false);
        }
      }
    };
    
    initializeAuth();
    
    return () => {
      mounted = false;
      abortController.abort();
    };
  }, [token, clearAuth, scheduleTokenRefresh, fetchUserProfile, refreshToken]);

  // ============================================================================
  // CONTEXT VALUE WITH COMPUTED PROPERTIES
  // ============================================================================
  
  const contextValue = {
    token,
    user,
    loadingUser,
    error,
    isAuthenticated: Boolean(token && user),
    initializing,
    sessionConflict,
    login,
    register,
    logout,
    setUser,
    clearSessionConflict,
    forceLogin,
    refreshToken,
  };

  // ============================================================================
  // RENDER WITH LOADING STATE MANAGEMENT
  // ============================================================================
  
  // Show loading only during initial setup, not during normal operations
  if (initializing) {
    return <LottieLoader />;
  }

  // Fallback safety check - if loading is stuck for too long, show children anyway
  if (loadingUser) {
    console.warn('⚠️ LoadingUser state detected, but initializing is false. This might indicate a stuck state.');
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}