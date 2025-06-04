import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

/**
 * 🔒 JWT Authentication Middleware with Session Enforcement
 *
 * - Verifies the Bearer token in Authorization header.
 * - Loads the user from the database (excluding password).
 * - Checks if the session is still active (single session enforcement).
 * - Updates last activity timestamp.
 * - Attaches user info to req.user.
 */
export default async function auth(req, res, next) {
  const header = req.headers.authorization;
  
  // ✅ 1. Validate Bearer token format
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Missing or malformed token',
      code: 'NO_TOKEN'
    });
  }

  const token = header.split(' ')[1];
  let payload;

  // ✅ 2. Verify JWT signature
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.error('❌ JWT verification failed:', err.message);
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }

    return res.status(401).json({ 
      error: 'Invalid or expired token',
      code: 'TOKEN_ERROR'
    });
  }

  // ✅ 3. Extract user ID and token ID from payload
  const userId = payload.userId || payload.id || payload.sub;
  const tokenId = payload.tokenId;

  if (!userId) {
    console.error('⚠️ Token payload missing userId or id:', payload);
    return res.status(401).json({ 
      error: 'Invalid token payload',
      code: 'INVALID_PAYLOAD'
    });
  }

  // ✅ 4. Fetch user from database with session info
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: {
        id: true,
        email: true,
        name: true,
        activeTokenId: true,
        lastActive: true,
        deviceInfo: true,
        createdAt: true,
        // password intentionally excluded
      },
    });

    if (!user) {
      console.warn('⚠️ No user found for ID:', userId);
      return res.status(401).json({ 
        error: 'Invalid token user',
        code: 'USER_NOT_FOUND'
      });
    }

    console.log('🔍 Session check:', {
      userId: user.id,
      requestTokenId: tokenId,
      dbActiveTokenId: user.activeTokenId,
      hasTokenId: !!tokenId,
      hasActiveTokenId: !!user.activeTokenId,
      tokensMatch: tokenId === user.activeTokenId
    });

    // ✅ 5. Check session validity (single active session enforcement)
    if (tokenId && user.activeTokenId && user.activeTokenId !== tokenId) {
      console.warn('🚨 SESSION CONFLICT detected for user:', userId, {
        requestTokenId: tokenId,
        activeTokenId: user.activeTokenId
      });
      return res.status(401).json({ 
        error: 'Session expired. You have been logged in elsewhere.',
        code: 'SESSION_CONFLICT'
      });
    }

    // For tokens without tokenId (backward compatibility), 
    // check if there's an active session that would conflict
    if (!tokenId && user.activeTokenId) {
      console.warn('⚠️ Old token format detected, but user has active session:', userId);
      return res.status(401).json({ 
        error: 'Session expired. Please log in again.',
        code: 'SESSION_UPGRADE_REQUIRED'
      });
    }

    // If token has no tokenId but user has no active session, allow (backward compatibility)
    if (!tokenId && !user.activeTokenId) {
      console.log('⚠️ Legacy token allowed (no session tracking)');
    }

    // ✅ 6. Update last active timestamp (only if token has session tracking)
    if (tokenId && user.activeTokenId === tokenId) {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { lastActive: new Date() }
        });
      } catch (updateErr) {
        console.error('⚠️ Failed to update lastActive:', updateErr.message);
        // Don't fail the request for this
      }
    }

    // ✅ 7. Attach user to request for downstream use
    req.user = user;
    req.tokenId = tokenId;
    
    next();
  } catch (err) {
    console.error('💥 Database error in auth middleware:', err.message);
    return res.status(500).json({ 
      error: 'Internal server error',
      code: 'DATABASE_ERROR'
    });
  }
}