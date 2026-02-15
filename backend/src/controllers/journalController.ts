import { Response } from 'express';
import { Types } from 'mongoose';
import JournalEntry, { IJournalEntry, IAIInsights } from '../models/JournalEntry';
import Journal, { IJournal } from '../models/Journal';
import User from '../models/User';
import CalendarEvent from '../models/Calendar';
import { AuthRequest } from '../middleware/auth';
import OpenAI from 'openai';
import { formatCompleteContextForAI } from '../utils/healthInfoFormatter';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ==================== JOURNAL CRUD ====================

// @desc    Create a new journal
// @route   POST /api/journals
// @access  Private
export const createJournal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, isPublic, coverImage, topics } = req.body;

    if (!name || name.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Journal name is required',
      });
      return;
    }

    const journal = await Journal.create({
      name: name.trim(),
      description: description?.trim(),
      owner: req.userId,
      isPublic: isPublic === true,
      coverImage,
      topics: topics && Array.isArray(topics) ? topics.map((t: string) => t.trim().toLowerCase()).filter((t: string) => t.length > 0) : [],
    });

    res.status(201).json({
      success: true,
      data: journal,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating journal',
    });
  }
};

// @desc    Get user's journals
// @route   GET /api/journals
// @access  Private
export const getUserJournals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const query: any = { owner: req.userId };

    const journals = await Journal.find(query)
      .populate('owner', 'username displayName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Journal.countDocuments(query);

    res.json({
      success: true,
      data: journals,
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
      message: error.message || 'Error fetching journals',
    });
  }
};

// @desc    Get public journals
// @route   GET /api/journals/public
// @access  Public
export const getPublicJournals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;

    const query: any = { isPublic: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const journals = await Journal.find(query)
      .populate('owner', 'username displayName avatar')
      .sort({ followersCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Journal.countDocuments(query);

    // Check if current user is following each journal
    const journalsWithFollowStatus = journals.map((journal) => {
      const journalObj = journal.toObject();
      const isFollowing = req.userId ? journal.followers.some((followerId) => followerId.toString() === req.userId) : false;
      return { ...journalObj, isFollowing };
    });

    res.json({
      success: true,
      data: journalsWithFollowStatus,
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
      message: error.message || 'Error fetching public journals',
    });
  }
};

// @desc    Get single journal
// @route   GET /api/journals/:id
// @access  Private (if private) or Public (if public)
export const getJournal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const journal = await Journal.findById(req.params.id)
      .populate('owner', 'username displayName avatar')
      .populate('followers', 'username displayName avatar');

    if (!journal) {
      res.status(404).json({
        success: false,
        message: 'Journal not found',
      });
      return;
    }

    // Check access
    if (!journal.isPublic && journal.owner.toString() !== req.userId) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    const journalObj = journal.toObject();
    const isFollowing = req.userId ? journal.followers.some((followerId) => followerId.toString() === req.userId) : false;
    const isOwner = journal.owner.toString() === req.userId;

    res.json({
      success: true,
      data: { ...journalObj, isFollowing, isOwner },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching journal',
    });
  }
};

// @desc    Update journal
// @route   PUT /api/journals/:id
// @access  Private (owner only)
export const updateJournal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const journal = await Journal.findById(req.params.id);

    if (!journal) {
      res.status(404).json({
        success: false,
        message: 'Journal not found',
      });
      return;
    }

    if (journal.owner.toString() !== req.userId) {
      res.status(403).json({
        success: false,
        message: 'Not authorized to update this journal',
      });
      return;
    }

    const { name, description, isPublic, coverImage, topics } = req.body;

    if (name !== undefined) journal.name = name.trim();
    if (description !== undefined) journal.description = description?.trim();
    if (isPublic !== undefined) journal.isPublic = isPublic;
    if (coverImage !== undefined) journal.coverImage = coverImage;
    if (topics !== undefined) {
      journal.topics = Array.isArray(topics) 
        ? topics.map((t: string) => t.trim().toLowerCase()).filter((t: string) => t.length > 0)
        : [];
    }

    await journal.save();

    res.json({
      success: true,
      data: journal,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating journal',
    });
  }
};

// @desc    Delete journal
// @route   DELETE /api/journals/:id
// @access  Private (owner only)
export const deleteJournal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const journal = await Journal.findById(req.params.id);

    if (!journal) {
      res.status(404).json({
        success: false,
        message: 'Journal not found',
      });
      return;
    }

    if (journal.owner.toString() !== req.userId) {
      res.status(403).json({
        success: false,
        message: 'Not authorized to delete this journal',
      });
      return;
    }

    // Delete all entries in this journal
    await JournalEntry.deleteMany({ journal: journal._id });

    // Delete the journal
    await Journal.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Journal deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting journal',
    });
  }
};

// @desc    Follow a journal
// @route   POST /api/journals/:id/follow
// @access  Private
export const followJournal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const journal = await Journal.findById(req.params.id);

    if (!journal) {
      res.status(404).json({
        success: false,
        message: 'Journal not found',
      });
      return;
    }

    if (!journal.isPublic) {
      res.status(403).json({
        success: false,
        message: 'Cannot follow private journal',
      });
      return;
    }

    if (journal.owner.toString() === req.userId) {
      res.status(400).json({
        success: false,
        message: 'Cannot follow your own journal',
      });
      return;
    }

    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (journal.followers.some((followerId) => followerId.toString() === req.userId)) {
      res.status(400).json({
        success: false,
        message: 'Already following this journal',
      });
      return;
    }

    journal.followers.push(new Types.ObjectId(req.userId));
    await journal.save();

    res.json({
      success: true,
      data: journal,
      message: 'Journal followed successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error following journal',
    });
  }
};

// @desc    Unfollow a journal
// @route   POST /api/journals/:id/unfollow
// @access  Private
export const unfollowJournal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const journal = await Journal.findById(req.params.id);

    if (!journal) {
      res.status(404).json({
        success: false,
        message: 'Journal not found',
      });
      return;
    }

    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (!journal.followers.some((followerId) => followerId.toString() === req.userId)) {
      res.status(400).json({
        success: false,
        message: 'Not following this journal',
      });
      return;
    }

    journal.followers = journal.followers.filter(
      (followerId) => followerId.toString() !== req.userId
    );
    await journal.save();

    res.json({
      success: true,
      data: journal,
      message: 'Journal unfollowed successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error unfollowing journal',
    });
  }
};

// @desc    Get followed journals
// @route   GET /api/journals/following
// @access  Private
export const getFollowingJournals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const userIdObjectId = new Types.ObjectId(req.userId);
    const journals = await Journal.find({ followers: userIdObjectId })
      .populate('owner', 'username displayName avatar')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Journal.countDocuments({ followers: userIdObjectId });

    const journalsWithFollowStatus = journals.map((journal) => {
      const journalObj = journal.toObject();
      return { ...journalObj, isFollowing: true };
    });

    res.json({
      success: true,
      data: journalsWithFollowStatus,
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
      message: error.message || 'Error fetching followed journals',
    });
  }
};

// ==================== JOURNAL ENTRY CRUD ====================

// @desc    Get all journal entries for current user
// @route   GET /api/journal
// @access  Private
export const getEntries = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const mood = req.query.mood as string;
    const tag = req.query.tag as string;
    const journalId = req.query.journalId as string;

    const query: any = { author: req.userId };

    // Filter by journal if provided
    if (journalId) {
      query.journal = journalId;
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Mood filter
    if (mood) {
      const moodNum = parseInt(mood);
      if (!isNaN(moodNum)) {
        query.mood = moodNum;
      }
    }

    // Tag filter
    if (tag) {
      query.tags = tag.toLowerCase();
    }

    const entries = await JournalEntry.find(query)
      .populate('journal', 'name isPublic')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await JournalEntry.countDocuments(query);

    res.json({
      success: true,
      data: entries,
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
      message: error.message || 'Error fetching journal entries',
    });
  }
};

// @desc    Get single journal entry
// @route   GET /api/journal/:id
// @access  Private
export const getEntry = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const entry = await JournalEntry.findOne({
      _id: req.params.id,
      author: req.userId,
    }).populate('journal', 'name isPublic');

    if (!entry) {
      res.status(404).json({
        success: false,
        message: 'Journal entry not found',
      });
      return;
    }

    res.json({
      success: true,
      data: entry,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching journal entry',
    });
  }
};

// @desc    Create new journal entry
// @route   POST /api/journal
// @access  Private
export const createEntry = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { content, mood, audioUrl, transcription, symptoms, tags, promptId, promptText, journalId, fontFamily } = req.body;

    if (!content || content.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Content is required',
      });
      return;
    }

    if (!mood || mood < 1 || mood > 10) {
      res.status(400).json({
        success: false,
        message: 'Valid mood rating (1-10) is required',
      });
      return;
    }

    if (!journalId) {
      res.status(400).json({
        success: false,
        message: 'Journal ID is required',
      });
      return;
    }

    // Verify journal exists and belongs to user
    const journal = await Journal.findById(journalId);
    if (!journal) {
      res.status(404).json({
        success: false,
        message: 'Journal not found',
      });
      return;
    }

    if (journal.owner.toString() !== req.userId) {
      res.status(403).json({
        success: false,
        message: 'Not authorized to add entries to this journal',
      });
      return;
    }

    const entry = await JournalEntry.create({
      author: req.userId,
      journal: journalId,
      content: content.trim(),
      mood,
      audioUrl,
      transcription,
      symptoms: symptoms || [],
      tags: tags || [],
      promptId,
      promptText,
      fontFamily: fontFamily || 'palatino', // Default to Palatino if not provided
      isPrivate: !journal.isPublic, // Entry privacy follows journal privacy
    });

    // Update journal entries count
    journal.entriesCount = (journal.entriesCount || 0) + 1;
    await journal.save();

    res.status(201).json({
      success: true,
      data: entry,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating journal entry',
    });
  }
};

// @desc    Update journal entry
// @route   PUT /api/journal/:id
// @access  Private
export const updateEntry = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const entry = await JournalEntry.findOne({
      _id: req.params.id,
      author: req.userId,
    });

    if (!entry) {
      res.status(404).json({
        success: false,
        message: 'Journal entry not found',
      });
      return;
    }

    const { content, mood, symptoms, tags } = req.body;

    if (content !== undefined) entry.content = content.trim();
    if (mood !== undefined) entry.mood = mood;
    if (symptoms !== undefined) entry.symptoms = symptoms;
    if (tags !== undefined) entry.tags = tags;

    await entry.save();

    res.json({
      success: true,
      data: entry,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating journal entry',
    });
  }
};

// @desc    Delete journal entry
// @route   DELETE /api/journal/:id
// @access  Private
export const deleteEntry = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const entry = await JournalEntry.findOne({
      _id: req.params.id,
      author: req.userId,
    });

    if (!entry) {
      res.status(404).json({
        success: false,
        message: 'Journal entry not found',
      });
      return;
    }

    const journalId = entry.journal;

    await JournalEntry.findByIdAndDelete(req.params.id);

    // Update journal entries count
    const journal = await Journal.findById(journalId);
    if (journal) {
      journal.entriesCount = Math.max(0, (journal.entriesCount || 1) - 1);
      await journal.save();
    }

    res.json({
      success: true,
      message: 'Journal entry deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting journal entry',
    });
  }
};

// @desc    Get entries from followed journals
// @route   GET /api/journal/following
// @access  Private
export const getFollowingEntries = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    // Get journals user is following
    const userIdObjectId = new Types.ObjectId(req.userId);
    const followedJournals = await Journal.find({ followers: userIdObjectId }).select('_id');
    const journalIds = followedJournals.map((j) => j._id);

    if (journalIds.length === 0) {
      res.json({
        success: true,
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0,
        },
      });
      return;
    }

    const entries = await JournalEntry.find({
      journal: { $in: journalIds },
      isPrivate: false,
    })
      .populate('author', 'username displayName avatar')
      .populate('journal', 'name isPublic')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await JournalEntry.countDocuments({
      journal: { $in: journalIds },
      isPrivate: false,
    });

    res.json({
      success: true,
      data: entries,
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
      message: error.message || 'Error fetching following entries',
    });
  }
};

// ==================== AI ANALYSIS & INSIGHTS ====================

// @desc    Get insights and patterns
// @route   GET /api/journal/insights
// @access  Private
export const getInsights = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const journalId = req.query.journalId as string;
    
    // Calculate start date more reliably
    // We want to include entries from the last N days INCLUDING today
    // So if days=7, we want entries from 7 days ago (at 00:00:00) until now
    const now = new Date();
    const startDate = new Date(now);
    // Subtract days to get the start date (e.g., 7 days ago for 7-day period)
    startDate.setDate(startDate.getDate() - days);
    // Set to start of day (00:00:00) to include all entries from that day
    startDate.setHours(0, 0, 0, 0);
    startDate.setMinutes(0);
    startDate.setSeconds(0);
    startDate.setMilliseconds(0);

    // Also set end date to end of today to ensure we include all of today's entries
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    // Debug logging
    console.log(`[Insights] Fetching insights for ${days} days. Start date: ${startDate.toISOString()}, End date: ${endDate.toISOString()}, Now: ${now.toISOString()}`);

    const query: any = {
      author: req.userId,
      createdAt: { 
        $gte: startDate,
        $lte: endDate,
      },
    };

    if (journalId) {
      query.journal = journalId;
    }

    const entries = await JournalEntry.find(query).sort({ createdAt: 1 });

    // Debug logging to help diagnose the issue
    if (days === 7) {
      console.log(`[Insights Debug] 7 days query:`, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        startDateLocal: startDate.toLocaleString(),
        endDateLocal: endDate.toLocaleString(),
        query: JSON.stringify(query),
        entriesFound: entries.length,
        entryDates: entries.slice(0, 5).map(e => e.createdAt?.toISOString()),
      });
    }

    if (entries.length === 0) {
      res.json({
        success: true,
        data: {
          totalEntries: 0,
          averageMood: null,
          moodTrend: [],
          topThemes: [],
          commonPatterns: [],
          symptomFrequency: {},
          streakDays: 0,
        },
      });
      return;
    }

    // Calculate average mood
    const totalMood = entries.reduce((sum, entry) => sum + entry.mood, 0);
    const averageMood = totalMood / entries.length;

    // Mood trend (group by date)
    const moodByDate: { [key: string]: number[] } = {};
    entries.forEach((entry) => {
      if (entry.createdAt) {
        const dateKey = entry.createdAt.toISOString().split('T')[0];
        if (!moodByDate[dateKey]) {
          moodByDate[dateKey] = [];
        }
        moodByDate[dateKey].push(entry.mood);
      }
    });

    const moodTrend = Object.entries(moodByDate)
      .map(([date, moods]) => ({
        date,
        mood: moods.reduce((sum, m) => sum + m, 0) / moods.length,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Top themes from AI insights
    const themeCounts: { [key: string]: number } = {};
    entries.forEach((entry) => {
      if (entry.aiInsights?.themes) {
        entry.aiInsights.themes.forEach((theme) => {
          themeCounts[theme] = (themeCounts[theme] || 0) + 1;
        });
      }
    });

    const topThemes = Object.entries(themeCounts)
      .map(([theme, count]) => ({ theme, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Common patterns
    const patternCounts: { [key: string]: number } = {};
    entries.forEach((entry) => {
      if (entry.aiInsights?.cognitivePatterns) {
        entry.aiInsights.cognitivePatterns.forEach((pattern) => {
          patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
        });
      }
    });

    const commonPatterns = Object.entries(patternCounts)
      .map(([pattern, count]) => ({ pattern, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Symptom frequency
    const symptomFrequency: { [key: string]: { count: number; avgSeverity: string } } = {};
    entries.forEach((entry) => {
      entry.symptoms.forEach((symptom) => {
        const key = symptom.type ? `${symptom.condition} (${symptom.type})` : symptom.condition;
        if (!symptomFrequency[key]) {
          symptomFrequency[key] = { count: 0, avgSeverity: symptom.severity };
        }
        symptomFrequency[key].count += 1;
      });
    });

    // Calculate streak
    let streakDays = 0;
    const sortedEntries = [...entries]
      .filter((e) => e.createdAt) // Filter out entries without createdAt
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const entry of sortedEntries) {
      if (!entry.createdAt) continue;
      const entryDate = new Date(entry.createdAt);
      entryDate.setHours(0, 0, 0, 0);

      if (entryDate.getTime() === currentDate.getTime()) {
        streakDays++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (entryDate.getTime() < currentDate.getTime()) {
        break;
      }
    }

    res.json({
      success: true,
      data: {
        totalEntries: entries.length,
        averageMood,
        moodTrend,
        topThemes,
        commonPatterns,
        symptomFrequency,
        streakDays,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching insights',
    });
  }
};

// @desc    Get personalized prompt
// @route   GET /api/journal/prompt
// @access  Private
export const getPrompt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get user's health info and recent entries for context
    const user = await User.findById(req.userId).select('healthInfo');
    const recentEntries = await JournalEntry.find({ author: req.userId })
      .sort({ createdAt: -1 })
      .limit(5);

    const prompts: {
      general: Array<{ id: string; text: string; category: string }>;
      depression: Array<{ id: string; text: string; category: string }>;
      anxiety: Array<{ id: string; text: string; category: string }>;
      bipolar: Array<{ id: string; text: string; category: string }>;
      trauma: Array<{ id: string; text: string; category: string }>;
    } = {
      general: [
        { id: 'gen1', text: 'How are you feeling right now? Describe your emotions without judgment.', category: 'Reflection' },
        { id: 'gen2', text: 'What was the best moment of today, no matter how small?', category: 'Gratitude' },
        { id: 'gen3', text: 'If your current mood was a color, what would it be and why?', category: 'Creative' },
        { id: 'gen4', text: 'What are you worried about right now? Write it down to release it.', category: 'Processing' },
        { id: 'gen5', text: 'What did you do for yourself today?', category: 'Self-Care' },
      ],
      depression: [
        { id: 'dep1', text: 'How was your energy level today on a scale of 1-10? What affected it?', category: 'Symptoms' },
        { id: 'dep2', text: 'Name three things you are grateful for, no matter how small.', category: 'Gratitude' },
        { id: 'dep3', text: 'What activity, no matter how small, brought a bit of joy today?', category: 'Behavioral Activation' },
        { id: 'dep4', text: 'What negative thought came up today? Can you offer an alternative perspective?', category: 'CBT' },
      ],
      anxiety: [
        { id: 'anx1', text: 'What worries came up today? How realistic are they on a scale of 1-10?', category: 'Worry' },
        { id: 'anx2', text: 'Describe a moment of calm today. What made it soothing?', category: 'Grounding' },
        { id: 'anx3', text: 'What physical sensations do you notice when you are anxious? Where in your body do you feel it?', category: 'Body Awareness' },
        { id: 'anx4', text: 'Write about a situation you avoid. What is the worst that could happen?', category: 'Exposure' },
      ],
      bipolar: [
        { id: 'bip1', text: 'How would you describe your mood today? Is there a pattern over the past few days?', category: 'Monitoring' },
        { id: 'bip2', text: 'How was your sleep last night? Do you notice changes in your sleep pattern?', category: 'Sleep' },
        { id: 'bip3', text: 'Do you have a lot of energy or very little? How does this affect your day?', category: 'Energy' },
      ],
      trauma: [
        { id: 'trm1', text: 'What is a safe place in your thoughts where you can go right now?', category: 'Grounding' },
        { id: 'trm2', text: 'What did you do today to take care of yourself?', category: 'Self-Care' },
        { id: 'trm3', text: 'Describe five things you can see right now, four you can hear, three you can feel.', category: 'Grounding' },
      ],
    };

    // Start with general prompts
    let relevantPrompts = [...prompts.general];

    // Add condition-specific prompts based on user's health info
    if (user?.healthInfo) {
      const mentalConditions = user.healthInfo.mentalHealth || [];
      
      mentalConditions.forEach((condition: any) => {
        const conditionName = typeof condition === 'string' ? condition : condition.condition;
        const conditionLower = conditionName.toLowerCase();
        
        if (conditionLower.includes('depress')) {
          relevantPrompts = [...relevantPrompts, ...prompts.depression];
        }
        if (conditionLower.includes('anxiety') || conditionLower.includes('angst')) {
          relevantPrompts = [...relevantPrompts, ...prompts.anxiety];
        }
        if (conditionLower.includes('bipolar') || conditionLower.includes('bipolair')) {
          relevantPrompts = [...relevantPrompts, ...prompts.bipolar];
        }
        if (conditionLower.includes('trauma') || conditionLower.includes('ptsd') || conditionLower.includes('ptss')) {
          relevantPrompts = [...relevantPrompts, ...prompts.trauma];
        }
      });
    }

    // Get recently used prompt IDs to avoid repetition
    const recentPromptIds = recentEntries
      .filter((e) => e.promptId)
      .map((e) => e.promptId);

    // Filter out recently used prompts
    const unusedPrompts = relevantPrompts.filter((p) => !recentPromptIds.includes(p.id));
    
    // Use unused prompts if available, otherwise use all relevant prompts
    const promptPool = unusedPrompts.length > 0 ? unusedPrompts : relevantPrompts;
    
    // Select a random prompt from the pool
    const selectedPrompt = promptPool[Math.floor(Math.random() * promptPool.length)];

    res.json({
      success: true,
      data: selectedPrompt,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching prompt',
    });
  }
};

// @desc    Trigger AI analysis on entry
// @route   POST /api/journal/:id/analyze
// @access  Private
export const analyzeEntry = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const entry = await JournalEntry.findOne({
      _id: req.params.id,
      author: req.userId,
    });

    if (!entry) {
      res.status(404).json({
        success: false,
        message: 'Journal entry not found',
      });
      return;
    }

    if (!openai.apiKey) {
      res.status(500).json({
        success: false,
        message: 'AI analysis not configured',
      });
      return;
    }

    // Get user's health info and upcoming calendar events for context
    const user = await User.findById(req.userId).select('healthInfo');
    const now = new Date();
    const upcomingEvents = await CalendarEvent.find({
      user: req.userId,
      startDate: { $gte: now },
    })
      .sort({ startDate: 1 })
      .limit(10)
      .lean();

    // Format context for AI
    const context = formatCompleteContextForAI(user, undefined, upcomingEvents);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are Aurora, a compassionate AI mental health assistant. Analyze journal entries and provide:
1. Sentiment (positive, neutral, negative, mixed)
2. Key themes (3-5 themes)
3. Cognitive patterns if detected (e.g., negative self-talk, catastrophizing, all-or-nothing thinking)
4. Therapeutic feedback (brief, supportive, non-clinical)
5. Follow-up questions (2-3 questions to encourage reflection)

Be empathetic, supportive, and focus on growth and self-awareness.${context}`,
        },
        {
          role: 'user',
          content: `Analyze this journal entry:\n\nMood: ${entry.mood}/10\n\nContent: ${entry.content}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const responseText = completion.choices[0]?.message?.content || '';
    const insights: IAIInsights = {
      sentiment: 'neutral',
      themes: [],
      cognitivePatterns: [],
      therapeuticFeedback: '',
      followUpQuestions: [],
      analyzedAt: new Date(),
    };

    // Parse AI response (simplified - in production, use structured output)
    try {
      const lines = responseText.split('\n');
      let currentSection = '';

      for (const line of lines) {
        if (line.toLowerCase().includes('sentiment')) {
          if (line.toLowerCase().includes('positive')) insights.sentiment = 'positive';
          else if (line.toLowerCase().includes('negative')) insights.sentiment = 'negative';
          else if (line.toLowerCase().includes('mixed')) insights.sentiment = 'mixed';
        } else if (line.toLowerCase().includes('theme')) {
          currentSection = 'themes';
        } else if (line.toLowerCase().includes('pattern')) {
          currentSection = 'patterns';
        } else if (line.toLowerCase().includes('feedback')) {
          currentSection = 'feedback';
        } else if (line.toLowerCase().includes('question')) {
          currentSection = 'questions';
        } else if (line.trim() && line.trim().startsWith('-')) {
          const item = line.trim().substring(1).trim();
          if (currentSection === 'themes' && insights.themes.length < 5) {
            insights.themes.push(item);
          } else if (currentSection === 'patterns') {
            insights.cognitivePatterns?.push(item);
          } else if (currentSection === 'questions') {
            insights.followUpQuestions?.push(item);
          }
        } else if (currentSection === 'feedback' && line.trim()) {
          insights.therapeuticFeedback = (insights.therapeuticFeedback || '') + line.trim() + ' ';
        }
      }

      insights.therapeuticFeedback = insights.therapeuticFeedback?.trim() || responseText.substring(0, 500);
    } catch (parseError) {
      // Fallback: use raw response
      insights.therapeuticFeedback = responseText.substring(0, 500);
    }

    entry.aiInsights = insights;
    await entry.save();

    res.json({
      success: true,
      data: entry,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error analyzing entry',
    });
  }
};

// @desc    Get journal context for Aurora
// @route   GET /api/journal/aurora-context
// @access  Private
export const getAuroraContext = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    const journalId = req.query.journalId as string;

    const query: any = { author: req.userId };
    if (journalId) {
      query.journal = journalId;
    }

    const entries = await JournalEntry.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('date mood content aiInsights.themes');

    // Get upcoming calendar events for AI context
    const now = new Date();
    const upcomingEvents = await CalendarEvent.find({
      user: req.userId,
      startDate: { $gte: now },
    })
      .sort({ startDate: 1 })
      .limit(10)
      .lean();

    const context = entries.map((entry) => ({
      date: entry.createdAt ? entry.createdAt.toISOString() : new Date().toISOString(),
      mood: entry.mood,
      summary: entry.content.substring(0, 200),
      themes: entry.aiInsights?.themes || [],
      sentiment: entry.aiInsights?.sentiment,
    }));

    res.json({
      success: true,
      data: {
        journalEntries: context,
        calendarEvents: upcomingEvents,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching journal context',
    });
  }
};
