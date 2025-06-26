import React from 'react';
import { AuthContext } from '../contexts/AuthContext';
import LottieLoader from './LottieLoader';
import '../assets/styles/AuthProvider.css';

export default function AuthProvider({ children }) {
  const [initializing, setInitializing] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    // Simulate initialization delay
    const timer = setTimeout(() => {
      setInitializing(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (error) {
    return (
      <div className="auth-error">
        <h2>Authentication Error</h2>
        <p>{error.message}</p>
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  if (initializing) {
    return <LottieLoader />;
  }

  return (
    <AuthContext.Provider value={{}}>
      {children}
    </AuthContext.Provider>
  );
}
