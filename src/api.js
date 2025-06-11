// client/src/api.js
import axios from 'axios';

// 🌐 Base URL configuration (from .env or fallback)
const BASE_URL =
  process.env.REACT_APP_API_BASE_URL?.replace(/\/+$/, '') || // strip trailing slash if any
  'http://localhost:8000/api'; // Keep original path structure

console.log('🌐 API Base URL:', BASE_URL); // Debug log

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // Add timeout to handle slow responses
  withCredentials: true, // Send HTTP-only refresh cookie
});

// ———————————————————————————————————————————————
// 🔐 Attach JWT from localStorage to every request
// ———————————————————————————————————————————————
api.interceptors.request.use(
  config => {
    // FIXED: Use 'access_token' to match AuthContext
    const token = localStorage.getItem('access_token');
    console.log('📡 Request interceptor - Token:', token ? 'Present' : 'None');
    console.log('📡 Request URL:', config.baseURL + config.url);
    
    if (token && token !== 'null' && token !== 'undefined') {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// ———————————————————————————————————————————————
// 🚨 Global 401 handler → try refresh → retry original
// FIXED: Don't interfere with auth endpoints
// ———————————————————————————————————————————————
api.interceptors.response.use(
  response => {
    console.log('✅ Response success:', response.config.url, response.status);
    return response;
  },
  async error => {
    console.error('❌ Response error:', error.config?.url, error.response?.status, error.response?.data);
    
    const { response, config } = error;
    if (!response || response.status !== 401 || config._retry) {
      return Promise.reject(error);
    }
    
    // FIXED: Don't try refresh on these endpoints - prevent interference with login
    const skipRefresh = [
      '/auth/login',
      '/auth/register', 
      '/auth/forgot-password',
      '/auth/reset-password',
      '/auth/refresh',
    ];
    
    // CRITICAL FIX: Check if this is an auth endpoint
    const isAuthEndpoint = skipRefresh.some(path => config.url?.endsWith(path));
    if (isAuthEndpoint) {
      console.log('🔓 Skipping refresh for auth endpoint:', config.url);
      return Promise.reject(error);
    }
    
    config._retry = true;
    
    try {
      console.log('🔄 Attempting token refresh...');
      const refreshRes = await api.post('/auth/refresh');
      
      // FIXED: Use 'access_token' to match backend response
      const newToken = refreshRes.data.access_token;
      console.log('✅ Token refresh successful');
      
      // FIXED: Store with 'access_token' key
      localStorage.setItem('access_token', newToken);
      api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
      config.headers.Authorization = `Bearer ${newToken}`;
      
      console.log('🔄 Retrying original request...');
      return api(config);
    } catch (refreshError) {
      console.warn('🔁 Refresh failed, redirecting to login');
      // FIXED: Remove 'access_token' key
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      delete api.defaults.headers.common.Authorization;
      
      // Don't redirect immediately during login process
      if (!config.url?.includes('/auth/')) {
        window.location.href = '/login';
      }
      return Promise.reject(refreshError);
    }
  }
);

// ———————————————————————————————————————————————
// 🛠 AUTH ENDPOINTS
// ———————————————————————————————————————————————
export const sendForgot = ({ email }) =>
  api.post('/auth/forgot-password', { email });

export const sendReset = ({ token, new_password }) =>
  api.post('/auth/reset-password', { token, new_password });

export const fetchMe = () => api.get('/auth/me');

export const login = creds => api.post('/auth/login', creds);

export const register = data => api.post('/auth/register', data);

export const refreshAccessToken = () => api.post('/auth/refresh');

export const logoutServer = () => api.post('/auth/logout');

// ———————————————————————————————————————————————
// 💬 CHAT ENDPOINTS (Enhanced)
// ———————————————————————————————————————————————
export const fetchChats = () => api.get('/chats');

export const fetchChat = chatId => api.get(`/chats/${chatId}`);

export const createChat = ({ scenarioKey } = {}) =>
  api.post('/chats', { scenarioKey });

export const createScenarioChat = ({ scenarioKey, title, prompt }) =>
  api.post('/chats/scenario', { scenarioKey, title, prompt });

export const createFeatureChat = ({ feature, scenarioKey, title, prompt }) =>
  api.post('/chats/feature', { feature, scenarioKey, title, prompt });

export const generateChatTitle = ({ feature, scenarioLabel, messages }) =>
  api.post('/chats/chat-title', { feature, scenarioLabel, messages });

export const addMessage = (chatId, { role, text }) =>
  api.post(`/chats/${chatId}/messages`, { role, text });

export const renameChat = (chatId, title) =>
  api.put(`/chats/${chatId}/rename`, { title });

export const deleteChat = chatId => api.delete(`/chats/${chatId}`);

// Enhanced chat instance management
export const updateChatInstance = (chatId, instanceData) =>
  api.put(`/chats/${chatId}/instance`, instanceData);

export const fetchChatInstances = () => api.get('/chats/instances');

export const saveChatInstances = (instances) =>
  api.post('/chats/instances/bulk', { instances });

// ———————————————————————————————————————————————
// 📖 READING SESSION ENDPOINTS
// ———————————————————————————————————————————————
export const fetchReadingSession = (sessionId) =>
  api.get(`/reading-sessions/${sessionId}`);

export const createReadingSession = (sessionData) =>
  api.post('/reading-sessions', {
    sessionId: sessionData.sessionId || `reading_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: sessionData.title || 'Reading Session',
    category: sessionData.category,
    difficulty: sessionData.difficulty,
    articleData: sessionData.articleData,
    createdAt: new Date().toISOString()
  });

export const addReadingMessage = (sessionId, messageData) =>
  api.post(`/reading-sessions/${sessionId}/messages`, {
    role: messageData.role,
    text: messageData.text,
    timestamp: messageData.timestamp || Date.now()
  });

export const updateReadingSession = (sessionId, updates) =>
  api.put(`/reading-sessions/${sessionId}`, updates);

export const deleteReadingSession = (sessionId) =>
  api.delete(`/reading-sessions/${sessionId}`);

export const fetchReadingSessions = () =>
  api.get('/reading-sessions');

// ———————————————————————————————————————————————
// 🎤 SPEECH SESSION ENDPOINTS
// ———————————————————————————————————————————————
export const fetchSpeechSession = (sessionId) =>
  api.get(`/speech-sessions/${sessionId}`);

export const createSpeechSession = (sessionData) =>
  api.post('/speech-sessions', {
    sessionId: sessionData.sessionId || `speech_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: sessionData.title || 'Speech Session',
    voiceConfig: sessionData.voiceConfig,
    createdAt: new Date().toISOString()
  });

export const addSpeechMessage = (sessionId, messageData) =>
  api.post(`/speech-sessions/${sessionId}/messages`, {
    role: messageData.role,
    text: messageData.text,
    voiceUsed: messageData.voiceUsed,
    corrected: messageData.corrected,
    learningProgress: messageData.learningProgress,
    timestamp: messageData.timestamp || Date.now()
  });

export const updateSpeechSession = (sessionId, updates) =>
  api.put(`/speech-sessions/${sessionId}`, updates);

export const deleteSpeechSession = (sessionId) =>
  api.delete(`/speech-sessions/${sessionId}`);

export const fetchSpeechSessions = () =>
  api.get('/speech-sessions');

// ———————————————————————————————————————————————
// 📊 SESSION ANALYTICS & PROGRESS
// ———————————————————————————————————————————————
export const fetchLearningProgress = (sessionId, userInitiated = false) =>
  api.get(`/learning-progress/${sessionId}`, {
    params: { user_initiated: userInitiated }
  });

export const fetchUsageSummary = () =>
  api.get('/usage-summary');

export const updateLearningProgress = (sessionId, progressData) =>
  api.post(`/learning-progress/${sessionId}`, progressData);

// ———————————————————————————————————————————————
// 🔧 UTILITY ENDPOINTS
// ———————————————————————————————————————————————
export const checkHealth = () =>
  api.get('/health');

export const fetchSystemStatus = () =>
  api.get('/system/status');

// Bulk operations for better performance
export const bulkSaveMessages = (sessionType, sessionId, messages) =>
  api.post(`/${sessionType}-sessions/${sessionId}/messages/bulk`, { messages });

export const bulkDeleteSessions = (sessionType, sessionIds) =>
  api.delete(`/${sessionType}-sessions/bulk`, { data: { sessionIds } });

// ———————————————————————————————————————————————
// 🎯 SESSION MANAGEMENT HELPERS
// ———————————————————————————————————————————————

// Generic session operations that work with both reading and speech sessions
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

// ———————————————————————————————————————————————
// 📱 MOBILE & OFFLINE SUPPORT
// ———————————————————————————————————————————————

// Queue operations for offline support
const operationQueue = [];
let isOnline = navigator.onLine;

// Queue operations when offline
const queueOperation = (operation) => {
  if (!isOnline) {
    operationQueue.push(operation);
    return Promise.resolve({ queued: true });
  }
  return operation();
};

// Process queued operations when back online
const processQueue = async () => {
  while (operationQueue.length > 0) {
    const operation = operationQueue.shift();
    try {
      await operation();
    } catch (error) {
      console.error('Failed to process queued operation:', error);
      // Could implement retry logic here
    }
  }
};

// Listen for online/offline events
window.addEventListener('online', () => {
  isOnline = true;
  processQueue();
});

window.addEventListener('offline', () => {
  isOnline = false;
});

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

// ———————————————————————————————————————————————
// 🚀 EXPORT DEFAULT
// ———————————————————————————————————————————————
export default api;