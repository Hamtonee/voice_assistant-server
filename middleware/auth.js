import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

/**
 * 🔒 JWT Authentication Middleware 
 *
 * - Verifies the Bearer token in Authorization header.
 * - Loads the user from the database (excluding password).
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

  // ✅ 3. Extract user ID from payload
  const userId = payload.userId || payload.id || payload.sub;

  if (!userId) {
    console.error('⚠️ Token payload missing userId or id:', payload);
    return res.status(401).json({ 
      error: 'Invalid token payload',
      code: 'INVALID_PAYLOAD'
    });
  }

  // ✅ 4. Fetch user from database using correct AuthUser model
  try {
    const user = await prisma.authUser.findUnique({
      where: { id: Number(userId) },
      select: {
        id: true,
        email: true,
        full_name: true,
        is_active: true,
        is_verified: true,
        created_at: true,
        last_login: true,
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

    // ✅ 5. Check if user is active
    if (!user.is_active) {
      console.warn('⚠️ Inactive user attempted access:', userId);
      return res.status(401).json({ 
        error: 'Account is inactive',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    console.log('✅ User authenticated successfully:', {
      userId: user.id,
      email: user.email,
      isActive: user.is_active
    });

    // ✅ 6. Attach user to request for downstream use
    req.user = {
      id: user.id,
      email: user.email,
      name: user.full_name,
      isActive: user.is_active,
      isVerified: user.is_verified,
      createdAt: user.created_at,
      lastLogin: user.last_login
    };
    
    next();
  } catch (err) {
    console.error('💥 Database error in auth middleware:', err.message);
    return res.status(500).json({ 
      error: 'Internal server error',
      code: 'DATABASE_ERROR'
    });
  }
}