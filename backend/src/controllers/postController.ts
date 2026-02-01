import { Response } from 'express';
import Post from '../models/Post';
import User from '../models/User';
import Notification from '../models/Notification';
import { AuthRequest } from '../middleware/auth';
import { sendNotificationToUser, sendUnreadCountUpdate } from './notificationWebSocket';

// @desc    Get all posts (feed)
// @route   GET /api/posts
// @access  Public
export const getPosts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const tag = req.query.tag as string;
    const groupId = req.query.groupId as string;
    const postType = req.query.postType as string;
    const sortBy = req.query.sortBy as string || 'newest';

    const query: any = {};
    
    if (tag) {
      query.tags = tag.toLowerCase();
    }
    
    if (groupId) {
      query.groupId = groupId;
    } else {
      // Public feed - no group posts
      query.groupId = null;
    }

    if (postType && ['post', 'question', 'story'].includes(postType)) {
      query.postType = postType;
    }

    // Determine sort order
    let sortOption: any = { createdAt: -1 }; // default: newest
    if (sortBy === 'popular') {
      sortOption = { likes: -1, createdAt: -1 };
    } else if (sortBy === 'discussed') {
      sortOption = { commentsCount: -1, createdAt: -1 };
    }

    const posts = await Post.find(query)
      .populate('author', 'username displayName avatar')
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments(query);

    // Add isSaved status if user is authenticated
    let postsWithSavedStatus = posts;
    if (req.userId) {
      const user = await User.findById(req.userId);
      if (user && user.savedPosts) {
        const savedPostIds = user.savedPosts.map((id) => id.toString());
        postsWithSavedStatus = posts.map((post: any) => ({
          ...post.toObject(),
          isSaved: savedPostIds.includes(post._id.toString()),
        }));
      }
    }

    res.json({
      success: true,
      data: postsWithSavedStatus,
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
      message: error.message || 'Error fetching posts',
    });
  }
};

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Public
export const getPost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format (24 hex characters)
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid post ID format',
      });
      return;
    }

    const post = await Post.findById(id)
      .populate('author', 'username displayName avatar');

    if (!post) {
      res.status(404).json({
        success: false,
        message: 'Post not found',
      });
      return;
    }

    // Add isSaved status if user is authenticated
    let postWithSavedStatus: any = post.toObject();
    if (req.userId) {
      const user = await User.findById(req.userId);
      if (user && user.savedPosts) {
        const savedPostIds = user.savedPosts.map((id) => id.toString());
        postWithSavedStatus.isSaved = savedPostIds.includes(post._id.toString());
      }
    }

    res.json({
      success: true,
      data: postWithSavedStatus,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching post',
    });
  }
};

// @desc    Create post
// @route   POST /api/posts
// @access  Private
export const createPost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { content, tags, groupId, images, postType } = req.body;

    const post = await Post.create({
      author: req.userId,
      content,
      postType: postType || 'post',
      tags: tags || [],
      images: images || [],
      groupId: groupId || null,
    });

    await post.populate('author', 'username displayName avatar');

    res.status(201).json({
      success: true,
      data: post,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating post',
    });
  }
};

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private
export const updatePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { content, tags } = req.body;

    let post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404).json({
        success: false,
        message: 'Post not found',
      });
      return;
    }

    // Check ownership
    if (post.author.toString() !== req.userId) {
      res.status(403).json({
        success: false,
        message: 'Not authorized to update this post',
      });
      return;
    }

    post = await Post.findByIdAndUpdate(
      req.params.id,
      { content, tags },
      { new: true, runValidators: true }
    ).populate('author', 'username displayName avatar');

    res.json({
      success: true,
      data: post,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating post',
    });
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
export const deletePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404).json({
        success: false,
        message: 'Post not found',
      });
      return;
    }

    // Check ownership
    if (post.author.toString() !== req.userId) {
      res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post',
      });
      return;
    }

    await post.deleteOne();

    res.json({
      success: true,
      message: 'Post deleted',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting post',
    });
  }
};

// @desc    Like/unlike post
// @route   POST /api/posts/:id/like
// @access  Private
export const likePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404).json({
        success: false,
        message: 'Post not found',
      });
      return;
    }

    const userId = req.userId!;
    const likeIndex = post.likes.findIndex(
      (id) => id.toString() === userId
    );

    if (likeIndex === -1) {
      // Like
      post.likes.push(userId as any);

      // Create notification if not own post
      if (post.author.toString() !== userId) {
        const notification = await Notification.create({
          user: post.author,
          type: 'like',
          relatedUser: userId,
          relatedPost: post._id,
          message: 'liked your post',
        });

        await notification.populate('relatedUser', 'username displayName avatar');
        await notification.populate('relatedPost', 'content');

        // Send notification via WebSocket
        await sendNotificationToUser(post.author.toString(), notification);
        await sendUnreadCountUpdate(post.author.toString());
      }
    } else {
      // Unlike
      post.likes.splice(likeIndex, 1);
    }

    await post.save();

    res.json({
      success: true,
      data: {
        likes: post.likes.length,
        isLiked: likeIndex === -1,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error liking post',
    });
  }
};

// @desc    Report post
// @route   POST /api/posts/:id/report
// @access  Private
export const reportPost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { reason } = req.body;

    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404).json({
        success: false,
        message: 'Post not found',
      });
      return;
    }

    // Check if already reported by this user
    const alreadyReported = post.reports.some(
      (r) => r.user.toString() === req.userId
    );

    if (alreadyReported) {
      res.status(400).json({
        success: false,
        message: 'You have already reported this post',
      });
      return;
    }

    post.reports.push({
      user: req.userId as any,
      reason,
      createdAt: new Date(),
    });

    await post.save();

    res.json({
      success: true,
      message: 'Post reported',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error reporting post',
    });
  }
};

// @desc    Get trending posts (sorted by likes)
// @route   GET /api/posts/trending
// @access  Public
export const getTrendingPosts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const tag = req.query.tag as string;
    const postType = req.query.postType as string;

    const query: any = { groupId: null };
    
    if (tag) {
      query.tags = tag.toLowerCase();
    }

    if (postType && ['post', 'question', 'story'].includes(postType)) {
      query.postType = postType;
    }

    // Get posts from last 7 days, sorted by engagement (likes + comments)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    query.createdAt = { $gte: sevenDaysAgo };

    const posts = await Post.aggregate([
      { $match: query },
      {
        $addFields: {
          engagement: { $add: [{ $size: '$likes' }, '$commentsCount'] }
        }
      },
      { $sort: { engagement: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'author',
          pipeline: [{ $project: { username: 1, displayName: 1, avatar: 1 } }]
        }
      },
      { $unwind: '$author' }
    ]);

    const total = await Post.countDocuments(query);

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
      message: error.message || 'Error fetching trending posts',
    });
  }
};

// @desc    Get posts from followed users
// @route   GET /api/posts/following
// @access  Private
export const getFollowingPosts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const tag = req.query.tag as string;
    const postType = req.query.postType as string;

    // Get the current user's following list
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    const followingIds = user.following || [];

    const query: any = {
      groupId: null,
      author: { $in: followingIds },
    };
    
    if (tag) {
      query.tags = tag.toLowerCase();
    }

    if (postType && ['post', 'question', 'story'].includes(postType)) {
      query.postType = postType;
    }

    const posts = await Post.find(query)
      .populate('author', 'username displayName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments(query);

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
      message: error.message || 'Error fetching following posts',
    });
  }
};

// @desc    Get saved posts
// @route   GET /api/posts/saved
// @access  Private
export const getSavedPosts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Get the current user's saved posts
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    const savedPostIds = user.savedPosts || [];

    const posts = await Post.find({ _id: { $in: savedPostIds } })
      .populate('author', 'username displayName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = savedPostIds.length;

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
      message: error.message || 'Error fetching saved posts',
    });
  }
};

// @desc    Save/unsave post
// @route   POST /api/posts/:id/save
// @access  Private
export const savePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const postId = req.params.id;

    const post = await Post.findById(postId);
    if (!post) {
      res.status(404).json({
        success: false,
        message: 'Post not found',
      });
      return;
    }

    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Initialize savedPosts if not exists
    if (!user.savedPosts) {
      user.savedPosts = [];
    }

    const savedIndex = user.savedPosts.findIndex(
      (id) => id.toString() === postId
    );

    let isSaved: boolean;
    if (savedIndex === -1) {
      // Save post
      user.savedPosts.push(postId as any);
      isSaved = true;
    } else {
      // Unsave post
      user.savedPosts.splice(savedIndex, 1);
      isSaved = false;
    }

    await user.save();

    res.json({
      success: true,
      data: {
        isSaved,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error saving post',
    });
  }
};

// @desc    Search posts
// @route   GET /api/posts/search
// @access  Public
export const searchPosts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const searchQuery = req.query.q as string;
    const postType = req.query.postType as string;

    if (!searchQuery || searchQuery.trim().length < 2) {
      res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters',
      });
      return;
    }

    const query: any = {
      groupId: null,
      $or: [
        { content: { $regex: searchQuery, $options: 'i' } },
        { tags: { $regex: searchQuery, $options: 'i' } },
      ],
    };

    if (postType && ['post', 'question', 'story'].includes(postType)) {
      query.postType = postType;
    }

    const posts = await Post.find(query)
      .populate('author', 'username displayName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments(query);

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
      message: error.message || 'Error searching posts',
    });
  }
};

