// src/components/ErrorBoundary.js
import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: Date.now().toString()
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Update state with error info
    this.setState({
      error,
      errorInfo
    });

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo);
    }
  }

  logErrorToService = (error, errorInfo) => {
    // Log to external error reporting service
    try {
      console.error('Production Error:', {
        error: error.toString(),
        errorInfo,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        url: window.location.href
      });
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
    }
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { fallback: FallbackComponent, level = 'page' } = this.props;
      
      // Use custom fallback if provided
      if (FallbackComponent) {
        return (
          <FallbackComponent
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            onRetry={this.handleRetry}
            onReload={this.handleReload}
          />
        );
      }

      // Default fallback UI based on error level
      return (
        <div className={`error-boundary error-boundary--${level}`}>
          <div className="error-boundary__container">
            <div className="error-boundary__icon">
              {level === 'app' ? '💥' : '⚠️'}
            </div>
            
            <h2 className="error-boundary__title">
              {level === 'app' ? 'Application Error' : 'Something went wrong'}
            </h2>
            
            <p className="error-boundary__message">
              {level === 'app' 
                ? "We're sorry, but the application has encountered an unexpected error."
                : "This section couldn't load properly. You can try again or reload the page."
              }
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-boundary__details">
                <summary>Error Details (Development Only)</summary>
                <pre className="error-boundary__stack">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="error-boundary__actions">
              <button 
                onClick={this.handleRetry}
                className="btn btn-primary error-boundary__retry"
              >
                Try Again
              </button>
              
              {level === 'app' && (
                <button 
                  onClick={this.handleReload}
                  className="btn btn-secondary error-boundary__reload"
                >
                  Reload Page
                </button>
              )}
            </div>

            <p className="error-boundary__help">
              If this problem persists, please{' '}
              <a href="mailto:support@semanami.com" className="error-boundary__link">
                contact support
              </a>
              {this.state.errorId && (
                <span> with error ID: <code>{this.state.errorId}</code></span>
              )}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 