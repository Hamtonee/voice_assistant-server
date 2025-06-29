// client/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import App from './App';
import './index.css';

// Import the main CSS file AFTER index.css
import './App.css';

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Global error handler for uncaught errors
window.addEventListener('error', event => {
  console.error('Global error:', event.error);
});

const rootEl = document.getElementById('root');

if (!rootEl) {
  throw new Error('Root element not found. Make sure you have a div with id="root" in your HTML file.');
}

const root = ReactDOM.createRoot(rootEl);

// Add error boundary wrapper for the entire app
const AppWithErrorBoundary = () => {
  return (
    <React.StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
};

root.render(<AppWithErrorBoundary />);

// Enable hot reloading in development
if (process.env.NODE_ENV === 'development' && module.hot) {
  module.hot.accept();
}
