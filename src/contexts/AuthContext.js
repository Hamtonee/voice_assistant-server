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
  
  const [token, setToken] = useState(() => {
    try {
      const storedToken = localStorage.getItem('access_token');
      if (!storedToken) return null;
      
      try {
        const decoded = jwtDecode(storedToken);
        const now = Date.now() / 1000;
        if (decoded.exp < now) {
          localStorage.removeItem('access_token');
          return null;
        }
        return storedToken;
      } catch (e) {
        localStorage.removeItem('access_token');
        return null;
      }
    } catch (e) {
      return null;
    }
  });
  
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState(null);
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
  
  const refreshToken = useCallback(async () => {
    if (authStateRef.current.isRefreshing) {
      console.log('🔄 Refresh already in progress, waiting...');
      return authStateRef.current.refreshPromise;
    }
    
    authStateRef.current.isRefreshing = true;
    authStateRef.current.lastRefreshAttempt = Date.now();
    
    const refreshPromise = (async () => {
      try {
        const response = await api.post('/auth/refresh');
        const { access_token } = response.data;
        
        localStorage.setItem('access_token', access_token);
        api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
        setToken(access_token);
        
        // Schedule next refresh
        scheduleTokenRefresh(jwtDecode(access_token).exp);

        console.log('✅ Token refreshed successfully');
        
        // Fetch user profile after successful refresh
        await fetchUserProfile();
        
      } catch (error) {
        console.error('❌ Token refresh failed:', error);
        clearAuth();
      } finally {
        authStateRef.current.isRefreshing = false;
        setLoadingUser(false);
        setInitializing(false);
      }
    })();
    
    authStateRef.current.refreshPromise = refreshPromise;
    return refreshPromise;
  }, [clearAuth]);

  // ============================================================================
  // SMART TOKEN REFRESH SCHEDULING
  // ============================================================================
  
  const scheduleTokenRefresh = useCallback((expTimestamp) => {
    if (window._refreshTimeout) {
      clearTimeout(window._refreshTimeout);
    }
    
    const now = Date.now() / 1000;
    const timeUntilExpiry = expTimestamp - now;
    
    // Refresh when 80% of the token lifetime has passed, but at least 5 minutes before expiry
    const refreshTime = Math.max(timeUntilExpiry * 0.8, timeUntilExpiry - 300);
    const refreshDelay = Math.max(refreshTime * 1000, 60000); // At least 1 minute
    
    console.log(`⏰ Scheduling token refresh in ${Math.round(refreshDelay / 1000)} seconds`);
    
    window._refreshTimeout = setTimeout(() => {
      console.log('⏰ Scheduled refresh triggered');
      refreshToken();
    }, refreshDelay);
  }, [refreshToken]);

  // ============================================================================
  // ENHANCED USER PROFILE FETCHING
  // ============================================================================
  
  const fetchUserProfile = async () => {
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
  };

  // ============================================================================
  // ENHANCED LOGIN FUNCTION
  // ============================================================================
  
  const login = useCallback(async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('access_token', access_token);
      setToken(access_token);
      setUser(userData);

      // Schedule token refresh
      const decoded = jwtDecode(access_token);
      const timeUntilRefresh = (decoded.exp - (Date.now() / 1000) - 300) * 1000; // 5 mins before expiry
      console.log('⏰ Scheduling token refresh in', Math.floor(timeUntilRefresh / 1000), 'seconds');
      refreshToken();

      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed. Please try again.'
      };
    }
  }, []);

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
  }, [navigate]);

  // ============================================================================
  // INITIALIZATION EFFECT WITH TIMEOUT PROTECTION
  // ============================================================================
  
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🚀 Initializing authentication...');
      
      // Set a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.warn('⚠️ Auth initialization timeout, forcing completion');
        setLoadingUser(false);
        setInitializing(false);
      }, 10000); // 10 second timeout
      
      try {
        if (token) {
          console.log('🎫 Token found, setting up API and fetching user...');
          
          // Set API authorization header
          api.defaults.headers.common.Authorization = `Bearer ${token}`;
          
          try {
            // Validate token and get user data
            const decoded = jwtDecode(token);
            const now = Date.now() / 1000;
            
            if (decoded.exp <= now) {
              console.log('❌ Token expired, attempting refresh...');
              await refreshToken();
            } else {
              console.log('✅ Token valid, fetching user profile...');
              await fetchUserProfile();
              scheduleTokenRefresh(decoded.exp);
            }
          } catch (error) {
            console.error('❌ Token validation failed:', error);
            await refreshToken();
          }
        } else {
          console.log('❌ No token found, user not authenticated');
          setLoadingUser(false);
          setInitializing(false);
        }
      } catch (error) {
        console.error('❌ Auth initialization failed:', error);
        clearAuth();
      } finally {
        clearTimeout(timeoutId);
        setLoadingUser(false);
        setInitializing(false);
      }
    };

    initializeAuth();
    
    // Cleanup function
    return () => {
      if (window._refreshTimeout) {
        clearTimeout(window._refreshTimeout);
      }
    };
  }, []); // Only run once on mount

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