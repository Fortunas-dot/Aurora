/**
 * Authentication Controller
 * Handles user registration, login, token refresh, and logout
 */

import { Request, Response } from 'express';
import { UserModel } from '../models/User.model';
import { generateTokens, verifyRefreshToken, isValidEmail, isValidPassword } from '../utils/auth.utils';
import { AuthRequest, ApiResponse, AuthTokens } from '../types';

/**
 * Register a new user
 * POST /api/auth/register
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Email and password are required',
      } as ApiResponse);
      return;
    }

    if (!isValidEmail(email)) {
      res.status(400).json({
        success: false,
        error: 'Invalid email format',
      } as ApiResponse);
      return;
    }

    const passwordValidation = isValidPassword(password);
    if (!passwordValidation.valid) {
      res.status(400).json({
        success: false,
        error: 'Invalid password',
        message: passwordValidation.errors.join(', '),
      } as ApiResponse);
      return;
    }

    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'User with this email already exists',
      } as ApiResponse);
      return;
    }

    // Create user
    const user = await UserModel.create(email, password);

    // Generate tokens
    const tokens = generateTokens(user.id, user.email);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
        },
        tokens,
      },
      message: 'User registered successfully',
    } as ApiResponse<{ user: unknown; tokens: AuthTokens }>);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register user',
    } as ApiResponse);
  }
}

/**
 * Login user
 * POST /api/auth/login
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Email and password are required',
      } as ApiResponse);
      return;
    }

    // Find user
    const user = await UserModel.findByEmail(email);
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      } as ApiResponse);
      return;
    }

    // Verify password
    const isPasswordValid = await UserModel.verifyPassword(user, password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      } as ApiResponse);
      return;
    }

    // Generate tokens
    const tokens = generateTokens(user.id, user.email);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
        },
        tokens,
      },
      message: 'Login successful',
    } as ApiResponse<{ user: unknown; tokens: AuthTokens }>);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to login',
    } as ApiResponse);
  }
}

/**
 * Refresh access token using refresh token
 * POST /api/auth/refresh
 */
export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: 'Refresh token is required',
      } as ApiResponse);
      return;
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Verify user still exists
    const user = await UserModel.findById(payload.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not found',
      } as ApiResponse);
      return;
    }

    // Generate new tokens
    const tokens = generateTokens(user.id, user.email);

    res.status(200).json({
      success: true,
      data: { tokens },
      message: 'Tokens refreshed successfully',
    } as ApiResponse<{ tokens: AuthTokens }>);
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid or expired refresh token',
    } as ApiResponse);
  }
}

/**
 * Logout user (client-side should delete tokens)
 * POST /api/auth/logout
 */
export async function logout(req: AuthRequest, res: Response): Promise<void> {
  try {
    // In a stateless JWT system, logout is primarily client-side
    // Server can maintain a blacklist of tokens if needed

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    } as ApiResponse);
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to logout',
    } as ApiResponse);
  }
}

/**
 * Get current user info
 * GET /api/auth/me
 */
export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
      } as ApiResponse);
      return;
    }

    const user = await UserModel.findWithProfile(req.user.userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        profile: user.profile,
      },
    } as ApiResponse);
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user info',
    } as ApiResponse);
  }
}
