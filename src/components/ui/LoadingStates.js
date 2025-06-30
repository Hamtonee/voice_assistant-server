import React from 'react';
import LottieLoader from '../LottieLoader';
import './LoadingStates.css';

/**
 * Spinner component now uses Lottie for a uniform look.
 * Size prop is mapped to dimensions suitable for different contexts.
 */
export const Spinner = ({ 
  size = 'medium', 
  className = '',
  'aria-label': ariaLabel = 'Loading...'
}) => {
  // Map size prop to pixel dimensions
  const sizeMap = {
    small: 24,
    medium: 48,
    large: 96,
  };
  const dimension = sizeMap[size] || 48;

  return (
    <div 
      className={`spinner-wrapper spinner-wrapper--${size} ${className}`}
      role="status"
      aria-label={ariaLabel}
    >
      <LottieLoader
        width={dimension}
        height={dimension}
      />
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
  message,
  size = 'small' 
}) => {
  return (
    <div className="inline-loader">
      <Spinner size={size} />
      {message && <span className="inline-loader__message">{message}</span>}
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
        <div className="loading-button__content">
          <Spinner size="small" />
          {loadingText && <span>{loadingText}</span>}
        </div>
      ) : (
        children
      )}
    </button>
  );
};

const LoadingStates = {
  Spinner,
  Skeleton,
  LoadingOverlay,
  InlineLoader,
  LoadingCard,
  LoadingList,
  LoadingButton
};

export default LoadingStates; 