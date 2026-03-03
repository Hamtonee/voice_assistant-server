/**
 * API Response Normalizer
 *
 * Converts database field names (snake_case) to frontend field names (camelCase).
 */

export function normalizeChat(chat) {
  if (!chat) return null;

  return {
    ...chat,
    scenarioKey: chat.scenario_key,
    ownerId: chat.owner_id,
    createdAt: chat.created_at,
    updatedAt: chat.updated_at,
    isActive: chat.is_active,
    scenario_key: undefined,
    owner_id: undefined,
    created_at: undefined,
    updated_at: undefined,
    is_active: undefined,
    messages: chat.messages ? chat.messages.map(normalizeMessage) : undefined
  };
}

export function normalizeMessage(message) {
  if (!message) return null;

  return {
    ...message,
    chatId: message.chat_id,
    contentLength: message.content_length,
    messageMetadata: message.message_metadata,
    chat_id: undefined,
    content_length: undefined,
    message_metadata: undefined
  };
}

export function normalizeChats(chats) {
  if (!Array.isArray(chats)) return [];
  return chats.map(normalizeChat);
}

export function normalizeMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages.map(normalizeMessage);
}

export function normalizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  const normalized = { ...obj };
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

  Object.entries(fieldMappings).forEach(([snakeCase, camelCase]) => {
    if (Object.prototype.hasOwnProperty.call(normalized, snakeCase)) {
      normalized[camelCase] = normalized[snakeCase];
      delete normalized[snakeCase];
    }
  });

  return normalized;
}

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
