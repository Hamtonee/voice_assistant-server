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
  // Simplified initial token check
  const [token, setToken] = useState(() => {
    const storedToken = localStorage.getItem('access_token');
    
    if (storedToken && storedToken !== 'null' && storedToken !== 'undefined') {
      try {
        const decoded = jwtDecode(storedToken);
        const now = Date.now() / 1000;
        
        // Only reject if clearly expired (add 30 second buffer)
        if (decoded.exp && decoded.exp > (now - 30)) {
          console.log('✅ Valid token found, expires:', new Date(decoded.exp * 1000));
          return storedToken.trim();
        } else {
          console.log('❌ Token expired, clearing storage');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      } catch (error) {
        console.log('❌ Invalid token format, clearing storage');
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
  const [isLoggingIn, setIsLoggingIn] = useState(false); // NEW: Track login state
  const navigate = useNavigate();

  // Enhanced auth cleanup
  const clearAuth = useCallback((reason = 'Unknown') => {
    console.log('🧹 Clearing authentication state. Reason:', reason);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    delete api.defaults.headers.common.Authorization;
    setToken(null);
    setUser(null);
    setSessionConflict(null);
    if (window._refreshTimeout) {
      clearTimeout(window._refreshTimeout);
      delete window._refreshTimeout;
    }
  }, []);

  // FIXED: Much more selective response interceptor
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        const url = error.config?.url || '';
        const status = error.response?.status;
        const errorDetail = error.response?.data?.detail || '';
        
        console.log('🚨 API Error intercepted:', status, url, errorDetail);
        
        if (status === 401) {
          // NEVER clear auth during these operations:
          if (isLoggingIn || 
              url.includes('/api/auth/login') || 
              url.includes('/api/auth/register') ||
              url.includes('/api/auth/refresh')) {
            console.log('🔓 Ignoring 401 during auth operation:', url);
            return Promise.reject(error);
          }
          
          // ONLY clear auth for these specific scenarios:
          const shouldClearAuth = 
            errorDetail.includes('Token has expired') ||
            errorDetail.includes('Invalid token signature') ||
            errorDetail.includes('Malformed token') ||
            (errorDetail.includes('SESSION_CONFLICT') || errorDetail.includes('logged in elsewhere'));
          
          if (shouldClearAuth) {
            console.warn('🔒 Clearing auth due to:', errorDetail);
            
            if (errorDetail.includes('SESSION_CONFLICT') || errorDetail.includes('logged in elsewhere')) {
              setSessionConflict({
                message: 'You have been logged out because you logged in elsewhere.',
              });
            }
            
            clearAuth('Token/session issue');
          } else {
            console.log('🤷 401 error but not clearing auth:', errorDetail);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, [clearAuth, isLoggingIn]);

  // Token refresh function
  const refreshAndSchedule = useCallback(async () => {
    console.log('🔄 Attempting token refresh');
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (!refreshToken || refreshToken === 'null' || refreshToken === 'undefined') {
        console.log('❌ No valid refresh token');
        setLoadingUser(false);
        setInitializing(false);
        return;
      }

      // OPTION 1: Send refresh token in request body (most common)
      const res = await api.post('/api/auth/refresh', {
        refresh_token: refreshToken
      });
      
      // OPTION 2: If your backend expects it as Authorization header, uncomment below:
      // const tempHeader = api.defaults.headers.common.Authorization;
      // api.defaults.headers.common.Authorization = `Bearer ${refreshToken}`;
      // const res = await api.post('/api/auth/refresh');
      // api.defaults.headers.common.Authorization = tempHeader;
      
      const newToken = res.data.access_token;
      const newRefreshToken = res.data.refresh_token;

      if (!newToken) {
        throw new Error('No token received from refresh');
      }

      // Store tokens
      localStorage.setItem('access_token', newToken);
      if (newRefreshToken) {
        localStorage.setItem('refresh_token', newRefreshToken);
      }
      
      // Set API header and state
      api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
      setToken(newToken);

      // Schedule next refresh
      try {
        const decoded = jwtDecode(newToken);
        const expiresInMs = decoded.exp * 1000 - Date.now();
        const timeout = Math.max(expiresInMs - 60000, 30000); // 1 min buffer, min 30s

        if (window._refreshTimeout) clearTimeout(window._refreshTimeout);
        window._refreshTimeout = setTimeout(refreshAndSchedule, timeout);
        
        console.log('⏰ Next refresh in:', Math.floor(timeout / 1000), 'seconds');
      } catch (scheduleError) {
        console.warn('⚠️ Could not schedule next refresh:', scheduleError);
      }

    } catch (err) {
      console.error('❌ Token refresh failed:', err);
      clearAuth('Refresh failed');
    } finally {
      setLoadingUser(false);
      setInitializing(false);
    }
  }, [clearAuth]);

  // Initialize auth state
  useEffect(() => {
    console.log('🚀 AuthProvider initialization');
    
    if (token) {
      console.log('✅ Token found, setting up API header');
      api.defaults.headers.common.Authorization = `Bearer ${token}`;

      try {
        const { exp } = jwtDecode(token);
        const expiresInMs = exp * 1000 - Date.now();
        
        if (expiresInMs > 120000) { // More than 2 minutes left
          const timeout = Math.max(expiresInMs - 60000, 30000);
          if (window._refreshTimeout) clearTimeout(window._refreshTimeout);
          window._refreshTimeout = setTimeout(refreshAndSchedule, timeout);
          console.log('⏰ Refresh scheduled in:', Math.floor(timeout / 1000), 'seconds');
        } else {
          console.log('🔄 Token expires soon, refreshing now');
          refreshAndSchedule();
        }
      } catch (err) {
        console.error('❌ Invalid token format:', err);
        clearAuth('Invalid token format');
      }
    } else {
      // Try refresh token if available
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken && refreshToken !== 'null') {
        console.log('🔄 Trying refresh token');
        refreshAndSchedule();
      } else {
        console.log('❌ No tokens available');
        setLoadingUser(false);
        setInitializing(false);
      }
    }
  }, [token, refreshAndSchedule]);

  // FIXED: Much safer user profile fetching
  useEffect(() => {
    if (!token || isLoggingIn) {
      if (!token) setUser(null);
      return;
    }

    console.log('👤 Fetching user profile');
    setLoadingUser(true);

    // Add a small delay to ensure API headers are properly set
    const fetchProfile = async () => {
      try {
        console.log('📡 Making /api/auth/me request with token:', token.substring(0, 20) + '...');
        console.log('📡 Authorization header:', api.defaults.headers.common.Authorization?.substring(0, 30) + '...');
        
        const res = await api.get('/api/auth/me');
        console.log('✅ User profile loaded:', res.data);
        setUser(res.data);
      } catch (err) {
        console.error('❌ Failed to load user profile:', err);
        console.error('❌ Error response:', err.response?.data);
        console.error('❌ Error status:', err.response?.status);
        
        // MUCH MORE SELECTIVE about clearing auth
        if (err.response?.status === 401) {
          const errorDetail = err.response?.data?.detail || '';
          
          // Only clear auth for very specific token issues
          if (errorDetail.includes('Token has expired') ||
              errorDetail.includes('Invalid token signature') ||
              errorDetail.includes('Malformed token')) {
            console.warn('🔒 Clearing auth due to definitive token issue:', errorDetail);
            clearAuth('Profile fetch - definitive token issue');
          } else {
            console.warn('🤷 Profile fetch 401 but not clearing auth:', errorDetail);
            // Don't clear auth - might be a temporary issue
          }
        }
      } finally {
        setLoadingUser(false);
        setInitializing(false);
      }
    };

    // Small delay to ensure everything is set up properly
    const timeoutId = setTimeout(fetchProfile, 100);
    
    return () => clearTimeout(timeoutId);
  }, [token, clearAuth, isLoggingIn]);

  // FIXED: Enhanced login function
  const login = async ({ email, password }, forceNewSession = false) => {
    console.log('🔐 Starting login for:', email);
    setIsLoggingIn(true); // Set login state
    
    try {
      // Clear existing auth
      clearAuth('Starting new login');
      
      const payload = { email, password };
      if (forceNewSession) {
        payload.forceNewSession = true;
      }
      
      const res = await api.post('/api/auth/login', payload);
      console.log('✅ Login response received');
      
      const newToken = res.data.access_token;
      const refreshToken = res.data.refresh_token;

      if (!newToken) {
        throw new Error('No access token received');
      }

      // Clear session conflict
      setSessionConflict(null);

      // Store tokens
      localStorage.setItem('access_token', newToken);
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }
      
      // Set API header BEFORE setting token state
      api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
      
      // Set token state (this will trigger user profile fetch)
      setToken(newToken);

      // Schedule refresh
      try {
        const decoded = jwtDecode(newToken);
        const expiresInMs = decoded.exp * 1000 - Date.now();
        const timeout = Math.max(expiresInMs - 60000, 30000);
        
        if (window._refreshTimeout) clearTimeout(window._refreshTimeout);
        window._refreshTimeout = setTimeout(refreshAndSchedule, timeout);
      } catch (scheduleError) {
        console.warn('⚠️ Could not schedule refresh:', scheduleError);
      }

      // Fetch user profile manually with retry
      let retries = 3;
      let userProfile = null;
      
      while (retries > 0 && !userProfile) {
        try {
          const userRes = await api.get('/api/auth/me');
          userProfile = userRes.data;
          setUser(userProfile);
          console.log('✅ User profile loaded after login');
          break;
        } catch (profileError) {
          console.warn(`⚠️ Profile fetch attempt failed (${4-retries}/3):`, profileError);
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms before retry
          }
        }
      }

      if (!userProfile) {
        throw new Error('Could not load user profile after login');
      }
      
      console.log('🚀 Login successful, navigating to chats');
      
      // Navigate after everything is set up
      setTimeout(() => {
        navigate('/chats', { replace: true });
      }, 100);
      
      return { success: true, user: userProfile };
      
    } catch (error) {
      console.error('❌ Login failed:', error);
      clearAuth('Login failed');
      throw error;
    } finally {
      setIsLoggingIn(false); // Clear login state
    }
  };

  // Force login for session conflicts
  const forceLogin = async (credentials) => {
    return await login(credentials, true);
  };

  // Register function
  const register = async ({ email, password, name }) => {
    console.log('📝 Registration attempt for:', email);
    
    try {
      clearAuth('Starting registration');
      
      const res = await api.post('/api/auth/register', { 
        email, 
        password, 
        name 
      });
      
      console.log('✅ Registration successful');
      return { success: true, user: res.data };
      
    } catch (error) {
      console.error('❌ Registration failed:', error);
      throw error;
    }
  };

  const clearSessionConflict = () => {
    setSessionConflict(null);
  };

  const logout = async () => {
    console.log('🚪 Logging out');
    
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await api.post('/api/auth/logout', { refresh_token: refreshToken });
      }
    } catch (err) {
      console.warn('⚠️ Server logout failed:', err);
    }
    
    clearAuth('User logout');
    navigate('/login', { replace: true });
  };

  // Computed authentication status
  const isAuthenticated = Boolean(token && user && !isLoggingIn);

  console.log('🔍 Auth state:', {
    hasToken: !!token,
    hasUser: !!user,
    isAuthenticated,
    loadingUser,
    initializing,
    isLoggingIn
  });

  // Show loader while determining auth status
  if ((loadingUser || initializing) && !isAuthenticated) {
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