// client/src/components/ResetPassword.jsx
import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { sendReset } from '../api';
import '../assets/styles/ResetPassword.css';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [message, setMessage]  = useState('');
  const [error, setError]      = useState('');
  const [loading, setLoading]  = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setMessage('');
    if (!password) {
      setError('Please enter a new password.');
      return;
    }
    try {
      setLoading(true);
      await sendReset({ token, new_password: password });
      setMessage('Password updated! Redirecting to login…');
      setTimeout(() => navigate('/login'), 2000);
    } catch {
      setError('Link invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-container">
      <form onSubmit={handleSubmit} className="reset-form">
        <h2 className="reset-title">Reset Password</h2>
        {message && <p className="reset-success">{message}</p>}
        {error   && <p className="reset-error">{error}</p>}
        <input
          type="password"
          name="new_password"
          placeholder="New password"
          autoComplete="new-password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="reset-input"
        />
        <button
          type="submit"
          className="reset-button"
          disabled={loading}
        >
          {loading ? 'Updating…' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}
