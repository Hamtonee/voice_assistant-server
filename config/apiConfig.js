// server/config/apiConfig.js
import dotenv from 'dotenv';

dotenv.config();

// Base API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.API_BASE_URL || 'https://api.semanami-ai.com/api',
  VERSION: process.env.API_VERSION || 'v1',
  CUSTOM_DOMAIN: process.env.CUSTOM_DOMAIN || 'api.semanami-ai.com',
  NODE_ENV: process.env.NODE_ENV || 'development',
  VERSION_NUMBER: process.env.VERSION || '12.0.0'
};

// Authentication Endpoints
export const AUTH_ENDPOINTS = {
  REGISTER: process.env.AUTH_REGISTER_ENDPOINT || '/auth/register',
  LOGIN: process.env.AUTH_LOGIN_ENDPOINT || '/auth/login',
  REFRESH: process.env.AUTH_REFRESH_ENDPOINT || '/auth/refresh',
  ME: process.env.AUTH_ME_ENDPOINT || '/auth/me',
  LOGOUT: process.env.AUTH_LOGOUT_ENDPOINT || '/auth/logout'
};

// Chat Management Endpoints
export const CHAT_ENDPOINTS = {
  LIST: process.env.CHATS_ENDPOINT || '/chats',
  DETAIL: process.env.CHAT_DETAIL_ENDPOINT || '/chats/{chat_id}',
  MESSAGES: process.env.CHAT_MESSAGES_ENDPOINT || '/chats/{chat_id}/messages'
};

// Health Check Endpoint
export const HEALTH_ENDPOINTS = {
  CHECK: process.env.HEALTH_CHECK_ENDPOINT || '/health'
};

// CORS Configuration
export const CORS_CONFIG = {
  ORIGINS: process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
    : ['https://semanami-ai.com', 'https://www.semanami-ai.com', 'http://localhost:3000'],
  FRONTEND_URLS: process.env.FRONTEND_URLS
    ? process.env.FRONTEND_URLS.split(',').map(url => url.trim())
    : ['https://semanami-ai.com', 'https://www.semanami-ai.com']
};

// Database Configuration
export const DB_CONFIG = {
  URL: process.env.DATABASE_URL,
  CONNECTED: !!process.env.DATABASE_URL
};

// JWT Configuration
export const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET,
  REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
};

// Utility function to build full URLs
export const buildUrl = (baseUrl, endpoint, params = {}) => {
  let url = `${baseUrl}${endpoint}`;
  
  // Replace placeholders with actual values
  Object.keys(params).forEach(key => {
    url = url.replace(`{${key}}`, params[key]);
  });
  
  return url;
};

// Export all configurations
export default {
  API_CONFIG,
  AUTH_ENDPOINTS,
  CHAT_ENDPOINTS,
  HEALTH_ENDPOINTS,
  CORS_CONFIG,
  DB_CONFIG,
  JWT_CONFIG,
  buildUrl
}; 