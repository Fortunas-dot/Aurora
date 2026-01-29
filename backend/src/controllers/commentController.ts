import { Response } from 'express';
import Comment from '../models/Comment';
import Post from '../models/Post';
import Notification from '../models/Notification';
import { AuthRequest } from '../middleware/auth';

// @desc    Get comments for a post
// @route   GET /api/comments/post/:postId
// @access  Public
export const getComments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const comments = await Comment.find({ post: req.params.postId })
      .populate('author', 'username displayName avatar')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Comment.countDocuments({ post: req.params.postId });

    res.json({
      success: true,
      data: comments,
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
      message: error.message || 'Error fetching comments',
    });
  }
};

// @desc    Create comment
// @route   POST /api/comments
// @access  Private
export const createComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { postId, content } = req.body;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      res.status(404).json({
        success: false,
        message: 'Post not found',
      });
      return;
    }

    const comment = await Comment.create({
      post: postId,
      author: req.userId,
      content,
    });

    // Update post comment count
    post.commentsCount += 1;
    await post.save();

    // Create notification if not own post
    if (post.author.toString() !== req.userId) {
      await Notification.create({
        user: post.author,
        type: 'comment',
        relatedUser: req.userId,
        relatedPost: postId,
        message: 'commented on your post',
      });
    }

    await comment.populate('author', 'username displayName avatar');

    res.status(201).json({
      success: true,
      data: comment,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating comment',
    });
  }
};

// @desc    Update comment
// @route   PUT /api/comments/:id
// @access  Private
export const updateComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { content } = req.body;

    let comment = await Comment.findById(req.params.id);

    if (!comment) {
      res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
      return;
    }

    // Check ownership
    if (comment.author.toString() !== req.userId) {
      res.status(403).json({
        success: false,
        message: 'Not authorized to update this comment',
      });
      return;
    }

    comment = await Comment.findByIdAndUpdate(
      req.params.id,
      { content },
      { new: true, runValidators: true }
    ).populate('author', 'username displayName avatar');

    res.json({
      success: true,
      data: comment,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating comment',
    });
  }
};

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private
export const deleteComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
      return;
    }

    // Check ownership
    if (comment.author.toString() !== req.userId) {
      res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment',
      });
      return;
    }

    // Update post comment count
    await Post.findByIdAndUpdate(comment.post, {
      $inc: { commentsCount: -1 },
    });

    await comment.deleteOne();

    res.json({
      success: true,
      message: 'Comment deleted',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting comment',
    });
  }
};

// @desc    Like/unlike comment
// @route   POST /api/comments/:id/like
// @access  Private
export const likeComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
      return;
    }

    const userId = req.userId!;
    const likeIndex = comment.likes.findIndex(
      (id) => id.toString() === userId
    );

    if (likeIndex === -1) {
      comment.likes.push(userId as any);
    } else {
      comment.likes.splice(likeIndex, 1);
    }

    await comment.save();

    res.json({
      success: true,
      data: {
        likes: comment.likes.length,
        isLiked: likeIndex === -1,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error liking comment',
    });
  }
};

// @desc    Report comment
// @route   POST /api/comments/:id/report
// @access  Private
export const reportComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { reason } = req.body;

    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
      return;
    }

    const alreadyReported = comment.reports.some(
      (r) => r.user.toString() === req.userId
    );

    if (alreadyReported) {
      res.status(400).json({
        success: false,
        message: 'You have already reported this comment',
      });
      return;
    }

    comment.reports.push({
      user: req.userId as any,
      reason,
      createdAt: new Date(),
    });

    await comment.save();

    res.json({
      success: true,
      message: 'Comment reported',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error reporting comment',
    });
  }
};





