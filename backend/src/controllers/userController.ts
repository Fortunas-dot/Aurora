import { Response } from 'express';
import User from '../models/User';
import Post from '../models/Post';
import { AuthRequest } from '../middleware/auth';
import { sanitizeUser } from '../utils/helpers';

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Public
export const getUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Get post count
    const postCount = await Post.countDocuments({ author: req.params.id });

    // Public profile data
    const publicProfile = {
      _id: user._id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      bio: user.bio,
      createdAt: user.createdAt,
      postCount,
      // Only show email if user opted in
      ...(user.showEmail && { email: user.email }),
    };

    res.json({
      success: true,
      data: publicProfile,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching user profile',
    });
  }
};

// @desc    Update own profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { username, displayName, bio, avatar, isAnonymous, showEmail } = req.body;

    // Check if username is taken (if changing)
    if (username) {
      const existingUser = await User.findOne({
        username,
        _id: { $ne: req.userId },
      });

      if (existingUser) {
        res.status(400).json({
          success: false,
          message: 'Username already taken',
        });
        return;
      }
    }

    const updateData: any = {};
    if (username !== undefined) updateData.username = username;
    if (displayName !== undefined) updateData.displayName = displayName;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (isAnonymous !== undefined) updateData.isAnonymous = isAnonymous;
    if (showEmail !== undefined) updateData.showEmail = showEmail;

    const user = await User.findByIdAndUpdate(
      req.userId,
      updateData,
      { new: true, runValidators: true }
    );

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
      message: error.message || 'Error updating profile',
    });
  }
};

// @desc    Search users
// @route   GET /api/users/search
// @access  Public
export const searchUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const query = req.query.q as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    if (!query || query.length < 2) {
      res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters',
      });
      return;
    }

    const users = await User.find({
      username: { $regex: query, $options: 'i' },
    })
      .select('username displayName avatar bio')
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments({
      username: { $regex: query, $options: 'i' },
    });

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error searching users',
    });
  }
};

// @desc    Get user's posts
// @route   GET /api/users/:id/posts
// @access  Public
export const getUserPosts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ 
      author: req.params.id,
      groupId: null, // Only public posts
    })
      .populate('author', 'username displayName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({ 
      author: req.params.id,
      groupId: null,
    });

    res.json({
      success: true,
      data: posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching user posts',
    });
  }
};

