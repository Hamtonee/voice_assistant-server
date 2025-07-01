import React from 'react';
import LottieLoader from './LottieLoader';
import '../assets/styles/LoadingStates.css';

// Full page loading with branded experience
export const PageLoader = ({ message = "Loading...", subtitle = null }) => (
  <div className="page-loader">
    <div className="page-loader__content">
      <LottieLoader />
      <h2 className="page-loader__title">{message}</h2>
      {subtitle && <p className="page-loader__subtitle">{subtitle}</p>}
    </div>
  </div>
);

// Skeleton loader for content areas
export const SkeletonLoader = ({ lines = 3, showAvatar = false, className = "" }) => (
  <div className={`skeleton-loader ${className}`}>
    {showAvatar && (
      <div className="skeleton-loader__avatar">
        <div className="skeleton-loader__circle"></div>
      </div>
    )}
    <div className="skeleton-loader__content">
      {Array.from({ length: lines }, (_, i) => (
        <div 
          key={i} 
          className={`skeleton-loader__line skeleton-loader__line--${i === lines - 1 ? 'short' : 'full'}`}
        ></div>
      ))}
    </div>
  </div>
);

// Card skeleton for scenario picker and similar grid layouts
export const CardSkeleton = ({ count = 6 }) => (
  <div className="card-skeleton-grid">
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="card-skeleton">
        <div className="card-skeleton__image"></div>
        <div className="card-skeleton__content">
          <div className="card-skeleton__title"></div>
          <div className="card-skeleton__subtitle"></div>
        </div>
      </div>
    ))}
  </div>
);

// Spinner for inline loading states
export const InlineSpinner = ({ size = "md", className = "" }) => (
  <div className={`inline-spinner inline-spinner--${size} ${className}`}>
    <div className="inline-spinner__circle"></div>
  </div>
);

// Button loading state
export const ButtonLoader = ({ children, loading = false, disabled = false, ...props }) => (
  <button 
    {...props} 
    disabled={disabled || loading}
    className={`btn-loader ${props.className || ''} ${loading ? 'btn-loader--loading' : ''}`}
  >
    {loading ? (
      <>
        <InlineSpinner size="sm" />
        <span>Loading...</span>
      </>
    ) : (
      children
    )}
  </button>
);

// Progress bar for file uploads or multi-step processes
export const ProgressLoader = ({ 
  progress = 0, 
  message = "Processing...", 
  showPercentage = true,
  className = ""
}) => (
  <div className={`progress-loader ${className}`}>
    <div className="progress-loader__content">
      <p className="progress-loader__message">{message}</p>
      <div className="progress-loader__bar">
        <div 
          className="progress-loader__fill" 
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        ></div>
      </div>
      {showPercentage && (
        <span className="progress-loader__percentage">
          {Math.round(progress)}%
        </span>
      )}
    </div>
  </div>
);

// Chat loading with typing indicator
export const ChatLoader = ({ message = "AI is typing...", dots = 3 }) => (
  <div className="chat-loader">
    <div className="chat-loader__avatar">
      <div className="chat-loader__bot-icon">🤖</div>
    </div>
    <div className="chat-loader__content">
      <p className="chat-loader__message">{message}</p>
      <div className="chat-loader__dots">
        {Array.from({ length: dots }, (_, i) => (
          <div 
            key={i} 
            className="chat-loader__dot"
            style={{ animationDelay: `${i * 0.2}s` }}
          ></div>
        ))}
      </div>
    </div>
  </div>
);

// Data loading with retry option
export const DataLoader = ({ 
  loading = true, 
  error = null, 
  retry = null, 
  children,
  emptyMessage = "No data available"
}) => {
  if (loading) {
    return <SkeletonLoader lines={4} />;
  }
  
  if (error) {
    return (
      <div className="data-loader-error">
        <div className="data-loader-error__icon">⚠️</div>
        <p className="data-loader-error__message">{error}</p>
        {retry && (
          <button onClick={retry} className="data-loader-error__retry">
            Try Again
          </button>
        )}
      </div>
    );
  }
  
  if (!children || (Array.isArray(children) && children.length === 0)) {
    return (
      <div className="data-loader-empty">
        <div className="data-loader-empty__icon">📭</div>
        <p className="data-loader-empty__message">{emptyMessage}</p>
      </div>
    );
  }
  
  return children;
};

// Search loading state
export const SearchLoader = ({ searching = false, query = "" }) => (
  <div className={`search-loader ${searching ? 'search-loader--active' : ''}`}>
    <InlineSpinner size="sm" />
    <span>Searching for &quot;{query}&quot;...</span>
  </div>
);

// Create named object before export
const LoadingStates = {
  PageLoader,
  SkeletonLoader,
  CardSkeleton,
  InlineSpinner,
  ButtonLoader,
  ProgressLoader,
  ChatLoader,
  DataLoader,
  SearchLoader
};

export default LoadingStates; 