// Safe environment variable access
const getApiBase = () => {
  try {
    return (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) || '/api';
  } catch (error) {
    console.warn('Failed to access REACT_APP_API_URL, using fallback');
    return '/api';
  }
};

export const endpoints = {
  API_BASE: getApiBase(),
  
  // Authentication endpoints
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  
  // Chat endpoints
  CHAT: {
    SESSIONS: '/chat/sessions',
    MESSAGES: '/chat/messages',
    GENERATE: '/chat/generate',
  },
  
  // Voice endpoints
  VOICE: {
    TTS: '/voice/tts',
    STT: '/voice/stt',
    VOICES: '/voice/voices',
  },
  
  // Reading endpoints
  READING: {
    GENERATE: '/reading/generate',
    TOPICS: '/reading/topics',
  },
  
  TTS: '/tts',  // Updated from /deepspeak-tts
  SPEECH_COACH: '/speech-coach',
  CHAT_ROLEPLAY: '/chat-roleplay',
  READING_TOPIC: '/reading-topic',
  HEALTH: '/api/health',
  USAGE: '/api/usage-summary',
  LEARNING_PROGRESS: '/learning-progress',
  CHATS: '/chats',
};

export default endpoints; 