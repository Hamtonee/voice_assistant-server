// server/utils/apiResponseNormalizer.js

/**
 * API Response Normalizer
 * 
 * Converts database field names (snake_case) to frontend field names (camelCase)
 * This ensures consistency between frontend expectations and API responses.
 * 
 * Database/Backend: scenario_key, owner_id, created_at
 * API Response:    scenarioKey, ownerId, createdAt
 * Frontend:        scenarioKey, ownerId, createdAt
 */

/**
 * Normalize a single chat object
 * @param {Object} chat - Raw chat object from database
 * @returns {Object} - Normalized chat object for frontend
 */
export function normalizeChat(chat) {
  if (!chat) return null;
  
  return {
    ...chat,
    // Convert snake_case to camelCase
    scenarioKey: chat.scenario_key,
    ownerId: chat.owner_id,
    createdAt: chat.created_at,
    updatedAt: chat.updated_at,
    isActive: chat.is_active,
    
    // Remove snake_case versions to avoid confusion
    scenario_key: undefined,
    owner_id: undefined,
    created_at: undefined,
    updated_at: undefined,
    is_active: undefined,
    
    // Normalize messages if they exist
    messages: chat.messages ? chat.messages.map(normalizeMessage) : undefined
  };
}

/**
 * Normalize a single message object
 * @param {Object} message - Raw message object from database
 * @returns {Object} - Normalized message object for frontend
 */
export function normalizeMessage(message) {
  if (!message) return null;
  
  return {
    ...message,
    // Convert snake_case to camelCase
    chatId: message.chat_id,
    contentLength: message.content_length,
    messageMetadata: message.message_metadata,
    
    // Remove snake_case versions to avoid confusion
    chat_id: undefined,
    content_length: undefined,
    message_metadata: undefined
  };
}

/**
 * Normalize an array of chat objects
 * @param {Array} chats - Array of raw chat objects from database
 * @returns {Array} - Array of normalized chat objects for frontend
 */
export function normalizeChats(chats) {
  if (!Array.isArray(chats)) return [];
  return chats.map(normalizeChat);
}

/**
 * Normalize an array of message objects
 * @param {Array} messages - Array of raw message objects from database
 * @returns {Array} - Array of normalized message objects for frontend
 */
export function normalizeMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages.map(normalizeMessage);
}

/**
 * Normalize any object with common database field patterns
 * @param {Object} obj - Raw object from database
 * @returns {Object} - Normalized object for frontend
 */
export function normalizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const normalized = { ...obj };
  
  // Common field mappings
  const fieldMappings = {
    scenario_key: 'scenarioKey',
    owner_id: 'ownerId',
    user_id: 'userId',
    chat_id: 'chatId',
    session_id: 'sessionId',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
    last_login: 'lastLogin',
    last_active: 'lastActive',
    is_active: 'isActive',
    is_verified: 'isVerified',
    hashed_password: 'hashedPassword',
    full_name: 'fullName',
    content_length: 'contentLength',
    message_metadata: 'messageMetadata',
    event_type: 'eventType',
    event_data: 'eventData',
    ip_address: 'ipAddress',
    user_agent: 'userAgent',
    session_type: 'sessionType',
    started_at: 'startedAt',
    ended_at: 'endedAt',
    duration_minutes: 'durationMinutes',
    vocabulary_introduced: 'vocabularyIntroduced',
    proverbs_shared: 'proverbsShared',
    topics_discussed: 'topicsDiscussed',
    areas_for_improvement: 'areasForImprovement',
    session_data: 'sessionData',
    metric_name: 'metricName',
    metric_value: 'metricValue',
    metric_metadata: 'metricMetadata',
    request_count: 'requestCount',
    success_count: 'successCount',
    service_type: 'serviceType',
    client_id: 'clientId'
  };
  
  // Apply mappings
  Object.entries(fieldMappings).forEach(([snakeCase, camelCase]) => {
    if (normalized.hasOwnProperty(snakeCase)) {
      normalized[camelCase] = normalized[snakeCase];
      delete normalized[snakeCase];
    }
  });
  
  return normalized;
}

/**
 * Normalize API response wrapper
 * @param {Object} response - Raw response object
 * @param {string} type - Type of normalization ('chat', 'message', 'user', etc.)
 * @returns {Object} - Normalized response object
 */
export function normalizeResponse(response, type = 'object') {
  if (!response) return response;
  
  switch (type) {
    case 'chat':
      return normalizeChat(response);
    case 'chats':
      return normalizeChats(response);
    case 'message':
      return normalizeMessage(response);
    case 'messages':
      return normalizeMessages(response);
    case 'object':
    default:
      return normalizeObject(response);
  }
}

export default {
  normalizeChat,
  normalizeMessage,
  normalizeChats,
  normalizeMessages,
  normalizeObject,
  normalizeResponse
}; 