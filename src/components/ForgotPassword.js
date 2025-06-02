import React, { useState } from 'react';
import { sendForgot } from '../api';
import '../assets/styles/ForgotPassword.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    try {
      setLoading(true);
      await sendForgot({ email });
      setMessage("If that email exists, you’ll get a reset link shortly.");
    } catch {
      setError("Unexpected error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-container">
      <form onSubmit={handleSubmit} className="forgot-form">
        <h2 className="forgot-title">Forgot your password?</h2>
        {message && <p className="forgot-success">{message}</p>}
        {error   && <p className="forgot-error">{error}</p>}
        <input
          type="email"
          name="email"
          placeholder="Email address"
          autoComplete="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="forgot-input"
        />
        <button
          type="submit"
          className="forgot-button"
          disabled={loading}
        >
          {loading ? "Sending…" : "Send Reset Link"}
        </button>
      </form>
    </div>
  );
}
