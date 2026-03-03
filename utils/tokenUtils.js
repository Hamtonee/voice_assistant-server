import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user.userId || user.id,
      email: user.email,
      tokenId: user.tokenId
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
      tokenId: user.tokenId,
      type: 'refresh'
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

  if (payload.type && payload.type !== 'refresh') {
    throw new Error('Not a refresh token');
  }

  return payload;
};
