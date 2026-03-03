import express from 'express';
import {
  register,
  login,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  sendPhoneVerification,
  verifyPhone,
  getMe,
  refresh,
  logout,
  sessionCheck,
  googleRedirect,
  googleCallback
} from '../controllers/authController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Health check
router.get('/ping', (_req, res) => {
  res.send('✅ Auth router is live');
});

// Public authentication routes
router.get('/google', googleRedirect);
router.get('/google/callback', googleCallback);
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-email', verifyEmail);
router.get('/verify-email', verifyEmail); // For link clicks: /verify-email?token=...
router.post('/resend-verification', resendVerification);
router.post('/send-phone-verification', sendPhoneVerification);
router.post('/verify-phone', verifyPhone);
router.post('/refresh', refresh);

// Protected routes
router.get('/me', auth, getMe);
router.get('/session-check', auth, sessionCheck);
router.post('/logout', auth, logout);

export default router;
