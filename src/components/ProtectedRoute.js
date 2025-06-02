// src/components/ProtectedRoute.jsx
import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import LottieLoader from './LottieLoader';

export default function ProtectedRoute() {
  const { isAuthenticated, loadingUser } = useContext(AuthContext);

  // While we’re checking auth status, show loader
  if (loadingUser) {
    return <LottieLoader />;
  }

  // If logged in, render nested routes; otherwise redirect to your login page
  return isAuthenticated
    ? <Outlet />
    : <Navigate to="/login" replace />;
}
