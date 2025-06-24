// API Endpoints
export const ENDPOINTS = {
  API_BASE: process.env.REACT_APP_API_URL || '/api',
  TTS: '/tts',  // Updated from /deepspeak-tts
  SPEECH_COACH: '/speech-coach',
  CHAT_ROLEPLAY: '/chat-roleplay',
  READING_TOPIC: '/reading-topic',
  HEALTH: '/health',
  USAGE: '/api/usage-summary',
  LEARNING_PROGRESS: '/learning-progress',
  CHATS: '/chats',
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    ME: '/auth/me'
  }
}; 