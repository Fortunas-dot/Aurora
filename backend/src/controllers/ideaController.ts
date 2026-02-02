import { Response } from 'express';
import Idea from '../models/Idea';
import Comment from '../models/Comment';
import { AuthRequest } from '../middleware/auth';

// @desc    Get all ideas
// @route   GET /api/ideas
// @access  Public
export const getIdeas = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy as string || 'recent'; // recent, popular, trending
    const category = req.query.category as string;
    const status = req.query.status as string;

    let query: any = {};
    if (category && category !== 'all') {
      query.category = category;
    }
    if (status && status !== 'all') {
      query.status = status;
    }

    let ideas;
    if (sortBy === 'popular' || sortBy === 'trending') {
      // For popular/trending, we need to calculate vote score and sort
      const allIdeas = await Idea.find(query)
        .populate('author', 'username displayName avatar')
        .lean();
      
      // Calculate vote score and sort
      const ideasWithScore = allIdeas.map((idea: any) => ({
        ...idea,
        voteScore: idea.upvotes.length - idea.downvotes.length,
      }));
      
      ideasWithScore.sort((a: any, b: any) => {
        if (b.voteScore !== a.voteScore) {
          return b.voteScore - a.voteScore;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      // Apply pagination
      ideas = ideasWithScore.slice(skip, skip + limit);
    } else {
      // Recent: simple date sort
      ideas = await Idea.find(query)
        .populate('author', 'username displayName avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    }

    // Check if user has voted
    let ideasWithVotes = ideas;
    if (req.userId) {
      ideasWithVotes = ideas.map((idea: any) => {
        const ideaObj = idea.toObject ? idea.toObject() : idea;
        ideaObj.hasUpvoted = idea.upvotes.some(
          (id: any) => id.toString() === req.userId
        );
        ideaObj.hasDownvoted = idea.downvotes.some(
          (id: any) => id.toString() === req.userId
        );
        if (!ideaObj.voteScore) {
          ideaObj.voteScore = idea.upvotes.length - idea.downvotes.length;
        }
        return ideaObj;
      });
    } else {
      ideasWithVotes = ideas.map((idea: any) => {
        const ideaObj = idea.toObject ? idea.toObject() : idea;
        ideaObj.hasUpvoted = false;
        ideaObj.hasDownvoted = false;
        if (!ideaObj.voteScore) {
          ideaObj.voteScore = idea.upvotes.length - idea.downvotes.length;
        }
        return ideaObj;
      });
    }

    // For popular/trending, total is the length of all matching ideas
    // For recent, use countDocuments
    const total = (sortBy === 'popular' || sortBy === 'trending')
      ? (await Idea.find(query).lean()).length
      : await Idea.countDocuments(query);

    res.json({
      success: true,
      data: ideasWithVotes,
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
      message: error.message || 'Error fetching ideas',
    });
  }
};

// @desc    Get single idea
// @route   GET /api/ideas/:id
// @access  Public
export const getIdea = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const idea = await Idea.findById(req.params.id)
      .populate('author', 'username displayName avatar');

    if (!idea) {
      res.status(404).json({
        success: false,
        message: 'Idea not found',
      });
      return;
    }

    const ideaObj: any = idea.toObject();
    if (req.userId) {
      ideaObj.hasUpvoted = idea.upvotes.some(
        (id: any) => id.toString() === req.userId
      );
      ideaObj.hasDownvoted = idea.downvotes.some(
        (id: any) => id.toString() === req.userId
      );
    } else {
      ideaObj.hasUpvoted = false;
      ideaObj.hasDownvoted = false;
    }
    ideaObj.voteScore = idea.upvotes.length - idea.downvotes.length;

    res.json({
      success: true,
      data: ideaObj,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching idea',
    });
  }
};

// @desc    Create idea
// @route   POST /api/ideas
// @access  Private
export const createIdea = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, category } = req.body;

    if (!title || !description) {
      res.status(400).json({
        success: false,
        message: 'Title and description are required',
      });
      return;
    }

    const idea = await Idea.create({
      author: req.userId,
      title,
      description,
      category: category || 'feature',
    });

    await idea.populate('author', 'username displayName avatar');

    const ideaObj: any = idea.toObject();
    ideaObj.hasUpvoted = false;
    ideaObj.hasDownvoted = false;
    ideaObj.voteScore = 0;

    res.status(201).json({
      success: true,
      data: ideaObj,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating idea',
    });
  }
};

// @desc    Upvote idea
// @route   POST /api/ideas/:id/upvote
// @access  Private
export const upvoteIdea = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const idea = await Idea.findById(req.params.id);

    if (!idea) {
      res.status(404).json({
        success: false,
        message: 'Idea not found',
      });
      return;
    }

    const userId = req.userId!;
    const hasUpvoted = idea.upvotes.some((id: any) => id.toString() === userId);
    const hasDownvoted = idea.downvotes.some((id: any) => id.toString() === userId);

    if (hasUpvoted) {
      // Remove upvote
      idea.upvotes = idea.upvotes.filter((id: any) => id.toString() !== userId);
    } else {
      // Add upvote
      idea.upvotes.push(userId as any);
      // Remove downvote if exists
      if (hasDownvoted) {
        idea.downvotes = idea.downvotes.filter((id: any) => id.toString() !== userId);
      }
    }

    await idea.save();

    res.json({
      success: true,
      data: {
        hasUpvoted: !hasUpvoted,
        hasDownvoted: false,
        upvotesCount: idea.upvotes.length,
        downvotesCount: idea.downvotes.length,
        voteScore: idea.upvotes.length - idea.downvotes.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error upvoting idea',
    });
  }
};

// @desc    Downvote idea
// @route   POST /api/ideas/:id/downvote
// @access  Private
export const downvoteIdea = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const idea = await Idea.findById(req.params.id);

    if (!idea) {
      res.status(404).json({
        success: false,
        message: 'Idea not found',
      });
      return;
    }

    const userId = req.userId!;
    const hasUpvoted = idea.upvotes.some((id: any) => id.toString() === userId);
    const hasDownvoted = idea.downvotes.some((id: any) => id.toString() === userId);

    if (hasDownvoted) {
      // Remove downvote
      idea.downvotes = idea.downvotes.filter((id: any) => id.toString() !== userId);
    } else {
      // Add downvote
      idea.downvotes.push(userId as any);
      // Remove upvote if exists
      if (hasUpvoted) {
        idea.upvotes = idea.upvotes.filter((id: any) => id.toString() !== userId);
      }
    }

    await idea.save();

    res.json({
      success: true,
      data: {
        hasUpvoted: false,
        hasDownvoted: !hasDownvoted,
        upvotesCount: idea.upvotes.length,
        downvotesCount: idea.downvotes.length,
        voteScore: idea.upvotes.length - idea.downvotes.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error downvoting idea',
    });
  }
};

// @desc    Update idea status (admin only - can be added later)
// @route   PUT /api/ideas/:id/status
// @access  Private
export const updateIdeaStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;

    if (!['open', 'in-progress', 'completed', 'rejected'].includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
      return;
    }

    const idea = await Idea.findById(req.params.id);

    if (!idea) {
      res.status(404).json({
        success: false,
        message: 'Idea not found',
      });
      return;
    }

    idea.status = status;
    await idea.save();

    res.json({
      success: true,
      data: idea,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating idea status',
    });
  }
};

