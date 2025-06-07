import React, { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import '../assets/styles/SignUp.css';
import logo from '../assets/images/logo.png';

const SignUp = () => {
  const navigate = useNavigate();
  const { register } = useContext(AuthContext);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ name: '', email: '', password: '' });
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: '', isValid: false });

  // Focus management refs
  const nameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  // Enhanced error message handler
  const getErrorMessage = (error) => {
    const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || '';
    const statusCode = error.response?.status;

    // Handle specific error cases
    if (statusCode === 400) {
      if (errorMsg.toLowerCase().includes('email') && errorMsg.toLowerCase().includes('exists')) {
        return 'An account with this email address already exists. Please try logging in instead.';
      }
      if (errorMsg.toLowerCase().includes('password')) {
        return 'Password does not meet security requirements. Please check the criteria below.';
      }
      if (errorMsg.toLowerCase().includes('email') && errorMsg.toLowerCase().includes('invalid')) {
        return 'Please enter a valid email address.';
      }
      return errorMsg;
    }

    if (statusCode === 429) {
      return 'Too many signup attempts. Please wait a few minutes before trying again.';
    }

    if (statusCode >= 500) {
      return 'Server error. Please try again in a moment.';
    }

    // Network errors
    if (errorMsg.toLowerCase().includes('network')) {
      return 'Connection problem. Please check your internet and try again.';
    }

    // Default fallback
    return errorMsg || 'Signup failed. Please try again.';
  };

  // Password strength checker - FIXED to be more reliable
  const checkPasswordStrength = (password) => {
    let score = 0;
    let feedback = [];

    const hasLength = password.length >= 8;
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[\W_]/.test(password);

    if (hasLength) score++;
    else feedback.push('at least 8 characters');

    if (hasLower) score++;
    else feedback.push('lowercase letter');

    if (hasUpper) score++;
    else feedback.push('uppercase letter');

    if (hasNumber) score++;
    else feedback.push('number');

    if (hasSpecial) score++;
    else feedback.push('special character');

    const strengthLevels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const strengthText = strengthLevels[score] || 'Very Weak';

    const isValid = hasLength && hasLower && hasUpper && hasNumber && hasSpecial;

    return {
      score,
      feedback: feedback.length > 0 ? `Need: ${feedback.join(', ')}` : 'Strong password!',
      strength: strengthText,
      isValid, // This should be true for "Today@2025"
      hasLength,
      hasLower,
      hasUpper,
      hasNumber,
      hasSpecial
    };
  };

  // Validate individual fields
  const validateField = (name, value) => {
    let fieldError = '';
    
    switch (name) {
      case 'name':
        if (!value.trim()) {
          fieldError = 'Full name is required';
        } else if (value.trim().length < 2) {
          fieldError = 'Name must be at least 2 characters';
        } else if (!/^[a-zA-Z\s'-]+$/.test(value.trim())) {
          fieldError = 'Name can only contain letters, spaces, hyphens and apostrophes';
        }
        break;
      
      case 'email':
        if (!value) {
          fieldError = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          fieldError = 'Please enter a valid email address';
        }
        break;
      
      case 'password':
        if (!value) {
          fieldError = 'Password is required';
        } else {
          const strength = checkPasswordStrength(value);
          // Update password strength immediately
          setPasswordStrength(strength);
          if (!strength.isValid) {
            fieldError = 'Password must meet all requirements below';
          }
        }
        break;
      
      default:
        break;
    }
    
    setFieldErrors(prev => ({ ...prev, [name]: fieldError }));
    return fieldError === '';
  };

  const handleChange = (e) => {
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
    } else if (name === 'password') {
      // Reset password strength when field is empty
      setPasswordStrength({ score: 0, feedback: '', isValid: false });
    }
  };

  const handleSubmit = async (e) => {
    console.log('🔥 BUTTON CLICKED! Form submission started');
    e.preventDefault();
    setError('');
    setFieldErrors({ name: '', email: '', password: '' });

    // Client-side validation
    const nameValid = validateField('name', form.name);
    const emailValid = validateField('email', form.email);
    const passwordValid = validateField('password', form.password);

    console.log('Validation results:', { nameValid, emailValid, passwordValid });
    console.log('Password strength:', passwordStrength);

    if (!nameValid || !emailValid || !passwordValid) {
      console.log('Form validation failed');
      // Focus the first invalid field
      setTimeout(() => {
        if (!nameValid && nameInputRef.current) {
          nameInputRef.current.focus();
        } else if (!emailValid && emailInputRef.current) {
          emailInputRef.current.focus();
        } else if (!passwordValid && passwordInputRef.current) {
          passwordInputRef.current.focus();
        }
      }, 100);
      return;
    }

    try {
      console.log('Starting registration...');
      setLoading(true);
      
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      console.log('Registration successful!');

      // Store credentials so the browser can prompt to save them
      if (navigator.credentials && window.PasswordCredential) {
        const cred = new window.PasswordCredential({
          id: form.email.trim(),
          password: form.password,
          name: form.name.trim(),
        });
        navigator.credentials.store(cred).catch(() => {
          /* ignore if store fails */
        });
      }

      // Success - navigate to login with success message
      navigate('/login', { 
        state: { 
          message: 'Account created successfully! Please log in with your credentials.',
          email: form.email.trim()
        }
      });
    } catch (err) {
      console.error('Registration error:', err);
      // Enhanced error handling
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      
      // Smart focus management based on error type
      setTimeout(() => {
        if (errorMessage.toLowerCase().includes('email')) {
          if (emailInputRef.current) {
            emailInputRef.current.focus();
            emailInputRef.current.select();
          }
        } else if (errorMessage.toLowerCase().includes('password')) {
          if (passwordInputRef.current) {
            passwordInputRef.current.focus();
            passwordInputRef.current.select();
          }
        } else if (errorMessage.toLowerCase().includes('name')) {
          if (nameInputRef.current) {
            nameInputRef.current.focus();
            nameInputRef.current.select();
          }
        }
      }, 100);
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Check if form is valid - more reliable logic
  const isFormValid = () => {
    const nameOk = form.name.trim().length >= 2;
    const emailOk = form.email.trim() && /\S+@\S+\.\S+/.test(form.email);
    const passwordOk = form.password && checkPasswordStrength(form.password).isValid;
    const noErrors = !fieldErrors.name && !fieldErrors.email && !fieldErrors.password;
    
    // Debug logging
    console.log('Form validity check:', {
      nameOk,
      emailOk, 
      passwordOk,
      noErrors,
      currentPassword: form.password,
      passwordStrengthCheck: checkPasswordStrength(form.password)
    });
    
    return nameOk && emailOk && passwordOk && noErrors;
  };

  // Update password strength whenever password changes
  useEffect(() => {
    if (form.password) {
      const strength = checkPasswordStrength(form.password);
      setPasswordStrength(strength);
    }
  }, [form.password]);

  // Debug the current state
  console.log('Current form state:', {
    form,
    passwordStrength,
    isValid: isFormValid(),
    fieldErrors
  });

  return (
    <div className="signup-container">
      <div className="signup-branding">
        <div className="logo-container">
          <img src={logo} alt="SemaNami Logo" className="logo-image" />
        </div>
        <h1 className="signup-web-title">SemaNami</h1>
      </div>
      
      <div className="signup-form-wrapper">
        <h2 className="signup-title">Create Your Account</h2>
        
        {error && (
          <div className="signup-error">
            <span>⚠️ {error}</span>
            {error.toLowerCase().includes('email') && error.toLowerCase().includes('exists') ? (
              <small className="error-help-text">
                Try <button 
                  type="button" 
                  className="inline-link" 
                  onClick={() => navigate('/login')}
                >
                  logging in
                </button> instead, or use a different email address
              </small>
            ) : error.toLowerCase().includes('password') ? (
              <small className="error-help-text">
                Check the password requirements below
              </small>
            ) : null}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="signup-form">
          <div className="input-group">
            <input
              ref={nameInputRef}
              type="text"
              name="name"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              className={`signup-input ${fieldErrors.name ? 'input-error' : ''}`}
              required
              disabled={loading}
              autoComplete="name"
            />
            {fieldErrors.name && (
              <span className="field-error">{fieldErrors.name}</span>
            )}
          </div>

          <div className="input-group">
            <input
              ref={emailInputRef}
              type="email"
              name="email"
              placeholder="Email Address"
              value={form.email}
              onChange={handleChange}
              className={`signup-input ${fieldErrors.email ? 'input-error' : ''}`}
              required
              disabled={loading}
              autoComplete="email"
            />
            {fieldErrors.email && (
              <span className="field-error">{fieldErrors.email}</span>
            )}
          </div>

          <div className="input-group">
            <div className="signup-password-wrapper">
              <input
                ref={passwordInputRef}
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                className={`signup-input ${fieldErrors.password ? 'input-error' : ''}`}
                required
                disabled={loading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="signup-show-password-btn"
                disabled={loading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            
            {/* Password strength indicator */}
            {form.password && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div 
                    className={`strength-fill strength-${passwordStrength.score}`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  ></div>
                </div>
                <span className={`strength-text strength-${passwordStrength.score}`}>
                  {passwordStrength.strength} {passwordStrength.isValid ? '✅' : '❌'}
                </span>
              </div>
            )}
            
            {fieldErrors.password && (
              <span className="field-error">{fieldErrors.password}</span>
            )}
            
            {/* FIXED Password requirements with real-time checking */}
            <div className="password-requirements">
              <small>Password must contain:</small>
              <ul>
                <li className={passwordStrength.hasLower ? 'valid' : ''}>
                  At least one lowercase letter {passwordStrength.hasLower ? '✅' : '❌'}
                </li>
                <li className={passwordStrength.hasUpper ? 'valid' : ''}>
                  At least one uppercase letter {passwordStrength.hasUpper ? '✅' : '❌'}
                </li>
                <li className={passwordStrength.hasNumber ? 'valid' : ''}>
                  At least one number {passwordStrength.hasNumber ? '✅' : '❌'}
                </li>
                <li className={passwordStrength.hasSpecial ? 'valid' : ''}>
                  At least one special character {passwordStrength.hasSpecial ? '✅' : '❌'}
                </li>
                <li className={passwordStrength.hasLength ? 'valid' : ''}>
                  At least 8 characters long {passwordStrength.hasLength ? '✅' : '❌'}
                </li>
              </ul>
            </div>
          </div>

          <button
            type="submit"
            className={`signup-button ${loading ? 'signup-loading' : ''} ${isFormValid() ? 'button-enabled' : 'button-disabled'}`}
            disabled={loading || !isFormValid()}
            onClick={() => console.log('Button clicked! Valid:', isFormValid())}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
          
          {/* Debug info - remove in production */}
          <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
            Debug: Button {isFormValid() ? 'ENABLED' : 'DISABLED'} | 
            Valid: {isFormValid() ? 'YES' : 'NO'} | 
            Password Valid: {passwordStrength.isValid ? 'YES' : 'NO'}
          </div>
        </form>
        
        <p className="signup-footer-text">
          Already have an account?{' '}
          <button
            onClick={() => navigate('/login')}
            className="signup-login-link"
            disabled={loading}
          >
            Log In
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignUp;