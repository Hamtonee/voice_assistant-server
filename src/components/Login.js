import React, { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/styles/Login.css';
import { AuthContext } from '../contexts/AuthContext';
import logo from '../assets/images/logo.png';

const Login = () => {
  const navigate = useNavigate();
  const { login, forceLogin, clearSessionConflict, isAuthenticated, isAuthReady, loading } = useContext(AuthContext);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSessionConflict, setShowSessionConflict] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const passwordInputRef = useRef(null);
  const emailInputRef = useRef(null);

  useEffect(() => {
    if (isAuthReady && isAuthenticated) {
      console.log('✅ Auth is ready and user is authenticated. Redirecting to chats...');
      navigate('/chats', { replace: true });
    }
  }, [isAuthenticated, isAuthReady, navigate]);

  const getErrorMessage = (error) => {
    console.log('🔍 Processing error:', error);
    
    const errorMsg = error.response?.data?.error || error.response?.data?.message || error.response?.data?.detail || error.message || '';
    const statusCode = error.response?.status;

    if (!error.response || error.code === 'NETWORK_ERROR' || error.code === 'ECONNREFUSED') {
      return 'Connection problem. Please check your internet connection and try again.';
    }

    if (error.name === 'AxiosError' && !statusCode) {
      return 'Connection problem. Please check your internet connection and try again.';
    }

    if (error.code === 'ECONNABORTED' || errorMsg.toLowerCase().includes('timeout')) {
      return 'Request timed out. Please try again.';
    }

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

    if (statusCode === 422) {
      if (Array.isArray(error.response?.data?.detail)) {
        return 'Please correct the validation errors and try again.';
      }
      return 'Invalid input format. Please check your email and password.';
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

    return errorMsg || 'Login failed. Please try again.';
  };

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
    
    if (error) {
      setError('');
    }
    
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    setForm(f => ({ ...f, [name]: value }));
    
    if (value.length > 0) {
      validateField(name, value);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setFieldErrors({ email: '', password: '' });
    
    const emailValid = validateField('email', form.email);
    const passwordValid = validateField('password', form.password);
    
    if (!emailValid || !passwordValid) {
      setTimeout(() => {
        if (!emailValid && emailInputRef.current) {
          emailInputRef.current.focus();
        } else if (!passwordValid && passwordInputRef.current) {
          passwordInputRef.current.focus();
        }
      }, 100);
      return;
    }

    try {
      console.log('🚀 Attempting login from Login component');
      
      await login({ email: form.email.trim(), password: form.password });
      
      console.log('✅ Login successful from Login component perspective');
      
    } catch (err) {
      console.error('❌ Login failed in Login component:', err);
      
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      
      setTimeout(() => {
        if (errorMessage.toLowerCase().includes('email') || 
            errorMessage.toLowerCase().includes('account')) {
          if (emailInputRef.current) {
            emailInputRef.current.focus();
            emailInputRef.current.select();
          }
        } else if (!errorMessage.toLowerCase().includes('connection')) {
          if (passwordInputRef.current) {
            passwordInputRef.current.focus();
            passwordInputRef.current.select();
          }
        }
      }, 100);
      
      return;
    }
  };

  const handleForceLogin = async () => {
    setShowSessionConflict(false);
    setError('');
    
    try {
      await forceLogin({ email: form.email.trim(), password: form.password });
      clearSessionConflict();
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
    }
  };

  const handleCancelConflict = () => {
    setShowSessionConflict(false);
    clearSessionConflict();
  };

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
              You&apos;re already logged in on another device or browser. 
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