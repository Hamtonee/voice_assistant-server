import bcrypt from 'bcrypt';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} from '../utils/tokenUtils.js';
import trialService from '../services/trialService.js';
import { sendVerification, checkVerification, toE164 } from '../services/twilioVerifyService.js';

const prisma = new PrismaClient();

// Generate unique token ID for session tracking
const generateTokenId = () => crypto.randomUUID();

// Generate device info from request headers
const getDeviceInfo = (req) => {
  const userAgent = req.get('User-Agent') || 'Unknown';
  const deviceType = /Mobile|Android|iPhone|iPad/.test(userAgent) ? 'Mobile' : 'Desktop';
  const browser = userAgent.split(' ').slice(-1)[0] || 'Unknown';
  return `${deviceType} - ${browser}`;
};

// ✉️ Email transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.SENDGRID_HOST,
  port: Number(process.env.SENDGRID_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SENDGRID_USER,
    pass: process.env.SENDGRID_API_KEY,
  },
});

// Default expiry for email verification (24 hours)
const EMAIL_VERIFICATION_EXPIRY_MS = 24 * 60 * 60 * 1000;

// Normalize phone for storage (e.g. 0712345678) and E.164 for Twilio
const normalizePhone = (raw) => {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.startsWith('254')) return `0${digits.slice(3)}`;
  if (digits.startsWith('7') && digits.length === 9) return `0${digits}`;
  if (digits.startsWith('0')) return digits;
  return digits.length > 0 ? `0${digits}` : '';
};
const isValidPhone = (value) => /^07[0-9]{8}$/.test(value);

//
// 📝 POST /auth/register
//
export const register = async (req, res) => {
  const { email, password, name, phone } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required.' });
  }
  // Ensure password is non-empty (required for email signup)
  if (password.length < 1) {
    return res.status(400).json({ error: 'Password is required.' });
  }

  const phoneNormalized = phone ? normalizePhone(phone) : null;
  if (phone && (!phoneNormalized || !isValidPhone(phoneNormalized))) {
    return res.status(400).json({ error: 'Invalid phone number. Use e.g. 0712345678 or +254712345678.' });
  }

  try {
    const existingUser = await prisma.authUser.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.authUser.create({
      data: {
        email: email.toLowerCase(),
        hashed_password: hashed,
        full_name: name,
        is_verified: false,
        phone_number: phoneNormalized || null,
        phone_verified: false,
      },
    });

    // Email verification (link)
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyExpiresAt = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY_MS);
    await prisma.emailVerificationToken.create({
      data: {
        token: verifyToken,
        userId: user.id,
        expiresAt: verifyExpiresAt,
      },
    });

    // Verification link: use FRONTEND_URL so the link works from email (e.g. https://yourapp.com/verify-email?token=...)
    const baseUrl = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
    const verifyLink = `${baseUrl}/verify-email?token=${verifyToken}`;
    try {
      await transporter.sendMail({
        from: process.env.FROM_EMAIL,
        to: user.email,
        subject: 'Verify your email address',
        text: `Welcome! Please verify your email by opening this link: ${verifyLink}. This link expires in 24 hours.`,
        html: `
          <p>Welcome! Please verify your email address to complete your account setup.</p>
          <p><a href="${verifyLink}">Verify my email</a></p>
          <p>This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>
        `,
      });
    } catch (mailErr) {
      console.error('Verification email send error:', mailErr);
      // Registration still succeeds; user can use "Resend verification" from login
    }

    // Phone verification (Twilio OTP) – send SMS if phone provided
    let phoneVerificationSent = false;
    if (phoneNormalized) {
      try {
        const e164 = toE164(phoneNormalized);
        await sendVerification(e164, 'sms');
        phoneVerificationSent = true;
      } catch (twilioErr) {
        console.error('Twilio phone verification send error:', twilioErr);
        // Don't fail registration; user can request resend later
      }
    }

    await prisma.event.create({
      data: {
        user_id: user.id,
        type: 'USER_REGISTERED',
        description: `User ${email} registered.`,
      },
    });

    return res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.full_name,
      is_verified: false,
      phone_number: phoneNormalized || null,
      phone_verified: false,
      needs_phone_verification: phoneVerificationSent,
      message: phoneVerificationSent
        ? 'Account created. A verification link was sent to your email and an OTP to your phone.'
        : 'Account created. A verification link was sent to your email—please check your inbox to verify your address.',
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

//
// ✉️ POST /auth/verify-email
//
export const verifyEmail = async (req, res) => {
  const token = req.body?.token || req.query?.token;
  if (!token) {
    return res.status(400).json({ error: 'Verification token is required.' });
  }

  try {
    const record = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired verification link. You can request a new one from the app.' });
    }

    await prisma.authUser.update({
      where: { id: record.userId },
      data: { is_verified: true },
    });
    await prisma.emailVerificationToken.delete({ where: { token } });

    await prisma.event.create({
      data: {
        user_id: record.userId,
        type: 'EMAIL_VERIFIED',
        description: 'User verified their email address.',
      },
    });

    return res.json({
      success: true,
      message: 'Email verified successfully. You can now sign in.',
    });
  } catch (err) {
    console.error('Verify email error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

//
// 📤 POST /auth/resend-verification
//
export const resendVerification = async (req, res) => {
  const email = req.body?.email || req.user?.email;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  try {
    const user = await prisma.authUser.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user) {
      return res.json({ success: true, message: 'If that email is registered, a new verification link was sent.' });
    }
    if (user.is_verified) {
      return res.status(400).json({ error: 'This email is already verified.' });
    }

    // Remove any existing tokens for this user
    await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });

    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyExpiresAt = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY_MS);
    await prisma.emailVerificationToken.create({
      data: {
        token: verifyToken,
        userId: user.id,
        expiresAt: verifyExpiresAt,
      },
    });

    const verifyLink = `${process.env.FRONTEND_URL || ''}/verify-email?token=${verifyToken}`;
    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: user.email,
      subject: 'Verify your email address',
      text: `Verify your email: ${verifyLink}. This link expires in 24 hours.`,
      html: `
        <p>Click the link below to verify your email:</p>
        <p><a href="${verifyLink}">Verify my email</a></p>
        <p>This link expires in 24 hours.</p>
      `,
    });

    return res.json({
      success: true,
      message: 'A new verification link has been sent to your email.',
    });
  } catch (err) {
    console.error('Resend verification error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

//
// 📱 POST /auth/send-phone-verification – send OTP to phone for security verification (Twilio)
// Used when user enters their number (e.g. after signup, resend, or add-phone flows).
//
export const sendPhoneVerification = async (req, res) => {
  const phone = req.body?.phone;
  const phoneNormalized = phone ? normalizePhone(phone) : null;
  if (!phoneNormalized || !isValidPhone(phoneNormalized)) {
    return res.status(400).json({ error: 'Valid phone number is required (e.g. 0712345678).' });
  }

  try {
    const e164 = toE164(phoneNormalized);
    await sendVerification(e164, 'sms');
    return res.json({
      success: true,
      message: 'Verification code sent to your phone for security verification.',
    });
  } catch (err) {
    console.error('Send phone verification error:', err);
    return res.status(500).json({
      error: err.message || 'Failed to send verification code.',
    });
  }
};

//
// 📱 POST /auth/verify-phone – check OTP and mark phone verified (Twilio)
//
export const verifyPhone = async (req, res) => {
  const { phone, code } = req.body || {};
  const phoneNormalized = phone ? normalizePhone(phone) : null;
  if (!phoneNormalized || !isValidPhone(phoneNormalized)) {
    return res.status(400).json({ error: 'Valid phone number is required.' });
  }
  const codeStr = String(code || '').trim();
  if (!codeStr) {
    return res.status(400).json({ error: 'Verification code is required.' });
  }

  try {
    const e164 = toE164(phoneNormalized);
    const { valid } = await checkVerification(e164, codeStr);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid or expired verification code.' });
    }

    // Find user by this phone and update phone_verified (e.g. after sign-up)
    const user = await prisma.authUser.findFirst({
      where: { phone_number: phoneNormalized },
    });
    if (user) {
      await prisma.authUser.update({
        where: { id: user.id },
        data: { phone_verified: true },
      });
    }

    return res.json({
      success: true,
      message: 'Phone number verified.',
      phone_number: phoneNormalized,
    });
  } catch (err) {
    console.error('Verify phone error:', err);
    return res.status(400).json({
      error: err.message || 'Verification failed. Check the code and try again.',
    });
  }
};

//
// 🔑 POST /auth/login
//
export const login = async (req, res) => {
  const { email, password, forceNewSession } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'] || 'Unknown';

  console.log('🔑 Login attempt:', { email, forceNewSession, ipAddress }); // Debug log

  try {
    const user = await prisma.authUser.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        full_name: true,
        hashed_password: true,
        is_active: true,
        is_verified: true,
        created_at: true,
        updated_at: true,
        last_login: true
      },
    });

    if (!user) {
      // Track failed login attempt
      await trialService.trackLoginAttempt(null, false, ipAddress, userAgent);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Google-only accounts have no password
    if (!user.hashed_password) {
      await trialService.trackLoginAttempt(user.id, false, ipAddress, userAgent);
      return res.status(401).json({
        error: 'This account uses Google sign-in. Please use "Continue with Google".',
        code: 'USE_GOOGLE_SIGNIN'
      });
    }

    const valid = await bcrypt.compare(password, user.hashed_password);
    if (!valid) {
      // Track failed login attempt
      await trialService.trackLoginAttempt(user.id, false, ipAddress, userAgent);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('👤 User session status:', {
      userId: user.id,
      forceNewSession
    }); // Debug log

    // Check user access (trial or subscription)
    const accessCheck = await trialService.checkUserAccess(user.id);
    
    if (!accessCheck.hasAccess) {
      // Track failed access attempt
      await trialService.trackLoginAttempt(user.id, false, ipAddress, userAgent);
      
      return res.status(403).json({
        success: false,
        error: accessCheck.reason,
        code: 'ACCESS_DENIED',
        requiresSubscription: accessCheck.requiresSubscription,
        trialEnd: accessCheck.trialEnd,
        action: accessCheck.requiresSubscription ? 'subscribe' : 'wait'
      });
    }

    // Initialize trial when eligible (trialService is a no-op in local dev)
    if (accessCheck.reason === 'Eligible for trial') {
      const trialResult = await trialService.initializeTrial(user.id);
      if (!trialResult.success) {
        console.error('❌ Failed to initialize trial:', trialResult.error);
      }
    }

    // Update last login
    await prisma.authUser.update({
      where: { id: user.id },
      data: {
        last_login: new Date()
      }
    });

    // Track successful login
    await trialService.trackLoginAttempt(user.id, true, ipAddress, userAgent);

    // Generate new session
    const tokenId = generateTokenId();
    const deviceInfo = getDeviceInfo(req);

    console.log('🆔 Generated new tokenId:', tokenId); // Debug log

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      tokenId
    });
    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      tokenId
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await prisma.event.create({
      data: {
        user_id: user.id,
        type: 'USER_LOGIN',
        description: `User ${email} logged in${forceNewSession ? ' (forced new session)' : ''} on ${deviceInfo}.`,
      },
    });

    // Get updated trial info
    const trialInfo = await trialService.getTrialInfo(user.id);

    return res.json({
      success: true,
      token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        is_active: user.is_active,
        is_verified: user.is_verified,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login: user.last_login
      },
      access: {
        type: accessCheck.accessType,
        trialInfo: trialInfo.success ? trialInfo : null,
        requiresSubscription: accessCheck.requiresSubscription
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

//
// 🔁 POST /auth/refresh
//
export const refresh = async (req, res) => {
  const token = req.cookies.refreshToken;
  console.log('🧾 Incoming refresh token:', token);

  if (!token) return res.status(401).json({ error: 'No refresh token provided' });

  try {
    const payload = verifyRefreshToken(token);

    if (!payload?.userId || !payload?.tokenId) {
      throw new Error('Invalid refresh token payload');
    }

    console.log('🔍 Refresh token check:', {
      userId: payload.userId,
      tokenId: payload.tokenId
    });

    // Check if user still exists and session is still active
    const user = await prisma.authUser.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true
      }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Session expired. User not found.',
        code: 'SESSION_INVALID'
      });
    }

    // Generate new access token with same session ID
    const newAccessToken = generateAccessToken({
      userId: payload.userId,
      email: payload.email,
      tokenId: payload.tokenId
    });

    console.log('✅ Refresh successful for user:', payload.userId);
    return res.json({ token: newAccessToken });
  } catch (err) {
    console.error('❌ Refresh token error:', err.message);
    return res.status(403).json({ error: 'Invalid or expired refresh token' });
  }
};

//
// 🚪 POST /auth/logout
//
export const logout = async (req, res) => {
  try {
    res.clearCookie('refreshToken');

    if (req.user?.id) {
      console.log('🚪 Logging out user:', req.user.id);

      // Clear the active session
      await prisma.event.create({
        data: {
          user_id: req.user.id,
          type: 'USER_LOGOUT',
          description: `User ${req.user.email || req.user.id} logged out.`,
        },
      });

      console.log('✅ User logged out successfully:', req.user.id);
    }

    return res.json({ ok: true, message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({ error: 'Logout failed' });
  }
};

//
// 📬 POST /auth/forgot-password
//
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  try {
    const user = await prisma.authUser.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return res.json({ ok: true });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.resetToken.create({
      data: { token, userId: user.id, expiresAt },
    });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: email,
      subject: 'Reset your password',
      text: `Reset link: ${resetLink}`,
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 1 hour.</p>`,
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

//
// 🔁 POST /auth/reset-password
//
export const resetPassword = async (req, res) => {
  const { token, new_password } = req.body;
  if (!token || !new_password) {
    return res.status(400).json({ error: 'Token and new password are required.' });
  }

  try {
    const record = await prisma.resetToken.findUnique({ where: { token } });
    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired reset token.' });
    }

    const hashed = await bcrypt.hash(new_password, 10);

    console.log('🔄 Resetting password for user:', record.userId);

    // Update password and clear active sessions (force re-login)
    await prisma.authUser.update({
      where: { id: record.userId },
      data: {
        hashed_password: hashed
      },
    });

    await prisma.resetToken.delete({ where: { token } });

    await prisma.event.create({
      data: {
        user_id: record.userId,
        type: 'PASSWORD_RESET',
        description: 'Password was reset successfully.',
      },
    });

    console.log('✅ Password reset successful for user:', record.userId);
    return res.json({ ok: true });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

//
// 🙋‍♂️ GET /auth/me
//
export const getMe = async (req, res) => {
  console.log('👤 [GET] /auth/me – req.user:', req.user);
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized – no user in request' });
    }

    // Get fresh user data with session info
    const user = await prisma.authUser.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        full_name: true,
        created_at: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user });
  } catch (err) {
    console.error('getMe error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

//
// 🔍 GET /auth/session-check (NEW)
//
export const sessionCheck = async (req, res) => {
  try {
    console.log('🔍 Session check requested for user:', req.user?.id);
    // This endpoint just validates the session through middleware
    // If we reach here, the session is valid
    return res.json({
      valid: true,
      user: req.user,
      tokenId: req.tokenId,
      timestamp: new Date()
    });
  } catch (err) {
    console.error('Session check error:', err);
    return res.status(500).json({ error: 'Session check failed' });
  }
};

// ——— Google OAuth (Gmail sign-in / sign-up) ———
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

function getGoogleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const baseUrl = (process.env.API_BASE_URL || process.env.BASE_URL || '').replace(/\/$/, '') || 'http://localhost:5000/api';
  const callbackPath = '/auth/google/callback';
  const redirectUri = `${baseUrl}${callbackPath}`;
  return { clientId, clientSecret, redirectUri };
}

/**
 * GET /auth/google — Redirect user to Google consent screen.
 * Query: intent=signup, name=... (optional) — when present, name is passed through state and used when creating a new user.
 */
export const googleRedirect = (req, res) => {
  const { clientId, redirectUri } = getGoogleConfig();
  if (!clientId) {
    return res.status(500).json({ error: 'Google sign-in is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.' });
  }
  const intent = req.query.intent === 'signup' ? 'signup' : null;
  const name = (req.query.name && String(req.query.name).trim()) || null;
  const statePayload = { r: crypto.randomBytes(16).toString('hex') };
  if (intent) statePayload.intent = intent;
  if (name) statePayload.name = name.slice(0, 200);
  const state = Buffer.from(JSON.stringify(statePayload)).toString('base64url');
  const scope = 'openid email profile';
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope,
    state,
    access_type: 'offline',
    prompt: 'consent'
  });
  res.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
};

/**
 * GET /auth/google/callback — Exchange code for tokens, get profile, find or create user, issue JWT, redirect to frontend.
 */
export const googleCallback = async (req, res) => {
  const { code, state, error } = req.query;
  const frontendUrl = (process.env.FRONTEND_URL || process.env.FRONTEND_URLS || '').split(',')[0].trim().replace(/\/$/, '') || 'http://localhost:3000';

  if (error) {
    const message = encodeURIComponent(error === 'access_denied' ? 'Sign-in was cancelled.' : error);
    return res.redirect(`${frontendUrl}/login?error=${message}`);
  }
  if (!code) {
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('No authorization code from Google.')}`);
  }

  const { clientId, clientSecret, redirectUri } = getGoogleConfig();
  if (!clientId || !clientSecret) {
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Google sign-in is not configured.')}`);
  }

  try {
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error('Google token error:', tokenData);
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Failed to sign in with Google.')}`);
    }
    const accessToken = tokenData.access_token;

    const userInfoRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const profile = await userInfoRes.json();
    if (!userInfoRes.ok) {
      console.error('Google userinfo error:', profile);
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Failed to get profile from Google.')}`);
    }

    const { id: googleId, email, name: profileName } = profile;
    const emailLower = (email || '').toLowerCase();
    if (!emailLower) {
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Google did not provide an email.')}`);
    }

    let stateData = null;
    try {
      if (state && typeof state === 'string') {
        stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
      }
    } catch (_) {}

    let user = await prisma.authUser.findFirst({
      where: { OR: [{ google_id: googleId }, { email: emailLower }] }
    });

    if (!user) {
      const displayName = (stateData?.name && String(stateData.name).trim()) || profileName || emailLower.split('@')[0];
      user = await prisma.authUser.create({
        data: {
          email: emailLower,
          hashed_password: null,
          google_id: googleId,
          full_name: displayName,
          is_verified: true
        }
      });
      await prisma.event.create({
        data: {
          user_id: user.id,
          type: 'USER_REGISTERED',
          description: `User ${emailLower} signed up via Google.`
        }
      });
    } else if (!user.google_id) {
      // Existing email user: link Google to this account
      await prisma.authUser.update({
        where: { id: user.id },
        data: { google_id: googleId, is_verified: true }
      });
      user = await prisma.authUser.findUnique({ where: { id: user.id } });
    }

    const accessCheck = await trialService.checkUserAccess(user.id);
    if (!accessCheck.hasAccess) {
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(accessCheck.reason || 'Access denied.')}`);
    }
    if (accessCheck.reason === 'Eligible for trial') {
      await trialService.initializeTrial(user.id);
    }

    await prisma.authUser.update({
      where: { id: user.id },
      data: { last_login: new Date() }
    });
    await trialService.trackLoginAttempt(user.id, true, req.ip || '', req.get('User-Agent') || '');

    const tokenId = generateTokenId();
    const jwtToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      tokenId
    });
    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      tokenId
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    await prisma.event.create({
      data: {
        user_id: user.id,
        type: 'USER_LOGIN',
        description: `User ${user.email} logged in via Google.`
      }
    });

    res.redirect(`${frontendUrl}/auth/callback?token=${encodeURIComponent(jwtToken)}`);
  } catch (err) {
    console.error('Google callback error:', err);
    res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Sign-in failed. Please try again.')}`);
  }
};