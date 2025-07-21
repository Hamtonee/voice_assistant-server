import bcrypt from 'bcrypt';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} from '../utils/tokenUtils.js';

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

//
// 📝 POST /auth/register
//
export const register = async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required.' });
  }

  try {
    // Check if user exists
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
        full_name: name, // or req.body.full_name if that's what you use
      },
    });

    await prisma.event.create({
      data: {
        userId: user.id,
        type: 'USER_REGISTERED',
        description: `User ${email} registered.`,
      },
    });

    return res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.full_name
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Internal server error' });
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

  console.log('🔑 Login attempt:', { email, forceNewSession }); // Debug log

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
        last_login: true,
      },
    });

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.hashed_password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    console.log('👤 User session status:', {
      userId: user.id,
      hasActiveToken: !!user.activeTokenId,
      activeTokenId: user.activeTokenId,
      forceNewSession,
      lastActive: user.lastActive
    }); // Debug log

    // Check for existing active session (STRICT: only allow if explicitly forcing)
    if (user.activeTokenId && forceNewSession !== true) {
      console.log('🚨 Blocking login - session conflict detected');
      return res.status(401).json({
        error: 'Already logged in elsewhere. Only one active session allowed.',
        code: 'SESSION_CONFLICT',
        currentDevice: user.deviceInfo || 'Unknown Device'
      });
    }

    if (forceNewSession === true && user.activeTokenId) {
      console.log('🔄 Force login - invalidating existing session');
    }

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

    // Update user with new active session
    const updatedUser = await prisma.authUser.update({
      where: { id: user.id },
      data: {
        activeTokenId: tokenId,
        lastActive: new Date(),
        deviceInfo
      }
    });

    console.log('💾 Updated user session:', {
      userId: updatedUser.id,
      newActiveTokenId: updatedUser.activeTokenId,
      deviceInfo: updatedUser.deviceInfo
    }); // Debug log

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await prisma.event.create({
      data: {
        userId: user.id,
        type: 'USER_LOGIN',
        description: `User ${email} logged in${forceNewSession ? ' (forced new session)' : ''} on ${deviceInfo}.`,
      },
    });

    return res.json({
      token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.full_name
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
        email: true,
        activeTokenId: true,
      }
    });

    if (!user || user.activeTokenId !== payload.tokenId) {
      console.log('🚨 Refresh denied - session conflict:', {
        userExists: !!user,
        dbTokenId: user?.activeTokenId,
        requestTokenId: payload.tokenId
      });
      return res.status(401).json({
        error: 'Session expired. You have been logged in elsewhere.',
        code: 'SESSION_CONFLICT'
      });
    }

    // Generate new access token with same session ID
    const newAccessToken = generateAccessToken({
      userId: payload.userId,
      email: payload.email,
      tokenId: payload.tokenId
    });

    // Update last active timestamp
    await prisma.authUser.update({
      where: { id: user.id },
      data: { lastActive: new Date() }
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
      await prisma.authUser.update({
        where: { id: req.user.id },
        data: {
          activeTokenId: null,
          lastActive: new Date()
        }
      });

      await prisma.event.create({
        data: {
          userId: req.user.id,
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
        hashed_password: hashed,
        activeTokenId: null // Force re-login after password reset
      },
    });

    await prisma.resetToken.delete({ where: { token } });

    await prisma.event.create({
      data: {
        userId: record.userId,
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
        createdAt: true,
        lastActive: true,
        deviceInfo: true
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