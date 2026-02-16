import { Request, Response } from 'express';
import User from '../models/User';
import { generateToken, sanitizeUser } from '../utils/helpers';
import { AuthRequest } from '../middleware/auth';
import { getRandomCharacter } from '../utils/characters';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, username, displayName } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: existingUser.email === email 
          ? 'Email already registered' 
          : 'Username already taken',
      });
      return;
    }

    // Create user with random avatar character
    const user = await User.create({
      email,
      password,
      username,
      displayName: displayName || username,
      avatarCharacter: getRandomCharacter(),
    });

    // Generate token
    const token = generateToken(user._id.toString());

    res.status(201).json({
      success: true,
      data: {
        user: sanitizeUser(user),
        token,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration',
    });
  }
};

// @desc    Check username availability
// @route   GET /api/auth/check-username?username=foo
// @access  Public
export const checkUsername = async (req: Request, res: Response): Promise<void> => {
  try {
    const username = (req.query.username as string | undefined)?.trim();

    if (!username) {
      res.status(400).json({
        success: false,
        message: 'Username is required',
      });
      return;
    }

    // Basic validation should mirror registration rules
    if (username.length < 3 || username.length > 30) {
      res.status(400).json({
        success: false,
        message: 'Username must be between 3 and 30 characters',
      });
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      res.status(400).json({
        success: false,
        message: 'Username can only contain letters, numbers, and underscores',
      });
      return;
    }

    const existingUser = await User.findOne({ username }).select('_id').lean();

    res.json({
      success: true,
      data: {
        available: !existingUser,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while checking username',
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
      return;
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
      return;
    }

    // Generate token
    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      data: {
        user: sanitizeUser(user),
        token,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during login',
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.json({
      success: true,
      data: sanitizeUser(user),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Logout user (client-side token removal)
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
};

// @desc    Login/Register with Facebook
// @route   POST /api/auth/facebook
// @access  Public
export const facebookAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { accessToken, email, name, facebookId, picture } = req.body;

    if (!accessToken) {
      res.status(400).json({
        success: false,
        message: 'Facebook access token is required',
      });
      return;
    }

    // Try to find existing user by email or Facebook ID
    let user = await User.findOne({
      $or: [
        { email: email?.toLowerCase() },
        { 'facebookId': facebookId },
      ],
    });

    if (user) {
      // User exists, update Facebook ID if not set
      if (!user.facebookId && facebookId) {
        user.facebookId = facebookId;
        await user.save();
      }

      // Update avatar if provided and user doesn't have one
      if (picture?.data?.url && !user.avatar) {
        user.avatar = picture.data.url;
        await user.save();
      }

      // Assign character if user doesn't have one
      if (!user.avatarCharacter) {
        user.avatarCharacter = getRandomCharacter();
        await user.save();
      }
    } else {
      // Create new user
      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email is required for Facebook registration',
        });
        return;
      }

      // Generate username from email or name
      const baseUsername = name?.toLowerCase().replace(/\s+/g, '_') || email.split('@')[0];
      let username = baseUsername;
      let counter = 1;

      // Ensure unique username
      while (await User.findOne({ username })) {
        username = `${baseUsername}_${counter}`;
        counter++;
      }

      // Create user without password (Facebook users don't need password)
      const userData: any = {
        email: email.toLowerCase(),
        username,
        displayName: name || username,
        avatar: picture?.data?.url,
        avatarCharacter: getRandomCharacter(), // Assign random character
        facebookId,
        isAnonymous: false,
      };
      
      // Only add password if not a Facebook user (shouldn't happen, but safety check)
      if (!facebookId) {
        userData.password = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
      }
      
      user = await User.create(userData);
    }

    // Generate token
    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      data: {
        user: sanitizeUser(user),
        token,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during Facebook authentication',
    });
  }
};







