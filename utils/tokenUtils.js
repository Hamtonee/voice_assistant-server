import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

export const generateAccessToken = (user) => {
  return jwt.sign(
    { 
      userId: user.userId || user.id, 
      email: user.email,
      tokenId: user.tokenId // 🔥 Essential for session tracking
    },
    ACCESS_SECRET,
    { expiresIn: '15m' }
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    { 
      userId: user.userId || user.id, 
      email: user.email,
      tokenId: user.tokenId, // 🔥 Essential for session tracking
      type: 'refresh' // 🔥 Mark as refresh token
    },
    REFRESH_SECRET,
    { expiresIn: '30d' }
  );
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, ACCESS_SECRET);
};

export const verifyRefreshToken = (token) => {
  const payload = jwt.verify(token, REFRESH_SECRET);
  
  // Optional: Ensure it's actually a refresh token (for new tokens)
  // This provides backward compatibility with existing tokens
  if (payload.type && payload.type !== 'refresh') {
    throw new Error('Not a refresh token');
  }
  
  return payload;
};