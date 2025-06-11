import React, { useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/styles/Login.css';
import { AuthContext } from '../contexts/AuthContext';
import logo from '../assets/images/logo.png';

const Login = () => {
  const navigate = useNavigate();
  const { login, forceLogin, clearSessionConflict } = useContext(AuthContext);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSessionConflict, setShowSessionConflict] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const passwordInputRef = useRef(null);
  const emailInputRef = useRef(null);

  // FIXED: Enhanced error message handler with better network error detection
  const getErrorMessage = (error) => {
    console.log('🔍 Processing error:', error);
    
    const errorMsg = error.response?.data?.error || error.response?.data?.message || error.response?.data?.detail || error.message || '';
    const statusCode = error.response?.status;

    // Network/Connection errors (most important for your issue)
    if (!error.response || error.code === 'NETWORK_ERROR' || error.code === 'ECONNREFUSED') {
      return 'Connection problem. Please check your internet connection and try again.';
    }

    if (error.name === 'AxiosError' && !statusCode) {
      return 'Connection problem. Please check your internet connection and try again.';
    }

    // Timeout errors
    if (error.code === 'ECONNABORTED' || errorMsg.toLowerCase().includes('timeout')) {
      return 'Request timed out. Please try again.';
    }

    // Handle specific HTTP status codes
    if (statusCode === 401) {
      if (errorMsg.toLowerCase().includes('invalid credentials') || 
          errorMsg.toLowerCase().includes('incorrect email or password')) {
        return 'The email or password you entered is incorrect. Please check and try again.';
      }
      if (errorMsg.toLowerCase().includes('user not found')) {
        return 'No account found with this email address. Please check your email or sign up.';
      }
      return 'Login failed. Please check your credentials and try again.';
    }

    if (statusCode === 429) {
      return 'Too many login attempts. Please wait a few minutes before trying again.';
    }

    if (statusCode >= 500) {
      return 'Server error. Please try again in a moment.';
    }

    if (statusCode === 0) {
      return 'Connection problem. Please check your internet connection and try again.';
    }

    // Default fallback
    return errorMsg || 'Login failed. Please try again.';
  };

  // Validate individual fields
  const validateField = (name, value) => {
    let fieldError = '';
    
    if (name === 'email') {
      if (!value) {
        fieldError = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(value)) {
        fieldError = 'Please enter a valid email address';
      }
    }
    
    if (name === 'password') {
      if (!value) {
        fieldError = 'Password is required';
      } else if (value.length < 1) {
        fieldError = 'Password cannot be empty';
      }
    }
    
    setFieldErrors(prev => ({ ...prev, [name]: fieldError }));
    return fieldError === '';
  };

  const handleChange = e => {
    const { name, value } = e.target;
    
    // Clear general error when user starts typing
    if (error) {
      setError('');
    }
    
    // Clear field-specific error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    setForm(f => ({ ...f, [name]: value }));
    
    // Real-time validation for better UX
    if (value.length > 0) {
      validateField(name, value);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setFieldErrors({ email: '', password: '' });
    
    // Client-side validation
    const emailValid = validateField('email', form.email);
    const passwordValid = validateField('password', form.password);
    
    if (!emailValid || !passwordValid) {
      // Focus the first invalid field
      setTimeout(() => {
        if (!emailValid && emailInputRef.current) {
          emailInputRef.current.focus();
        } else if (!passwordValid && passwordInputRef.current) {
          passwordInputRef.current.focus();
        }
      }, 100);
      return;
    }

    setLoading(true);

    try {
      console.log('🚀 Attempting login from Login component');
      
      // Attempt login
      await login({ email: form.email.trim(), password: form.password });
      
      console.log('✅ Login successful from Login component perspective');
      // If we get here, login was successful
      // Navigation should be handled by AuthContext
      
    } catch (err) {
      console.error('❌ Login failed in Login component:', err);
      
      // Login failed - handle error and stay on page
      setLoading(false);
      
      // Check for session conflict
      if (err.response?.status === 401 && err.response?.data?.code === 'SESSION_CONFLICT') {
        setShowSessionConflict(true);
        return;
      }

      // Show user-friendly error message
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      
      // Smart focus management based on error type
      setTimeout(() => {
        if (errorMessage.toLowerCase().includes('email') || 
            errorMessage.toLowerCase().includes('account')) {
          if (emailInputRef.current) {
            emailInputRef.current.focus();
            emailInputRef.current.select();
          }
        } else if (!errorMessage.toLowerCase().includes('connection')) {
          // Don't focus password field for connection errors
          if (passwordInputRef.current) {
            passwordInputRef.current.focus();
            passwordInputRef.current.select();
          }
        }
      }, 100);
      
      // Explicitly return to prevent any further execution
      return;
    }
    
    // This should only be reached if login was successful
    setLoading(false);
  };

  const handleForceLogin = async () => {
    setLoading(true);
    setShowSessionConflict(false);
    setError('');
    
    try {
      await forceLogin({ email: form.email.trim(), password: form.password });
      clearSessionConflict();
      // Navigation handled by AuthContext
    } catch (err) {
      setLoading(false);
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
    }
  };

  const handleCancelConflict = () => {
    setShowSessionConflict(false);
    clearSessionConflict();
  };

  // Session Conflict Dialog
  if (showSessionConflict) {
    return (
      <div className="login-container">
        <div className="login-branding">
          <div className="logo-container">
            <img src={logo} alt="SemaNami Logo" className="logo-image" />
          </div>
          <h1 className="login-web-title">SemaNami</h1>
        </div>
        
        <div className="login-form-wrapper">
          <h2 className="login-title">Session Active Elsewhere</h2>
          <div className="session-conflict-content">
            <div className="session-conflict-icon">🔒</div>
            <p className="session-conflict-message">
              You're already logged in on another device or browser. 
              SemaNami allows only one active session at a time.
            </p>
            <p className="session-conflict-sub">
              Would you like to log in here and end your other session?
            </p>
            
            <div className="session-conflict-actions">
              <button
                onClick={handleForceLogin}
                className="login-button session-force-btn"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Yes, Log In Here'}
              </button>
              <button
                onClick={handleCancelConflict}
                className="login-button session-cancel-btn"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
            
            {error && (
              <div className="login-error session-error">
                <span>⚠️ {error}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-branding">
        <div className="logo-container">
          <img src={logo} alt="SemaNami Logo" className="logo-image" />
        </div>
        <h1 className="login-web-title">SemaNami</h1>
      </div>
      
      <div className="login-form-wrapper">
        <h2 className="login-title">Welcome Back</h2>
        
        {error && (
          <div className="login-error">
            <span>⚠️ {error}</span>
            {error.toLowerCase().includes('credentials') || error.toLowerCase().includes('incorrect') ? (
              <small className="error-help-text">
                Make sure your email and password are entered correctly
              </small>
            ) : error.toLowerCase().includes('email') || error.toLowerCase().includes('account') ? (
              <small className="error-help-text">
                Check your email address or <button 
                  type="button" 
                  className="inline-link" 
                  onClick={() => navigate('/signup')}
                >
                  create a new account
                </button>
              </small>
            ) : error.toLowerCase().includes('connection') ? (
              <small className="error-help-text">
                Please check your internet connection and try again
              </small>
            ) : null}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <input
              ref={emailInputRef}
              type="email"
              name="email"
              placeholder="Email Address"
              value={form.email}
              onChange={handleChange}
              className={`login-input ${fieldErrors.email ? 'input-error' : ''}`}
              required
              disabled={loading}
              autoComplete="email"
            />
            {fieldErrors.email && (
              <span className="field-error">{fieldErrors.email}</span>
            )}
          </div>

          <div className="input-group">
            <div className="login-password-wrapper">
              <input
                ref={passwordInputRef}
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                className={`login-input ${fieldErrors.password ? 'input-error' : ''}`}
                required
                disabled={loading}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-show-password-btn"
                onClick={() => setShowPassword(v => !v)}
                disabled={loading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {fieldErrors.password && (
              <span className="field-error">{fieldErrors.password}</span>
            )}
          </div>

          <button
            type="submit"
            className={`login-button ${loading ? 'login-loading' : ''}`}
            disabled={loading || fieldErrors.email || fieldErrors.password}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        
        <p className="login-footer-text">
          Don&apos;t have an account?{' '}
          <button
            onClick={() => navigate('/signup')}
            className="login-signup-link"
            disabled={loading}
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;