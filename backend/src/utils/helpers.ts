import jwt from 'jsonwebtoken';

export const generateToken = (userId: string): string => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not configured. Cannot generate token.');
  }

  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

export const sanitizeUser = (user: any) => {
  const { password, ...sanitized } = user.toObject ? user.toObject() : user;
  return sanitized;
};

/**
 * Escape special regex characters in a string to prevent regex injection attacks
 * This ensures user input is treated as literal text, not as a regex pattern
 * @param str - The string to escape
 * @returns The escaped string safe for use in MongoDB $regex queries
 */
export const escapeRegex = (str: string): string => {
  if (typeof str !== 'string') {
    return '';
  }
  // Escape all special regex characters: . * + ? ^ $ { } ( ) | [ ] \
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};







