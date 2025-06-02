import React, { useContext, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import LottieLoader from './LottieLoader'; // ✅ animated loader

/**
 * A wrapper for protected routes.
 * If user is not authenticated, redirect to login.
 * While loading, show animation.
 */
export default function PrivateRoute() {
  const { isAuthenticated, loadingUser, user } = useContext(AuthContext);

  // 🔍 Debug auth state (optional, remove in production)
  useEffect(() => {
    console.log('[PrivateRoute] Auth state →', {
      loadingUser,
      isAuthenticated,
      user,
    });
  }, [loadingUser, isAuthenticated, user]);

  // ⏳ While checking token or user state
  if (loadingUser) {
    return <LottieLoader />;
  }

  // ✅ If authenticated, continue to child route
  if (isAuthenticated) {
    return <Outlet />;
  }

  // 🚪 Not authenticated — redirect to login
  return <Navigate to="/login" replace />;
}
