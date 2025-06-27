import React from 'react';
import { FiLoader } from 'react-icons/fi';
import './LoadingStates.css';

/**
 * Spinner component with customizable size and color
 */
export const Spinner = ({ 
  size = 'medium', 
  color = 'primary', 
  className = '',
  'aria-label': ariaLabel = 'Loading...'
}) => {
  return (
    <div 
      className={`spinner spinner--${size} spinner--${color} ${className}`}
      role="status"
      aria-label={ariaLabel}
    >
      <FiLoader className="spinner__icon" />
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );
};

/**
 * Skeleton loader for content placeholders
 */
export const Skeleton = ({ 
  width = '100%', 
  height = '1rem',
  className = '',
  variant = 'text' 
}) => {
  return (
    <div 
      className={`skeleton skeleton--${variant} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
};

/**
 * Loading overlay for full page or container loading
 */
export const LoadingOverlay = ({ 
  message = 'Loading...', 
  transparent = false,
  size = 'large' 
}) => {
  return (
    <div className={`loading-overlay ${transparent ? 'loading-overlay--transparent' : ''}`}>
      <div className="loading-overlay__content">
        <Spinner size={size} />
        <p className="loading-overlay__message">{message}</p>
      </div>
    </div>
  );
};

/**
 * Inline loading state for buttons and small components
 */
export const InlineLoader = ({ 
  message = 'Loading...', 
  size = 'small' 
}) => {
  return (
    <div className="inline-loader">
      <Spinner size={size} />
      <span className="inline-loader__message">{message}</span>
    </div>
  );
};

/**
 * Loading card placeholder
 */
export const LoadingCard = ({ className = '' }) => {
  return (
    <div className={`loading-card ${className}`}>
      <Skeleton variant="rectangular" height="8rem" className="loading-card__image" />
      <div className="loading-card__content">
        <Skeleton variant="text" height="1.5rem" width="80%" />
        <Skeleton variant="text" height="1rem" width="60%" />
        <Skeleton variant="text" height="1rem" width="90%" />
      </div>
    </div>
  );
};

/**
 * Loading list with multiple skeleton items
 */
export const LoadingList = ({ 
  itemCount = 3, 
  itemHeight = '4rem',
  className = '' 
}) => {
  return (
    <div className={`loading-list ${className}`}>
      {Array.from({ length: itemCount }, (_, index) => (
        <div key={index} className="loading-list__item">
          <Skeleton variant="rectangular" width="3rem" height="3rem" />
          <div className="loading-list__item-content">
            <Skeleton variant="text" height="1.25rem" width="70%" />
            <Skeleton variant="text" height="1rem" width="50%" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Button with loading state
 */
export const LoadingButton = ({ 
  loading = false, 
  children, 
  loadingText = 'Loading...', 
  disabled = false,
  className = '',
  ...props 
}) => {
  return (
    <button 
      className={`loading-button ${loading ? 'loading-button--loading' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <Spinner size="small" />
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default {
  Spinner,
  Skeleton,
  LoadingOverlay,
  InlineLoader,
  LoadingCard,
  LoadingList,
  LoadingButton
}; 