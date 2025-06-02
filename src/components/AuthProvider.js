import React from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useProvideAuth } from '../hooks/useAuth';
import LottieLoader from './LottieLoader';

export default function AuthProvider({ children }) {
  const auth = useProvideAuth();

  if (auth.loadingUser) {
    return <LottieLoader />;
  }

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}
