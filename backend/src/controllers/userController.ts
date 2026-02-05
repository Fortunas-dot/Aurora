import { Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Post from '../models/Post';
import Notification from '../models/Notification';
import { AuthRequest } from '../middleware/auth';
import { sanitizeUser } from '../utils/helpers';
import { sendNotificationToUser, sendUnreadCountUpdate } from './notificationWebSocket';

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

    // Get followers and following count
    const followersCount = await User.countDocuments({ following: req.params.id });
    const followingCount = user.following.length;

    // Get engagement stats
    const totalLikes = await Post.aggregate([
      { $match: { author: new mongoose.Types.ObjectId(req.params.id) } },
      { $project: { likesCount: { $size: '$likes' } } },
      { $group: { _id: null, total: { $sum: '$likesCount' } } },
    ]);
    const totalLikesCount = totalLikes[0]?.total || 0;

    const totalComments = await Post.aggregate([
      { $match: { author: new mongoose.Types.ObjectId(req.params.id) } },
      { $group: { _id: null, total: { $sum: '$commentsCount' } } },
    ]);
    const totalCommentsCount = totalComments[0]?.total || 0;

    // Check if current user is following this user
    let isFollowing = false;
    if (req.userId) {
      const currentUser = await User.findById(req.userId);
      isFollowing = currentUser?.following.some(
        (id) => id.toString() === req.params.id
      ) || false;
    }

    // Public profile data
    const publicProfile = {
      _id: user._id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      bio: user.bio,
      createdAt: user.createdAt || new Date(), // Ensure createdAt exists
      postCount,
      followersCount,
      followingCount,
      totalLikes: totalLikesCount,
      totalComments: totalCommentsCount,
      isFollowing,
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
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/2b25c5b5-3faf-43ea-844d-1c98148740b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'userController.ts:88',message:'updateProfile entry',data:{userId:req.userId,bodyKeys:Object.keys(req.body),hasPassword:'password' in req.body,passwordValue:req.body.password},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H2,H4'})}).catch(()=>{});
    // #endregion
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
    if (req.body.healthInfo !== undefined) updateData.healthInfo = req.body.healthInfo;

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/2b25c5b5-3faf-43ea-844d-1c98148740b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'userController.ts:119',message:'before updateOne',data:{updateDataKeys:Object.keys(updateData),hasPasswordInUpdate:'password' in updateData},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H4'})}).catch(()=>{});
    // #endregion

    // Use updateOne instead of findByIdAndUpdate to avoid triggering document middleware
    // This prevents the pre-validate hook from running
    const updateResult = await User.updateOne(
      { _id: req.userId },
      { $set: updateData }
    );

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/2b25c5b5-3faf-43ea-844d-1c98148740b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'userController.ts:122',message:'after updateOne',data:{matchedCount:updateResult.matchedCount,modifiedCount:updateResult.modifiedCount},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion

    if (updateResult.matchedCount === 0) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Fetch the updated user
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/2b25c5b5-3faf-43ea-844d-1c98148740b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'userController.ts:133',message:'before findById',data:{userId:req.userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
    const user = await User.findById(req.userId);

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/2b25c5b5-3faf-43ea-844d-1c98148740b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'userController.ts:135',message:'after findById',data:{userFound:!!user,hasFacebookId:!!user?.facebookId,hasPassword:!!user?.password},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion

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
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/2b25c5b5-3faf-43ea-844d-1c98148740b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'userController.ts:147',message:'updateProfile error',data:{errorMessage:error.message,errorStack:error.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H2,H3,H4,H5'})}).catch(()=>{});
    // #endregion
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
      .populate('groupId', 'name description tags memberCount isPrivate avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Filter out posts with invalid IDs or missing author
    const validPosts = posts.filter((post: any) => {
      if (!post || !post._id) return false;
      const postId = post._id.toString();
      if (!/^[0-9a-fA-F]{24}$/.test(postId)) return false;
      if (!post.author || !post.author._id) return false;
      return true;
    });

    // Format group info
    const postsWithGroup = validPosts.map((post: any) => {
      const postObj = post.toObject();
      // Ensure createdAt exists, fallback to current date if missing
      if (!postObj.createdAt) {
        postObj.createdAt = new Date();
      }
      return {
        ...postObj,
        group: post.groupId ? {
          _id: post.groupId._id,
          name: post.groupId.name,
          description: post.groupId.description,
          tags: post.groupId.tags,
          memberCount: post.groupId.memberCount,
          isPrivate: post.groupId.isPrivate,
          avatar: post.groupId.avatar,
        } : undefined,
      };
    });

    const total = validPosts.length;

    res.json({
      success: true,
      data: postsWithGroup,
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

// @desc    Follow/Unfollow user
// @route   POST /api/users/:id/follow
// @access  Private
export const followUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/2b25c5b5-3faf-43ea-844d-1c98148740b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'userController.ts:295',message:'followUser entry',data:{currentUserId:req.userId,targetUserId:req.params.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
    const targetUserId = req.params.id;
    const currentUserId = req.userId!;

    if (targetUserId === currentUserId) {
      res.status(400).json({
        success: false,
        message: 'Cannot follow yourself',
      });
      return;
    }

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    if (!currentUser || !targetUser) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/2b25c5b5-3faf-43ea-844d-1c98148740b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'userController.ts:308',message:'before user.save in followUser',data:{hasFacebookId:!!currentUser.facebookId,hasPassword:!!currentUser.password,isNew:currentUser.isNew},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion

    const isFollowing = currentUser.following.some(
      (id) => id.toString() === targetUserId
    );

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(
        (id) => id.toString() !== targetUserId
      );
      await currentUser.save();

      res.json({
        success: true,
        message: 'Unfollowed successfully',
        isFollowing: false,
      });
    } else {
      // Follow
      currentUser.following.push(targetUserId as any);
      await currentUser.save();

      // Create notification
      const notification = await Notification.create({
        user: targetUserId,
        type: 'follow',
        relatedUser: currentUserId,
        message: 'started following you',
      });

      await notification.populate('relatedUser', 'username displayName avatar');

      // Send notification via WebSocket
      await sendNotificationToUser(targetUserId, notification);
      await sendUnreadCountUpdate(targetUserId);

      res.json({
        success: true,
        message: 'Followed successfully',
        isFollowing: true,
      });
    }
  } catch (error: any) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/2b25c5b5-3faf-43ea-844d-1c98148740b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'userController.ts:360',message:'followUser error',data:{errorMessage:error.message,errorStack:error.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
    res.status(500).json({
      success: false,
      message: error.message || 'Error following/unfollowing user',
    });
  }
};

// @desc    Get user's followers
// @route   GET /api/users/:id/followers
// @access  Public
export const getFollowers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const followers = await User.find({ following: req.params.id })
      .select('username displayName avatar bio')
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments({ following: req.params.id });

    res.json({
      success: true,
      data: followers,
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
      message: error.message || 'Error fetching followers',
    });
  }
};

// @desc    Get users that a user is following
// @route   GET /api/users/:id/following
// @access  Public
export const getFollowing = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).populate('following', 'username displayName avatar bio');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const following = user.following.slice(skip, skip + limit) as any[];

    res.json({
      success: true,
      data: following,
      pagination: {
        page,
        limit,
        total: user.following.length,
        pages: Math.ceil(user.following.length / limit),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching following',
    });
  }
};

// @desc    Register push notification token
// @route   POST /api/users/push-token
// @access  Private
export const registerPushToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/2b25c5b5-3faf-43ea-844d-1c98148740b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'userController.ts:444',message:'registerPushToken entry',data:{userId:req.userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
    const { token, deviceId, platform } = req.body;

    if (!token || !deviceId) {
      res.status(400).json({
        success: false,
        message: 'Token and deviceId are required',
      });
      return;
    }

    // Use findOneAndUpdate to avoid version conflicts
    // First, remove existing token for this device
    await User.findOneAndUpdate(
      { _id: req.userId },
      { $pull: { pushTokens: { deviceId } } },
      { new: false }
    );

    // Then add the new token
    const updatedUser = await User.findOneAndUpdate(
      { _id: req.userId },
      {
        $push: {
          pushTokens: {
            token,
            deviceId,
            platform: platform || 'web',
            createdAt: new Date(),
          },
        },
      },
      { new: true, runValidators: false }
    );

    if (!updatedUser) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/2b25c5b5-3faf-43ea-844d-1c98148740b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'userController.ts:478',message:'after user.save in registerPushToken',data:{success:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion

    res.json({
      success: true,
      message: 'Push token registered',
    });
  } catch (error: any) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/2b25c5b5-3faf-43ea-844d-1c98148740b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'userController.ts:484',message:'registerPushToken error',data:{errorMessage:error.message,errorStack:error.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
    res.status(500).json({
      success: false,
      message: error.message || 'Error registering push token',
    });
  }
};

