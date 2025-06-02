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

export default function App() {
  return (
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
  );
}