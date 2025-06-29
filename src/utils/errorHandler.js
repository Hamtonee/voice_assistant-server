/**
 * Centralized Error Handling Utility
 * Provides consistent error handling patterns across the application
 */

// Error types for consistent categorization
export const ERROR_TYPES = {
  NETWORK: 'NETWORK_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  AUTHENTICATION: 'AUTH_ERROR',
  AUTHORIZATION: 'PERMISSION_ERROR',
  SERVER: 'SERVER_ERROR',
  CLIENT: 'CLIENT_ERROR',
  TTS: 'TTS_ERROR',
  SPEECH_RECOGNITION: 'SPEECH_RECOGNITION_ERROR'
};

// User-friendly error messages
const ERROR_MESSAGES = {
  [ERROR_TYPES.NETWORK]: 'Unable to connect. Please check your internet connection and try again.',
  [ERROR_TYPES.VALIDATION]: 'Please check your input and try again.',
  [ERROR_TYPES.AUTHENTICATION]: 'Authentication failed. Please log in again.',
  [ERROR_TYPES.AUTHORIZATION]: 'You don\'t have permission to perform this action.',
  [ERROR_TYPES.SERVER]: 'Server error. Please try again in a moment.',
  [ERROR_TYPES.CLIENT]: 'Something went wrong. Please refresh the page and try again.',
  [ERROR_TYPES.TTS]: 'Text-to-speech service is temporarily unavailable.',
  [ERROR_TYPES.SPEECH_RECOGNITION]: 'Speech recognition is not available in your browser.'
};

/**
 * Logs error details to console for developers while keeping user messages clean
 */
export const logError = (error, context = '', additionalData = {}) => {
  const timestamp = new Date().toISOString();
  const errorDetails = {
    timestamp,
    context,
    message: error.message,
    stack: error.stack,
    type: error.type || 'UNKNOWN',
    ...additionalData
  };

  // Log full details to console for developers
  console.group(`🔴 Error: ${context}`);
  console.error('Error Details:', errorDetails);
  if (error.response) {
    console.error('Response Data:', error.response.data);
    console.error('Response Status:', error.response.status);
  }
  console.groupEnd();

  // Send to error tracking service in production
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production' && window.gtag) {
    window.gtag('event', 'exception', {
      description: `${context}: ${error.message}`,
      fatal: false
    });
  }
};

/**
 * Handles API errors with consistent user messaging
 */
export const handleApiError = (error, context = 'API Request') => {
  logError(error, context);

  // Determine error type and user message
  let errorType = ERROR_TYPES.SERVER;
  let userMessage = ERROR_MESSAGES[ERROR_TYPES.SERVER];

  if (!error.response) {
    // Network or connection error
    errorType = ERROR_TYPES.NETWORK;
    userMessage = ERROR_MESSAGES[ERROR_TYPES.NETWORK];
  } else {
    const status = error.response.status;
    const responseData = error.response.data;

    switch (status) {
      case 401:
        errorType = ERROR_TYPES.AUTHENTICATION;
        userMessage = ERROR_MESSAGES[ERROR_TYPES.AUTHENTICATION];
        break;
      case 403:
        errorType = ERROR_TYPES.AUTHORIZATION;
        userMessage = ERROR_MESSAGES[ERROR_TYPES.AUTHORIZATION];
        break;
      case 422:
        errorType = ERROR_TYPES.VALIDATION;
        userMessage = responseData?.message || ERROR_MESSAGES[ERROR_TYPES.VALIDATION];
        break;
      case 429:
        userMessage = 'Too many requests. Please wait a moment and try again.';
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        errorType = ERROR_TYPES.SERVER;
        userMessage = ERROR_MESSAGES[ERROR_TYPES.SERVER];
        break;
      default:
        userMessage = responseData?.message || ERROR_MESSAGES[ERROR_TYPES.CLIENT];
    }
  }

  return {
    type: errorType,
    message: userMessage,
    originalError: error
  };
};

/**
 * Handles speech-related errors
 */
export const handleSpeechError = (error, context = 'Speech Service') => {
  logError(error, context);

  let userMessage = 'Speech service error occurred.';

  if (error.type === 'TTS_ERROR') {
    userMessage = ERROR_MESSAGES[ERROR_TYPES.TTS];
  } else if (error.type === 'SPEECH_RECOGNITION_ERROR') {
    userMessage = ERROR_MESSAGES[ERROR_TYPES.SPEECH_RECOGNITION];
  }

  return {
    type: error.type || ERROR_TYPES.CLIENT,
    message: userMessage,
    originalError: error
  };
};

/**
 * Creates a standardized error object
 */
export const createError = (type, message, originalError = null) => {
  return {
    type,
    message,
    originalError,
    timestamp: new Date().toISOString()
  };
};

/**
 * Error boundary helper for React components
 */
export const createErrorBoundaryHandler = (componentName) => {
  return (error, errorInfo) => {
    logError(error, `Error Boundary: ${componentName}`, { errorInfo });
    
    // Return user-friendly error state
    return {
      hasError: true,
      error: {
        type: ERROR_TYPES.CLIENT,
        message: 'Something went wrong. Please refresh the page and try again.',
        originalError: error
      }
    };
  };
}; 