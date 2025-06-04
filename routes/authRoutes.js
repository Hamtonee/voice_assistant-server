import express from 'express';
import {
  register,
  login,
  forgotPassword,
  resetPassword,
  getMe,
  refresh,
  logout,
} from '../controllers/authController.js';

import auth from '../middleware/auth.js'; // 🔐 JWT auth middleware

const router = express.Router();

//
// 🚨 Health check
//
router.get('/ping', (_req, res) => {
  res.send('✅ Auth router is live');
});

//
// 🧾 Public authentication routes
//
router.post('/register', register);               // Create new user
router.post('/login', login);                     // Login and receive tokens
router.post('/forgot-password', forgotPassword);  // Request password reset email
router.post('/reset-password', resetPassword);    // Perform password reset
router.post('/refresh', refresh);                 // 🔁 Get new access token from refresh token

//
// 🔒 Protected routes (require valid access token)
//
router.get('/me', auth, getMe);                   // Get current user from access token
router.post('/logout', auth, logout);             // Logout and clear refresh token

export default router;
