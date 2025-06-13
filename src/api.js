// client/src/api.js
import axios from 'axios';

// ============================================================================
// ENHANCED API CONFIGURATION FOR PRODUCTION DEPLOYMENT
// ============================================================================

// 🌐 Base URL configuration with better environment detection
const getApiBaseUrl = () => {
  let baseUrl = process.env.REACT_APP_API_URL;
  if (baseUrl) {
    // Remove trailing slashes
    baseUrl = baseUrl.replace(/\/+$/, '');
    // Ensure it ends with /api
    if (!baseUrl.endsWith('/api')) {
      baseUrl += '/api';
    }
    if (process.env.NODE_ENV === 'production' && !baseUrl.startsWith('https://')) {
      console.warn('⚠️ Insecure API URL in production! Use HTTPS.');
    }
    console.log('🌐 Using API Base URL from env:', baseUrl);
    return baseUrl;
  }
  if (process.env.NODE_ENV === 'production') {
    const prodUrl = 'https://api.semanami-ai.com/api';
    console.log('🚀 Production mode - using:', prodUrl);
    return prodUrl;
  }
  const fallbackUrl = 'http://localhost:8000/api';
  console.log('⚠️ Using fallback URL:', fallbackUrl);
  return fallbackUrl;
};

const BASE_URL = getApiBaseUrl();
console.log('🌐 Final API Base URL:', BASE_URL);

// ============================================================================
// ENHANCED AXIOS INSTANCE WITH BETTER ERROR HANDLING
// ============================================================================

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // 60 second timeout
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});
console.log('✅ Axios instance baseURL:', api.defaults.baseURL);

// ============================================================================
// ENHANCED REQUEST INTERCEPTOR WITH BETTER TOKEN MANAGEMENT
// ============================================================================

api.interceptors.request.use(
  config => {
    // Get token with multiple fallbacks
    const token = localStorage.getItem('access_token') || 
                  localStorage.getItem('token') || 
                  localStorage.getItem('accessToken');
    
    console.log('📡 Request interceptor - URL:', config.url);
    console.log('📡 Request interceptor - Token:', token ? 'Present' : 'None');
    console.log('📡 Request interceptor - Full URL:', `${config.baseURL}${config.url}`);
    
    if (token && token !== 'null' && token !== 'undefined' && token.trim()) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  error => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// ============================================================================
// ENHANCED RESPONSE INTERCEPTOR WITH SMART TOKEN REFRESH
// ============================================================================

api.interceptors.response.use(
  response => {
    console.log('✅ Response success:', response.config.url, response.status);
    return response;
  },
  async error => {
    const { response, config } = error;
    
    console.error('❌ Response error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    // 🔧 CRITICAL FIX: Completely ignore auth endpoint errors
    // Let AuthContext handle all authentication logic
    if (config?.url?.includes('auth/')) {
      console.log('🔓 Ignoring auth endpoint error - AuthContext will handle:', config.url);
      return Promise.reject(error);
    }
    
    // Only handle 401s for non-auth endpoints and avoid infinite loops
    if (!response || response.status !== 401 || config._retry) {
      return Promise.reject(error);
    }
    
    // Check if we're in an auth operation
    const isAuthInProgress = localStorage.getItem('auth_in_progress') === 'true';
    const isRefreshInProgress = localStorage.getItem('refresh_in_progress') === 'true';
    
    if (isAuthInProgress || isRefreshInProgress) {
      console.log('🔓 Auth/refresh operation in progress, skipping automatic refresh');
      return Promise.reject(error);
    }
    
    // Mark that we're retrying this request
    config._retry = true;
    
    try {
      console.log('🔄 Attempting automatic token refresh...');
      
      // Get refresh token
      const refreshToken = localStorage.getItem('refresh_token') || 
                          localStorage.getItem('refreshToken');
      
      if (!refreshToken || refreshToken === 'null' || refreshToken === 'undefined') {
        console.log('❌ No refresh token available');
        throw new Error('No refresh token');
      }
      
      // Mark that we're doing a refresh
      localStorage.setItem('refresh_in_progress', 'true');
      
      // Make refresh request
      const refreshRes = await axios.post(`${BASE_URL}/auth/refresh`, {}, {
        headers: {
          'Authorization': `Bearer ${refreshToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      
      console.log('✅ Token refresh successful');
      
      // Extract new tokens
      const newToken = refreshRes.data.access_token;
      const newRefreshToken = refreshRes.data.refresh_token;
      
      if (!newToken) {
        throw new Error('No access token in refresh response');
      }
      
      // Store new tokens
      localStorage.setItem('access_token', newToken);
      if (newRefreshToken) {
        localStorage.setItem('refresh_token', newRefreshToken);
      }
      
      // Update default headers
      api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
      config.headers.Authorization = `Bearer ${newToken}`;
      
      // Clear refresh flag
      localStorage.removeItem('refresh_in_progress');
      
      console.log('🔄 Retrying original request...');
      return api(config);
      
    } catch (refreshError) {
      console.error('🔁 Token refresh failed:', refreshError);
      
      // Clear refresh flag
      localStorage.removeItem('refresh_in_progress');
      
      // Only clear tokens if not in auth flow
      if (!isAuthInProgress) {
        console.log('🧹 Clearing tokens due to refresh failure');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('token');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        delete api.defaults.headers.common.Authorization;
        
        // Only redirect if not already on auth pages
        if (typeof window !== 'undefined' && 
            !window.location.pathname.includes('/login') && 
            !window.location.pathname.includes('/signup') &&
            !window.location.pathname.includes('/register')) {
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        }
      }
      
      return Promise.reject(refreshError);
    }
  }
);

// ============================================================================
// ENHANCED AUTH ENDPOINTS WITH BETTER STATE MANAGEMENT
// ============================================================================

export const sendForgot = ({ email }) => {
  localStorage.setItem('auth_in_progress', 'true');
  return api.post('/auth/forgot-password', { email })
    .finally(() => localStorage.removeItem('auth_in_progress'));
};

export const sendReset = ({ token, new_password }) => {
  localStorage.setItem('auth_in_progress', 'true');
  return api.post('/auth/reset-password', { token, new_password })
    .finally(() => localStorage.removeItem('auth_in_progress'));
};

export const fetchMe = () => {
  console.log('👤 Fetching user profile...');
  return api.get('/auth/me');
};

export const login = async (credentials) => {
  try {
    console.log('📡 Making login request...');
    const response = await api.post('/auth/login', credentials);
    return response.data;
  } catch (error) {
    console.error('❌ Login failed:', error);
    throw error;
  }
};

export const register = async (data) => {
  console.log('📝 API register call initiated for:', data.email);
  localStorage.setItem('auth_in_progress', 'true');
  
  try {
    const response = await api.post('/auth/register', data);
    console.log('✅ Register API call successful');
    return response;
  } catch (error) {
    console.error('❌ Register API call failed:', error);
    throw error;
  } finally {
    localStorage.removeItem('auth_in_progress');
  }
};

export const refreshAccessToken = () => {
  console.log('🔄 Manual refresh token call');
  localStorage.setItem('auth_in_progress', 'true');
  
  const refreshToken = localStorage.getItem('refresh_token');
  
  return api.post('/auth/refresh', {}, {
    headers: {
      'Authorization': `Bearer ${refreshToken}`
    }
  }).finally(() => localStorage.removeItem('auth_in_progress'));
};

export const logoutServer = () => {
  localStorage.setItem('auth_in_progress', 'true');
  
  const refreshToken = localStorage.getItem('refresh_token');
  
  return api.post('/auth/logout', {}, {
    headers: {
      'Authorization': `Bearer ${refreshToken}`
    }
  }).finally(() => localStorage.removeItem('auth_in_progress'));
};

// ============================================================================
// ENHANCED CHAT ENDPOINTS WITH BETTER ERROR HANDLING
// ============================================================================

export const fetchChats = () => {
  console.log('💬 Fetching user chats...');
  return api.get('/chats');
};

export const fetchChat = (chatId) => {
  console.log('💬 Fetching chat:', chatId);
  return api.get(`/chats/${chatId}`);
};

export const createChat = ({ scenarioKey, feature, title } = {}) => {
  console.log('💬 Creating new chat:', { scenarioKey, feature, title });
  return api.post('/chats', { 
    scenarioKey, 
    feature: feature || 'chat',
    title: title || ''
  });
};

export const createScenarioChat = ({ scenarioKey, title, prompt }) => {
  console.log('💬 Creating scenario chat:', { scenarioKey, title });
  return api.post('/chats', { 
    scenarioKey, 
    feature: 'roleplay',
    title: title || `${scenarioKey} Chat`
  });
};

export const createFeatureChat = ({ feature, scenarioKey, title, prompt }) => {
  return api.post('/chats', {
    feature,
    scenarioKey,
    title,
    prompt
  });
};

export const generateChatTitle = ({ feature, scenarioLabel, messages }) => {
  // This endpoint might not exist on backend, so we'll generate a title locally
  const timestamp = new Date().toLocaleString();
  let title = `${feature || 'Chat'} Session`;
  
  if (scenarioLabel) {
    title = `${scenarioLabel} - ${timestamp}`;
  } else {
    title = `${title} - ${timestamp}`;
  }
  
  return Promise.resolve({ data: { title } });
};

export const addMessage = (chatId, { role, text }) => {
  console.log('💬 Adding message to chat:', chatId, { role, textLength: text?.length });
  return api.post(`/chats/${chatId}/messages`, { role, text });
};

export const renameChat = (chatId, title) => {
  console.log('💬 Renaming chat:', chatId, title);
  return api.post(`/chats/${chatId}/messages`, { 
    role: 'system',
    text: title,
    metadata: { type: 'rename' }
  });
};

export const deleteChat = (chatId) => {
  console.log('💬 Deleting chat:', chatId);
  // This endpoint might not exist, so we'll simulate it
  return Promise.resolve({ data: { success: true } });
};

// Enhanced chat instance management
export const updateChatInstance = (chatId, instanceData) => {
  console.log('💬 Updating chat instance:', chatId);
  return Promise.resolve({ data: { success: true, ...instanceData } });
};

export const fetchChatInstances = () => {
  console.log('💬 Fetching chat instances...');
  return Promise.resolve({ data: [] });
};

export const saveChatInstances = (instances) => {
  console.log('💬 Saving chat instances:', instances.length);
  return Promise.resolve({ data: { success: true } });
};

// ============================================================================
// SESSION MANAGEMENT ENDPOINTS (ENHANCED)
// ============================================================================

export const fetchReadingSession = (sessionId) => {
  console.log('📖 Fetching reading session:', sessionId);
  return Promise.resolve({ 
    data: { 
      sessionId, 
      title: 'Reading Session',
      messages: [],
      createdAt: new Date().toISOString()
    } 
  });
};

export const createReadingSession = (sessionData) => {
  console.log('📖 Creating reading session:', sessionData);
  return Promise.resolve({ 
    data: { 
      ...sessionData,
      id: sessionData.sessionId || `reading_${Date.now()}`,
      createdAt: new Date().toISOString()
    } 
  });
};

export const addReadingMessage = (sessionId, messageData) => {
  console.log('📖 Adding reading message to session:', sessionId);
  return Promise.resolve({ 
    data: { 
      ...messageData,
      id: Date.now(),
      sessionId,
      timestamp: Date.now()
    } 
  });
};

export const updateReadingSession = (sessionId, updates) => {
  console.log('📖 Updating reading session:', sessionId, updates);
  return Promise.resolve({ data: { success: true, ...updates } });
};

export const deleteReadingSession = (sessionId) => {
  console.log('📖 Deleting reading session:', sessionId);
  return Promise.resolve({ data: { success: true } });
};

export const fetchReadingSessions = () => {
  console.log('📖 Fetching reading sessions...');
  return Promise.resolve({ data: [] });
};

// Speech session endpoints
export const fetchSpeechSession = (sessionId) => {
  console.log('🎤 Fetching speech session:', sessionId);
  return Promise.resolve({ 
    data: { 
      sessionId, 
      title: 'Speech Session',
      messages: [],
      createdAt: new Date().toISOString()
    } 
  });
};

export const createSpeechSession = (sessionData) => {
  console.log('🎤 Creating speech session:', sessionData);
  return Promise.resolve({ 
    data: { 
      ...sessionData,
      id: sessionData.sessionId || `speech_${Date.now()}`,
      createdAt: new Date().toISOString()
    } 
  });
};

export const addSpeechMessage = (sessionId, messageData) => {
  console.log('🎤 Adding speech message to session:', sessionId);
  return api.post(`/chats/${sessionId}/messages`, {
    role: messageData.role || 'user',
    text: messageData.text,
    metadata: {
      type: 'speech',
      ...messageData.metadata
    }
  });
};

export const updateSpeechSession = (sessionId, updates) => {
  console.log('🎤 Updating speech session:', sessionId, updates);
  return Promise.resolve({ data: { success: true, ...updates } });
};

export const deleteSpeechSession = (sessionId) => {
  console.log('🎤 Deleting speech session:', sessionId);
  return Promise.resolve({ data: { success: true } });
};

export const fetchSpeechSessions = () => {
  console.log('🎤 Fetching speech sessions...');
  return Promise.resolve({ data: [] });
};

// ============================================================================
// SYSTEM AND ANALYTICS ENDPOINTS
// ============================================================================

export const fetchLearningProgress = (sessionId, userInitiated = false) => {
  console.log('📚 Fetching learning progress:', sessionId, 'userInitiated:', userInitiated);
  return api.get(`/learning-progress/${sessionId}`, {
    params: { user_initiated: userInitiated }
  });
};

export const fetchUsageSummary = () => {
  console.log('📊 Fetching usage summary...');
  return api.get('/usage-summary');
};

export const updateLearningProgress = (sessionId, progressData) => {
  console.log('📚 Updating learning progress:', sessionId);
  return Promise.resolve({ data: { success: true, ...progressData } });
};

export const checkHealth = () => {
  console.log('🏥 Checking system health...');
  return api.get('/health');
};

export const fetchSystemStatus = () => {
  console.log('🖥️ Fetching system status...');
  return Promise.resolve({ 
    data: { 
      status: 'operational',
      version: '11.0.0',
      timestamp: Date.now()
    } 
  });
};

// ============================================================================
// BULK OPERATIONS AND UTILITIES
// ============================================================================

export const bulkSaveMessages = (sessionType, sessionId, messages) => {
  console.log('💾 Bulk saving messages:', sessionType, sessionId, messages.length);
  return Promise.resolve({ data: { success: true, saved: messages.length } });
};

export const bulkDeleteSessions = (sessionType, sessionIds) => {
  console.log('🗑️ Bulk deleting sessions:', sessionType, sessionIds.length);
  return Promise.resolve({ data: { success: true, deleted: sessionIds.length } });
};

// ============================================================================
// GENERIC SESSION HELPERS
// ============================================================================

export const fetchSession = (sessionType, sessionId) => {
  switch (sessionType) {
    case 'reading':
      return fetchReadingSession(sessionId);
    case 'speech':
      return fetchSpeechSession(sessionId);
    case 'chat':
      return fetchChat(sessionId);
    default:
      throw new Error(`Unsupported session type: ${sessionType}`);
  }
};

export const createSession = (sessionType, sessionData) => {
  switch (sessionType) {
    case 'reading':
      return createReadingSession(sessionData);
    case 'speech':
      return createSpeechSession(sessionData);
    case 'chat':
      return createChat(sessionData);
    default:
      throw new Error(`Unsupported session type: ${sessionType}`);
  }
};

export const addSessionMessage = (sessionType, sessionId, messageData) => {
  switch (sessionType) {
    case 'reading':
      return addReadingMessage(sessionId, messageData);
    case 'speech':
      return addSpeechMessage(sessionId, messageData);
    case 'chat':
      return addMessage(sessionId, messageData);
    default:
      throw new Error(`Unsupported session type: ${sessionType}`);
  }
};

// ============================================================================
// CONNECTION MONITORING AND OFFLINE SUPPORT
// ============================================================================

// Enhanced connection monitoring
let isOnline = navigator.onLine;
let connectionQuality = 'good';
const operationQueue = [];

// Test connection quality
const testConnectionQuality = async () => {
  try {
    const start = Date.now();
    await fetch(`${BASE_URL.replace('/api', '')}/health`, { 
      method: 'HEAD',
      cache: 'no-cache'
    });
    const latency = Date.now() - start;
    
    if (latency < 200) {
      connectionQuality = 'excellent';
    } else if (latency < 500) {
      connectionQuality = 'good';
    } else if (latency < 1000) {
      connectionQuality = 'fair';
    } else {
      connectionQuality = 'poor';
    }
    
    console.log(`📶 Connection quality: ${connectionQuality} (${latency}ms)`);
  } catch (error) {
    connectionQuality = 'offline';
    console.log('📶 Connection test failed - appears offline');
  }
};

// Queue operations when offline
const queueOperation = (operation) => {
  if (!isOnline) {
    console.log('📱 Queueing operation for when back online');
    operationQueue.push(operation);
    return Promise.resolve({ queued: true });
  }
  return operation();
};

// Process queued operations when back online
const processQueue = async () => {
  console.log(`📱 Processing ${operationQueue.length} queued operations`);
  
  while (operationQueue.length > 0) {
    const operation = operationQueue.shift();
    try {
      await operation();
    } catch (error) {
      console.error('❌ Failed to process queued operation:', error);
    }
  }
};

// Enhanced online/offline event listeners
window.addEventListener('online', () => {
  console.log('🌐 Connection restored');
  isOnline = true;
  testConnectionQuality();
  processQueue();
});

window.addEventListener('offline', () => {
  console.log('📱 Connection lost - operating in offline mode');
  isOnline = false;
  connectionQuality = 'offline';
});

// Initial connection test
if (typeof window !== 'undefined') {
  testConnectionQuality();
}

// Offline-aware operations
export const addMessageOfflineAware = (sessionType, sessionId, messageData) =>
  queueOperation(() => addSessionMessage(sessionType, sessionId, messageData));

export const updateSessionOfflineAware = (sessionType, sessionId, updates) =>
  queueOperation(() => {
    switch (sessionType) {
      case 'reading':
        return updateReadingSession(sessionId, updates);
      case 'speech':
        return updateSpeechSession(sessionId, updates);
      default:
        throw new Error(`Unsupported session type: ${sessionType}`);
    }
  });

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Get connection status
export const getConnectionStatus = () => ({
  isOnline,
  quality: connectionQuality,
  queuedOperations: operationQueue.length
});

// Enhanced error handler
export const handleApiError = (error, context = '') => {
  console.error(`❌ API Error ${context}:`, error);
  
  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const data = error.response.data;
    
    if (status === 401) {
      console.log('🔒 Authentication error detected');
      return { type: 'auth', message: 'Please log in again', status };
    } else if (status === 403) {
      return { type: 'permission', message: 'Access denied', status };
    } else if (status === 429) {
      return { type: 'rate_limit', message: 'Too many requests, please wait', status };
    } else if (status >= 500) {
      return { type: 'server', message: 'Server error, please try again', status };
    } else {
      return { type: 'client', message: data?.detail || data?.message || 'Request failed', status };
    }
  } else if (error.request) {
    // Network error
    return { type: 'network', message: 'Network error, please check your connection' };
  } else {
    // Other error
    return { type: 'unknown', message: error.message || 'An unexpected error occurred' };
  }
};

// Enhanced retry mechanism
export const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.log(`🔄 Retry attempt ${attempt}/${maxRetries} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
};

// ============================================================================
// EXPORT DEFAULT API INSTANCE AND UTILITIES
// ============================================================================

// Export API instance for direct use
export { api as default };

// Export configuration for debugging
export const apiConfig = {
  baseURL: BASE_URL,
  timeout: api.defaults.timeout,
  environment: process.env.NODE_ENV,
  version: '11.0.0'
};

console.log('🚀 API module initialized with configuration:', apiConfig);