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
        }

        // Update state
        setToken(newToken);
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;

        // Schedule next refresh
        scheduleTokenRefresh(decoded.exp);

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
      refreshAndSchedule();
    }, refreshDelay);
  }, [refreshAndSchedule]);

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
        await refreshAndSchedule();
      } else {
        clearAuth();
      }
      throw error;
    }
  };

  // ============================================================================
  // ENHANCED LOGIN FUNCTION
  // ============================================================================
  
  const login = async ({ email, password }, forceNewSession = false) => {
    try {
      setLoadingUser(true);
      console.log('🔐 Attempting login for:', email);
      
      const response = await api.post('/auth/login', { 
        email: email.trim().toLowerCase(), 
        password,
        force_new_session: forceNewSession 
      });
      
      const { access_token, refresh_token, user: userData } = response.data;
      
      if (!access_token) {
        throw new Error('No access token received');
      }
      
      // Validate token
      const decoded = jwtDecode(access_token);
      if (!decoded.exp || decoded.exp <= Date.now() / 1000) {
        throw new Error('Received expired token');
      }
      
      // Store tokens
      localStorage.setItem('access_token', access_token);
      if (refresh_token) {
        localStorage.setItem('refresh_token', refresh_token);
      }
      
      // Update state
      setToken(access_token);
      setUser(userData || { email });
      setSessionConflict(null);
      
      // Set API header
      api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
      
      // Schedule refresh
      scheduleTokenRefresh(decoded.exp);
      
      console.log('✅ Login successful');
      
      // Handle pending navigation
      if (pendingNavigation) {
        navigate(pendingNavigation);
        setPendingNavigation(null);
      }
      
      return { success: true, user: userData || { email } };
      
    } catch (error) {
      console.error('❌ Login failed:', error);
      
      if (error.response?.status === 409) {
        setSessionConflict({
          message: error.response.data?.detail || 'Session conflict detected',
          email
        });
        return { success: false, sessionConflict: true };
      }
      
      throw error;
    } finally {
      setLoadingUser(false);
    }
  };

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
    return await login(credentials, true);
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
  
  const logout = async () => {
    try {
      console.log('👋 Logging out...');
      
      // Try to revoke the refresh token on the server
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          await api.post('/auth/logout', {}, {
            headers: { Authorization: `Bearer ${refreshToken}` }
          });
        } catch (error) {
          console.warn('⚠️ Logout request failed, but continuing with local cleanup:', error);
        }
      }
      
      clearAuth();
      console.log('✅ Logout completed');
      navigate('/');
      
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Even if logout fails, clear local state
      clearAuth();
      navigate('/');
    }
  };

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
              await refreshAndSchedule();
            } else {
              console.log('✅ Token valid, fetching user profile...');
              await fetchUserProfile();
              scheduleTokenRefresh(decoded.exp);
            }
          } catch (error) {
            console.error('❌ Token validation failed:', error);
            await refreshAndSchedule();
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
    isAuthenticated: Boolean(token && user),
    loadingUser,
    initializing,
    sessionConflict,
    login,
    register,
    logout,
    setUser,
    clearSessionConflict,
    forceLogin,
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