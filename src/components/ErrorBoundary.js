// src/components/ErrorBoundary.js
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Check if this is a binding error
    const isBindingError = error.message?.includes('bind') || 
                          error.toString().includes('bind') ||
                          errorInfo.componentStack?.includes('bind');

    // Check if this is a lazy loading error
    const isLazyError = errorInfo.componentStack?.includes('Lazy') ||
                       error.message?.includes('loading chunk');

    this.setState({
      error,
      errorInfo,
      errorType: isBindingError ? 'binding' : isLazyError ? 'lazy' : 'unknown'
    });

    // Log to console in development
    console.error('ErrorBoundary caught an error:', {
      error,
      errorInfo,
      type: isBindingError ? 'binding' : isLazyError ? 'lazy' : 'unknown'
    });

    // Log to external service in production
    const isProduction = () => {
      try {
        return typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production';
      } catch (e) {
        return false;
      }
    };

    if (isProduction()) {
      // You can log to an error reporting service here
      console.error('Production error:', error);
    }
  }

  handleRetry = () => {
    const { retryCount } = this.state;
    
    if (retryCount < 3) {
      this.setState(state => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: state.retryCount + 1
      }));
    } else {
      // If we've tried 3 times, force a page reload
      window.location.reload();
    }
  };

  renderErrorMessage() {
    const { error, errorInfo, errorType, retryCount } = this.state;

    let message = "We're sorry, but something unexpected happened.";
    let action = "Please try refreshing the page.";

    if (errorType === 'binding') {
      message = "A component initialization error occurred.";
      action = "Please try again or refresh the page.";
    } else if (errorType === 'lazy') {
      message = "Failed to load a required component.";
      action = "This might be due to a network issue. Please try again.";
    }

    return (
      <div className="error-boundary">
        <div className="error-container">
          <h2>🚫 Something went wrong</h2>
          <p>{message}</p>
          <p>{action}</p>
          <div className="error-actions">
            {retryCount < 3 && (
              <button
                onClick={this.handleRetry}
                className="btn btn-primary"
              >
                Try Again ({3 - retryCount} attempts remaining)
              </button>
            )}
            <button
              onClick={() => window.location.reload()}
              className="btn btn-secondary"
            >
              Refresh Page
            </button>
          </div>
          
          {/* Show error details in development */}
          {(() => {
            const isDevelopment = () => {
              try {
                return typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development';
              } catch (e) {
                return false;
              }
            };

            return isDevelopment() && error && (
              <details className="error-details">
                <summary>Error Details (Development)</summary>
                <pre>{error && error.toString()}</pre>
                <pre>{errorInfo?.componentStack}</pre>
                <div className="error-type">Error Type: {errorType}</div>
              </details>
            );
          })()}
        </div>
      </div>
    );
  }

  render() {
    if (this.state.hasError) {
      return this.renderErrorMessage();
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 