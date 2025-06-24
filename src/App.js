// src/App.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import SignUp from './components/SignUp';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import ChatWindow from './components/ChatWindow';
import LottieLoader from './components/LottieLoader';
import { AuthContext } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';
import CookiePolicy from './components/CookiePolicy';
import './App.css';

function PrivateRoute({ children }) {
  const { loadingUser, isAuthenticated } = React.useContext(AuthContext);
  
  // Show loading while determining auth status
  if (loadingUser) {
    return <LottieLoader />;
  }
  
  // Only redirect if we're sure the user is not authenticated
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { loadingUser, isAuthenticated } = React.useContext(AuthContext);
  
  // Show loading while determining auth status
  if (loadingUser) {
    return <LottieLoader />;
  }
  
  // If authenticated, redirect to chats, otherwise show the public page
  return isAuthenticated ? <Navigate to="/chats" replace /> : children;
}

// Add error boundary to catch any errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center', 
          fontFamily: 'Arial, sans-serif',
          maxWidth: '600px',
          margin: '50px auto'
        }}>
          <h1>Something went wrong</h1>
          <p>We're sorry, but something unexpected happened.</p>
          <details style={{ marginTop: '20px', textAlign: 'left' }}>
            <summary>Error details</summary>
            <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
              {this.state.error?.toString()}
            </pre>
          </details>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  // Add debugging
  React.useEffect(() => {
    console.log('🚀 App component mounted');
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <div className="App">
          <Routes>
          {/* Public Routes - redirect to /chats if already authenticated */}
          <Route 
            path="/" 
            element={
              <PublicRoute>
                <LandingPage />
              </PublicRoute>
            } 
          />
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/signup" 
            element={
              <PublicRoute>
                <SignUp />
              </PublicRoute>
            } 
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Legal Pages - Always accessible */}
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/cookies" element={<CookiePolicy />} />
          
          {/* Protected Routes */}
          <Route
            path="/chats/*"
            element={
              <PrivateRoute>
                <ChatWindow />
              </PrivateRoute>
            }
          />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
}