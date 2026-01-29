import jwt from 'jsonwebtoken';

export const generateToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '30d' }
  );
};

export const sanitizeUser = (user: any) => {
  const { password, ...sanitized } = user.toObject ? user.toObject() : user;
  return sanitized;
};





