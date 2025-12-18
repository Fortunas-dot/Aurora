/**
 * Authentication Utilities
 * JWT token generation, validation, and password hashing
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { JWTPayload, AuthTokens } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Compare a password with its hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate JWT access and refresh tokens
 */
export function generateTokens(userId: string, email: string): AuthTokens {
  const accessPayload: JWTPayload = {
    userId,
    email,
    type: 'access',
  };

  const refreshPayload: JWTPayload = {
    userId,
    email,
    type: 'refresh',
  };

  const accessToken = jwt.sign(accessPayload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  const refreshToken = jwt.sign(refreshPayload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });

  return { accessToken, refreshToken };
}

/**
 * Verify and decode JWT access token
 */
export function verifyAccessToken(token: string): JWTPayload {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;

    if (payload.type !== 'access') {
      throw new Error('Invalid token type');
    }

    return payload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Verify and decode JWT refresh token
 */
export function verifyRefreshToken(token: string): JWTPayload {
  try {
    const payload = jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;

    if (payload.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    return payload;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}

/**
 * Generate a random encryption key for user data
 * Returns a 256-bit (32-byte) key in hex format
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * Requirements: min 8 characters, at least one uppercase, one lowercase, one number
 */
export function isValidPassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
