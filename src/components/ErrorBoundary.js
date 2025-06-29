// src/components/ErrorBoundary.js
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);

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

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-container">
            <h2>🚫 Something went wrong</h2>
            <p>
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            <div className="error-actions">
              <button
                onClick={() => window.location.reload()}
                className="btn btn-primary"
              >
                Refresh Page
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                className="btn btn-secondary"
              >
                Try Again
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

              return isDevelopment() && this.state.error && (
                <details className="error-details">
                  <summary>Error Details (Development)</summary>
                  <pre>{this.state.error && this.state.error.toString()}</pre>
                  <pre>{this.state.errorInfo.componentStack}</pre>
                </details>
              );
            })()}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 