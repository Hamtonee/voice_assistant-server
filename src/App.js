// src/App.js
import React, { Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import SignUp from './components/SignUp';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import ChatWindow from './components/ChatWindow';
import LottieLoader from './components/LottieLoader';
import ErrorBoundary from './components/ErrorBoundary';
import { PageLoader } from './components/LoadingStates';
import { AuthContext } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';
import CookiePolicy from './components/CookiePolicy';

// Import styles
import './App.css';
import './assets/styles/ErrorBoundary.css';
import './assets/styles/LoadingStates.css';

// Enhanced route components with better loading states
function PrivateRoute({ children }) {
  const { loadingUser, isAuthenticated } = React.useContext(AuthContext);
  
  // Show loading while determining auth status
  if (loadingUser) {
    return <PageLoader message="Checking authentication..." />;
  }
  
  // Only redirect if we're sure the user is not authenticated
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { loadingUser, isAuthenticated } = React.useContext(AuthContext);
  
  // Show loading while determining auth status
  if (loadingUser) {
    return <PageLoader message="Loading..." />;
  }
  
  // If authenticated, redirect to chats, otherwise show the public page
  return isAuthenticated ? <Navigate to="/chats" replace /> : children;
}

// Custom fallback for app-level errors
const AppErrorFallback = ({ error, onRetry, onReload }) => (
  <div className="app-error-fallback">
    <div className="app-error-content">
      <h1>🚨 Application Error</h1>
      <p>Something went wrong with the application. We apologize for the inconvenience.</p>
      <div className="app-error-actions">
        <button onClick={onRetry} className="btn-primary">
          Try Again
        </button>
        <button onClick={onReload} className="btn-secondary">
          Reload Page
        </button>
      </div>
      <details className="app-error-details">
        <summary>Technical Details</summary>
        <pre>{error?.toString()}</pre>
      </details>
    </div>
  </div>
);

export default function App() {
  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth <= 768,
    isTablet: window.innerWidth > 768 && window.innerWidth <= 1024,
    isDesktop: window.innerWidth > 1024
  });

  useEffect(() => {
    // Safe development check
    const isDevelopment = () => {
      try {
        return typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development';
      } catch (error) {
        return false;
      }
    };

    if (isDevelopment()) {
      console.log('🚀 App initialized in development mode');
    }

    // Initialize viewport handling
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: window.innerWidth <= 768,
        isTablet: window.innerWidth > 768 && window.innerWidth <= 1024,
        isDesktop: window.innerWidth > 1024
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Handle unhandled promise rejections
  React.useEffect(() => {
    const handleUnhandledRejection = (event) => {
      console.error('Unhandled promise rejection:', event.reason);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, []);

  return (
    <ErrorBoundary level="app" fallback={AppErrorFallback}>
      <ThemeProvider>
        <div className="App">
          <Suspense fallback={<PageLoader message="Loading application..." />}>
            <Routes>
              {/* Public Routes - redirect to /chats if already authenticated */}
              <Route 
                path="/" 
                element={
                  <ErrorBoundary level="page">
                    <PublicRoute>
                      <LandingPage />
                    </PublicRoute>
                  </ErrorBoundary>
                } 
              />
              <Route 
                path="/login" 
                element={
                  <ErrorBoundary level="page">
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  </ErrorBoundary>
                } 
              />
              <Route 
                path="/signup" 
                element={
                  <ErrorBoundary level="page">
                    <PublicRoute>
                      <SignUp />
                    </PublicRoute>
                  </ErrorBoundary>
                } 
              />
              <Route 
                path="/forgot-password" 
                element={
                  <ErrorBoundary level="page">
                    <ForgotPassword />
                  </ErrorBoundary>
                } 
              />
              <Route 
                path="/reset-password" 
                element={
                  <ErrorBoundary level="page">
                    <ResetPassword />
                  </ErrorBoundary>
                } 
              />
              
              {/* Legal Pages - Always accessible */}
              <Route 
                path="/terms" 
                element={
                  <ErrorBoundary level="page">
                    <TermsOfService />
                  </ErrorBoundary>
                } 
              />
              <Route 
                path="/privacy" 
                element={
                  <ErrorBoundary level="page">
                    <PrivacyPolicy />
                  </ErrorBoundary>
                } 
              />
              <Route 
                path="/cookies" 
                element={
                  <ErrorBoundary level="page">
                    <CookiePolicy />
                  </ErrorBoundary>
                } 
              />
              
              {/* Protected Routes */}
              <Route
                path="/chats/*"
                element={
                  <ErrorBoundary level="page">
                    <PrivateRoute>
                      <ChatWindow />
                    </PrivateRoute>
                  </ErrorBoundary>
                }
              />
              
              {/* Fallback route with better error handling */}
              <Route 
                path="*" 
                element={
                  <ErrorBoundary level="page">
                    <div className="not-found-page">
                      <div className="not-found-content">
                        <h1>404 - Page Not Found</h1>
                        <p>The page you're looking for doesn't exist.</p>
                        <Navigate to="/" replace />
                      </div>
                    </div>
                  </ErrorBoundary>
                } 
              />
            </Routes>
          </Suspense>
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
}