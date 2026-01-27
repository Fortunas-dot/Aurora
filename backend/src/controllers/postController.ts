import { Response } from 'express';
import Post from '../models/Post';
import Notification from '../models/Notification';
import { AuthRequest } from '../middleware/auth';

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
      message: error.message || 'Error fetching posts',
    });
  }
};

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Public
export const getPost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username displayName avatar');

    if (!post) {
      res.status(404).json({
        success: false,
        message: 'Post not found',
      });
      return;
    }

    res.json({
      success: true,
      data: post,
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
    const { content, tags, groupId, images } = req.body;

    const post = await Post.create({
      author: req.userId,
      content,
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
        await Notification.create({
          user: post.author,
          type: 'like',
          relatedUser: userId,
          relatedPost: post._id,
          message: 'liked your post',
        });
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

