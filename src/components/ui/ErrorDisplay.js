import React from 'react';
import { FiAlertTriangle, FiRefreshCw, FiWifi, FiLock } from 'react-icons/fi';
import './ErrorDisplay.css';

const ErrorDisplay = ({ 
  error, 
  onRetry, 
  onDismiss, 
  size = 'medium',
  variant = 'default' 
}) => {
  if (!error) return null;

  const getErrorIcon = () => {
    switch (error.type) {
      case 'NETWORK_ERROR':
        return <FiWifi className="error-icon" />;
      case 'AUTH_ERROR':
      case 'PERMISSION_ERROR':
        return <FiLock className="error-icon" />;
      default:
        return <FiAlertTriangle className="error-icon" />;
    }
  };

  const getErrorTitle = () => {
    switch (error.type) {
      case 'NETWORK_ERROR':
        return 'Connection Problem';
      case 'AUTH_ERROR':
        return 'Authentication Required';
      case 'PERMISSION_ERROR':
        return 'Access Denied';
      case 'SERVER_ERROR':
        return 'Server Error';
      default:
        return 'Something went wrong';
    }
  };

  return (
    <div className={`error-display error-display--${size} error-display--${variant}`}>
      <div className="error-display__content">
        {getErrorIcon()}
        <div className="error-display__text">
          <h3 className="error-display__title">{getErrorTitle()}</h3>
          <p className="error-display__message">{error.message}</p>
        </div>
      </div>
      
      {(onRetry || onDismiss) && (
        <div className="error-display__actions">
          {onRetry && (
            <button 
              className="error-display__button error-display__button--primary"
              onClick={onRetry}
            >
              <FiRefreshCw />
              Try Again
            </button>
          )}
          {onDismiss && (
            <button 
              className="error-display__button error-display__button--secondary"
              onClick={onDismiss}
            >
              Dismiss
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ErrorDisplay; 