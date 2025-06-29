// src/App.js
import React, { useContext, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

// Lazy load components for better performance
const LottieLoader = lazy(() => import('./components/LottieLoader'));
const Login = lazy(() => import('./components/Login'));
const SignUp = lazy(() => import('./components/SignUp'));
const ForgotPassword = lazy(() => import('./components/ForgotPassword'));
const ResetPassword = lazy(() => import('./components/ResetPassword'));
const ChatWindow = lazy(() => import('./components/ChatWindow'));
const TermsOfService = lazy(() => import('./components/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));
const CookiePolicy = lazy(() => import('./components/CookiePolicy'));

/**
 * @component AuthRoutes
 * @description This component handles the application's routing logic. It waits for the
 * authentication status to be ready before rendering any routes.
 * While checking, it displays a full-screen loader.
 */
const AuthRoutes = () => {
  const { isAuthenticated, isAuthReady } = useContext(AuthContext);

  // 🔧 FIX: Display a full-screen loader while the auth state is being confirmed.
  // This is the definitive fix to prevent any rendering race conditions.
  if (!isAuthReady) {
    return <LottieLoader />;
  }

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/chats" replace />} />
      <Route path="/signup" element={!isAuthenticated ? <SignUp /> : <Navigate to="/chats" replace />} />
      <Route path="/forgot-password" element={!isAuthenticated ? <ForgotPassword /> : <Navigate to="/chats" replace />} />
      <Route path="/reset-password/:token" element={!isAuthenticated ? <ResetPassword /> : <Navigate to="/chats" replace />} />
      <Route
        path="/chats/*"
        element={
          isAuthenticated ? (
            <ChatWindow />
          ) : (
            <Navigate to="/login" state={{ from: '/chats' }} replace />
          )
        }
      />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/cookies" element={<CookiePolicy />} />
      {/* Default route */}
      <Route path="*" element={<Navigate to={isAuthenticated ? "/chats" : "/login"} replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <AuthProvider>
          <Suspense fallback={<LottieLoader />}>
            <AuthRoutes />
          </Suspense>
        </AuthProvider>
      </ErrorBoundary>
    </Router>
  );
}

export default App;