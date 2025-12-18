/**
 * Authentication Middleware
 * Validates JWT tokens and protects routes
 */

import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/auth.utils';
import { AuthRequest } from '../types';

/**
 * Middleware to verify JWT token and attach user to request
 */
export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No token provided',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify and decode token
    const payload = verifyAccessToken(token);

    // Attach user info to request
    req.user = {
      userId: payload.userId,
      email: payload.email,
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error instanceof Error ? error.message : 'Invalid token',
    });
  }
}

/**
 * Optional authentication - doesn't fail if no token
 */
export function optionalAuthenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = verifyAccessToken(token);

      req.user = {
        userId: payload.userId,
        email: payload.email,
      };
    }
  } catch (error) {
    // Silently fail - user remains undefined
  }

  next();
}
