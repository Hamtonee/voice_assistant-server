/**
 * Enhanced Authentication Middleware
 * Includes trial period, subscription, and security checks
 */

import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import trialService from '../services/trialService.js';
import subscriptionService from '../services/subscriptionService.js';

const prisma = new PrismaClient();

/**
 * Enhanced authentication with trial and security checks
 */
export const enhancedAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authorization header required',
        code: 'MISSING_TOKEN'
      });
    }

    const token = header.substring(7);
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    const { userId, email } = decoded;

    // Get user from database
    const user = await prisma.authUser.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        full_name: true,
        is_active: true,
        is_verified: true,
        created_at: true,
        last_login: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'Account is inactive',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    // Check user access (trial or subscription)
    const accessCheck = await trialService.checkUserAccess(userId);
    
    if (!accessCheck.hasAccess) {
      // Track failed access attempt
      await trialService.trackLoginAttempt(userId, false, ipAddress, userAgent);
      
      return res.status(403).json({
        success: false,
        error: accessCheck.reason,
        code: 'ACCESS_DENIED',
        requiresSubscription: accessCheck.requiresSubscription,
        trialEnd: accessCheck.trialEnd,
        action: accessCheck.requiresSubscription ? 'subscribe' : 'wait'
      });
    }

    // Track successful access
    await trialService.trackLoginAttempt(userId, true, ipAddress, userAgent);

    // Attach user and access info to request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.full_name,
      isActive: user.is_active,
      isVerified: user.is_verified,
      createdAt: user.created_at,
      lastLogin: user.last_login,
      accessType: accessCheck.accessType,
      trialInfo: accessCheck.accessType === 'trial' ? {
        daysRemaining: accessCheck.daysRemaining,
        trialEnd: accessCheck.trialEnd
      } : null
    };

    next();
  } catch (error) {
    console.error('❌ Error in enhanced auth middleware:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Middleware to require subscription (no trial access)
 */
export const requireSubscription = async (req, res, next) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // If user is on trial, they can't access subscription-only features
    if (user.accessType === 'trial') {
      return res.status(403).json({
        success: false,
        error: 'This feature requires a subscription',
        code: 'SUBSCRIPTION_REQUIRED',
        trialInfo: user.trialInfo,
        action: 'subscribe'
      });
    }

    // Check if user has active subscription
    const hasValidSubscription = await subscriptionService.hasValidSubscription(user.id);
    
    if (!hasValidSubscription) {
      return res.status(403).json({
        success: false,
        error: 'Active subscription required',
        code: 'SUBSCRIPTION_REQUIRED',
        action: 'subscribe'
      });
    }

    next();
  } catch (error) {
    console.error('❌ Error in subscription middleware:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Subscription check error',
      code: 'SUBSCRIPTION_ERROR'
    });
  }
};

/**
 * Middleware to check trial status without blocking
 */
export const checkTrialStatus = async (req, res, next) => {
  try {
    const user = req.user;
    
    if (user) {
      const trialInfo = await trialService.getTrialInfo(user.id);
      req.trialInfo = trialInfo;
    }

    next();
  } catch (error) {
    console.error('❌ Error checking trial status:', error.message);
    req.trialInfo = { success: false, error: error.message };
    next();
  }
};

/**
 * Rate limiting middleware for sensitive operations
 */
export const rateLimitSensitive = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();

  return (req, res, next) => {
    const key = `${req.ip}-${req.user?.id || 'anonymous'}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old attempts
    if (attempts.has(key)) {
      const userAttempts = attempts.get(key).filter(time => time > windowStart);
      attempts.set(key, userAttempts);
    } else {
      attempts.set(key, []);
    }

    const userAttempts = attempts.get(key);

    if (userAttempts.length >= maxAttempts) {
      return res.status(429).json({
        success: false,
        error: 'Too many attempts. Please try again later.',
        code: 'RATE_LIMITED',
        retryAfter: Math.ceil((userAttempts[0] + windowMs - now) / 1000)
      });
    }

    userAttempts.push(now);
    next();
  };
};

export default {
  enhancedAuth,
  requireSubscription,
  checkTrialStatus,
  rateLimitSensitive
};







