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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [usageSummary, setUsageSummary] = useState(null);
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
    setIsAuthenticated(false);
    setIsAuthReady(false);
    setUsageSummary(null);
    
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
  }, [setUsageSummary]);

  // ============================================================================
  // SMART TOKEN REFRESH SCHEDULING - MOVED BEFORE refreshToken
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

    // Check if we have a refresh token
    const storedRefreshToken = localStorage.getItem('refresh_token');
    if (!storedRefreshToken) {
      console.log('❌ No refresh token available, clearing auth');
      clearAuth();
      return;
    }
    
    authStateRef.current.isRefreshing = true;
    authStateRef.current.lastRefreshAttempt = now;
    
    const refreshPromise = (async () => {
      try {
        console.log('🔄 Attempting token refresh with refresh token');
        
        // Try different refresh token formats that servers commonly expect
        let response;
        try {
          // Method 1: Send refresh token in request body
          response = await api.post('/auth/refresh', { 
            refresh_token: storedRefreshToken 
          });
        } catch (error) {
          if (error.response?.status === 400 || error.response?.status === 422) {
            // Method 2: Try different payload format
            console.log('🔄 Trying alternative refresh format');
            response = await api.post('/auth/refresh', { 
              refreshToken: storedRefreshToken 
            });
          } else {
            throw error;
          }
        }

        const { access_token } = response.data;
        
        if (!access_token) {
          throw new Error('No token received from refresh endpoint');
        }
        
        console.log('✅ Token refresh successful');
        
        api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
        localStorage.setItem('access_token', access_token);
        setToken(access_token);
        
        // Update refresh token if provided
        if (response.data.refresh_token) {
          localStorage.setItem('refresh_token', response.data.refresh_token);
        }
        
        // Set user data if provided, otherwise fetch it
        if (response.data.user) {
          setUser(response.data.user);
        } else {
          // Fetch user profile with new token
          try {
            const userResponse = await api.get('/auth/me');
            setUser(userResponse.data);
          } catch (fetchError) {
            console.warn('⚠️ Could not fetch user profile after refresh:', fetchError);
          }
        }
        
        setIsAuthenticated(true);
        setError(null);

        const decoded = jwtDecode(access_token);
        scheduleTokenRefresh(decoded.exp);
        
        return response.data;
      } catch (error) {
        console.error('❌ Token refresh failed:', error);
        console.error('❌ Refresh error details:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        
        // If refresh fails, clear everything and force re-login
        clearAuth();
        throw error;
      } finally {
        authStateRef.current.isRefreshing = false;
        setLoadingUser(false);
        setInitializing(false);
        setIsAuthReady(true);
      }
    })();
    
    authStateRef.current.refreshPromise = refreshPromise;
    return refreshPromise;
  }, [clearAuth, scheduleTokenRefresh]);



  // ============================================================================
  // ENHANCED USER PROFILE FETCHING - NOW AFTER refreshToken
  // ============================================================================
  
  const fetchUserProfile = useCallback(async () => {
    try {
      console.log('👤 Fetching user profile...');
      const response = await api.get('/auth/me');
      
      if (response.data) {
        console.log('✅ User profile fetched successfully');
        setUser(response.data);
        setIsAuthenticated(true);
        setIsAuthReady(true);
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
  }, [clearAuth, refreshToken, setUser, setIsAuthenticated, setIsAuthReady]);

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
      
      // Handle the server's actual response format
      let access_token, userData;
      
      // Server returns: { access_token, refresh_token, token_type, expires_in, user_id }
      if (response.data.access_token && response.data.user_id) {
        access_token = response.data.access_token;
        // We'll fetch user data separately since server only provides user_id
        userData = null; // Will be fetched below
      } else if (response.data.access_token && response.data.user) {
        // Fallback: if server ever returns user object directly
        ({ access_token, user: userData } = response.data);
      } else if (response.data.token && response.data.user) {
        // Alternative format: { token: "...", user: {...} }
        access_token = response.data.token;
        userData = response.data.user;
      } else if (response.data.access_token && response.data.email) {
        // Format: { access_token: "...", email: "...", name: "..." } - user data in root
        access_token = response.data.access_token;
        userData = {
          email: response.data.email,
          name: response.data.name,
          id: response.data.id || response.data.user_id
        };
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
      
      // If we don't have user data yet, fetch it using the token
      if (!userData) {
        try {
          console.log('👤 Fetching user profile after login...');
          const userResponse = await api.get('/auth/me');
          userData = userResponse.data;
          console.log('✅ User profile fetched:', userData);
        } catch (fetchError) {
          console.error('❌ Failed to fetch user profile after login:', fetchError);
          // Create basic user data from token and response
          userData = {
            id: response.data.user_id || decoded.sub || decoded.user_id,
            email: decoded.email || credentials.email,
            name: decoded.name || 'User'
          };
          console.log('🔄 Using fallback user data:', userData);
        }
      }
      
      // Update states atomically
      setToken(access_token);
      setUser(userData);
      setIsAuthenticated(true);
      setIsAuthReady(true);
      
      // Schedule token refresh
      scheduleTokenRefresh(decoded.exp);
      
      console.log('✅ Login completed successfully');
      
      // Hard redirect to clear component state and avoid race conditions
      window.location.href = '/chats';
      
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
  }, [clearAuth, setLoadingUser, setError, setToken, setUser, scheduleTokenRefresh, setIsAuthenticated, setIsAuthReady]);

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
  
  const logout = useCallback(async (redirectPath = '/login') => {
    console.log('🚪 Logging out...');
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await api.post('/auth/logout', { refresh_token: refreshToken });
      }
    } catch (error) {
      console.error('Logout failed:', error);
      setError(error.response?.data?.message || 'Logout failed');
    } finally {
      clearAuth();
      console.log(`Navigating to ${redirectPath}`);
      navigate(redirectPath, { replace: true });
    }
  }, [clearAuth, navigate]);

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
          setIsAuthReady(true);
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
    isAuthenticated,
    initializing,
    sessionConflict,
    login,
    register,
    logout,
    setUser,
    clearSessionConflict,
    forceLogin,
    refreshToken,
    isAuthReady,
    usageSummary,
    setUsageSummary
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