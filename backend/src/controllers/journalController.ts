import { Response } from 'express';
import JournalEntry, { IJournalEntry, IAIInsights } from '../models/JournalEntry';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    const query: any = { author: req.userId };

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
    });

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

// @desc    Create journal entry
// @route   POST /api/journal
// @access  Private
export const createEntry = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { content, audioUrl, transcription, mood, symptoms, tags, promptId, promptText } = req.body;

    const entry = await JournalEntry.create({
      author: req.userId,
      content,
      audioUrl,
      transcription,
      mood,
      symptoms: symptoms || [],
      tags: tags || [],
      promptId,
      promptText,
    });

    // Trigger AI analysis in background (don't await)
    analyzeEntryBackground(entry._id.toString());

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
    const { content, mood, symptoms, tags } = req.body;

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

    // Update fields
    if (content !== undefined) entry.content = content;
    if (mood !== undefined) entry.mood = mood;
    if (symptoms !== undefined) entry.symptoms = symptoms;
    if (tags !== undefined) entry.tags = tags;

    await entry.save();

    // Re-analyze if content changed
    if (content !== undefined) {
      analyzeEntryBackground(entry._id.toString());
    }

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
    const entry = await JournalEntry.findOneAndDelete({
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

    res.json({
      success: true,
      message: 'Journal entry deleted',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting journal entry',
    });
  }
};

// @desc    Get journal insights and patterns
// @route   GET /api/journal/insights
// @access  Private
export const getInsights = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get entries from the specified time period
    const entries = await JournalEntry.find({
      author: req.userId,
      createdAt: { $gte: startDate },
    }).sort({ createdAt: -1 });

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
    const moodSum = entries.reduce((sum, entry) => sum + entry.mood, 0);
    const averageMood = moodSum / entries.length;

    // Mood trend (daily averages)
    const moodByDay: { [key: string]: { sum: number; count: number } } = {};
    entries.forEach((entry) => {
      const day = entry.createdAt.toISOString().split('T')[0];
      if (!moodByDay[day]) {
        moodByDay[day] = { sum: 0, count: 0 };
      }
      moodByDay[day].sum += entry.mood;
      moodByDay[day].count += 1;
    });

    const moodTrend = Object.entries(moodByDay)
      .map(([date, { sum, count }]) => ({
        date,
        mood: Math.round((sum / count) * 10) / 10,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Extract themes from AI insights
    const themeCounts: { [key: string]: number } = {};
    entries.forEach((entry) => {
      if (entry.aiInsights?.themes) {
        entry.aiInsights.themes.forEach((theme) => {
          themeCounts[theme] = (themeCounts[theme] || 0) + 1;
        });
      }
    });

    const topThemes = Object.entries(themeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([theme, count]) => ({ theme, count }));

    // Extract cognitive patterns
    const patternCounts: { [key: string]: number } = {};
    entries.forEach((entry) => {
      if (entry.aiInsights?.cognitivePatterns) {
        entry.aiInsights.cognitivePatterns.forEach((pattern) => {
          patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
        });
      }
    });

    const commonPatterns = Object.entries(patternCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pattern, count]) => ({ pattern, count }));

    // Symptom frequency
    const symptomFrequency: { [key: string]: { count: number; avgSeverity: string } } = {};
    entries.forEach((entry) => {
      entry.symptoms.forEach((symptom) => {
        const key = symptom.type ? `${symptom.condition} (${symptom.type})` : symptom.condition;
        if (!symptomFrequency[key]) {
          symptomFrequency[key] = { count: 0, avgSeverity: 'moderate' };
        }
        symptomFrequency[key].count += 1;
      });
    });

    // Calculate streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let streakDays = 0;
    const entriesSet = new Set(entries.map((e) => e.createdAt.toISOString().split('T')[0]));
    
    for (let i = 0; i < days; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      if (entriesSet.has(dateStr)) {
        streakDays++;
      } else if (i > 0) {
        break;
      }
    }

    res.json({
      success: true,
      data: {
        totalEntries: entries.length,
        averageMood: Math.round(averageMood * 10) / 10,
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

// @desc    Analyze a journal entry with AI
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

    // Get user's health info for context
    const user = await User.findById(req.userId);
    const healthContext = user?.healthInfo ? formatHealthContext(user.healthInfo) : '';

    const insights = await performAIAnalysis(entry.content, healthContext);
    
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

// @desc    Get personalized journal prompt
// @route   GET /api/journal/prompt
// @access  Private
export const getPrompt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get user's health info
    const user = await User.findById(req.userId);
    
    // Get recent entries for context
    const recentEntries = await JournalEntry.find({ author: req.userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('content mood createdAt aiInsights');

    const prompt = await generatePersonalizedPrompt(user?.healthInfo, recentEntries);

    res.json({
      success: true,
      data: prompt,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error generating prompt',
    });
  }
};

// @desc    Get recent entries for Aurora context
// @route   GET /api/journal/aurora-context
// @access  Private
export const getAuroraContext = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    
    const entries = await JournalEntry.find({ author: req.userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('content mood symptoms aiInsights createdAt');

    // Format for Aurora context
    const context = entries.map((entry) => ({
      date: entry.createdAt.toISOString().split('T')[0],
      mood: entry.mood,
      summary: entry.content.substring(0, 200) + (entry.content.length > 200 ? '...' : ''),
      themes: entry.aiInsights?.themes || [],
      sentiment: entry.aiInsights?.sentiment,
    }));

    res.json({
      success: true,
      data: context,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching Aurora context',
    });
  }
};

// Helper function: Background AI analysis
async function analyzeEntryBackground(entryId: string): Promise<void> {
  try {
    const entry = await JournalEntry.findById(entryId).populate('author');
    if (!entry) return;

    const author = await User.findById(entry.author);
    const healthContext = author?.healthInfo ? formatHealthContext(author.healthInfo) : '';

    const insights = await performAIAnalysis(entry.content, healthContext);
    
    entry.aiInsights = insights;
    await entry.save();
  } catch (error) {
    console.error('Background analysis failed:', error);
  }
}

// Helper function: Format health context
function formatHealthContext(healthInfo: any): string {
  const parts: string[] = [];

  if (healthInfo.mentalHealth?.length > 0) {
    parts.push(`Mental health: ${healthInfo.mentalHealth.map((h: any) => 
      typeof h === 'string' ? h : `${h.condition}${h.type ? ` (${h.type})` : ''}`
    ).join(', ')}`);
  }

  if (healthInfo.physicalHealth?.length > 0) {
    parts.push(`Physical health: ${healthInfo.physicalHealth.map((h: any) => 
      typeof h === 'string' ? h : `${h.condition}${h.type ? ` (${h.type})` : ''}`
    ).join(', ')}`);
  }

  return parts.join('. ');
}

// Helper function: Perform AI analysis
async function performAIAnalysis(content: string, healthContext: string): Promise<IAIInsights> {
  try {
    const systemPrompt = `Je bent een therapeutische AI-assistent die dagboekentries analyseert. Analyseer de volgende dagboekentry en geef gestructureerde inzichten terug.

${healthContext ? `Context over de gebruiker: ${healthContext}` : ''}

Geef je analyse in het volgende JSON-formaat:
{
  "sentiment": "positive" | "neutral" | "negative" | "mixed",
  "themes": ["thema1", "thema2"],
  "cognitivePatterns": ["patroon1", "patroon2"],
  "therapeuticFeedback": "korte, empathische feedback in het Nederlands",
  "followUpQuestions": ["vraag1", "vraag2"]
}

Wees empathisch en begripvol. Focus op:
- Identificeer emotionele thema's
- Herken cognitieve patronen (zwart-wit denken, catastroferen, etc.)
- Geef ondersteunende, niet-oordelende feedback
- Stel doordachte vervolgvragen`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: content },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 500,
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{}');

    return {
      sentiment: result.sentiment || 'neutral',
      themes: result.themes || [],
      cognitivePatterns: result.cognitivePatterns || [],
      therapeuticFeedback: result.therapeuticFeedback || '',
      followUpQuestions: result.followUpQuestions || [],
      analyzedAt: new Date(),
    };
  } catch (error) {
    console.error('AI analysis error:', error);
    return {
      sentiment: 'neutral',
      themes: [],
      analyzedAt: new Date(),
    };
  }
}

// Helper function: Generate personalized prompt
async function generatePersonalizedPrompt(
  healthInfo: any,
  recentEntries: IJournalEntry[]
): Promise<{ id: string; text: string; category: string }> {
  // Predefined prompts categorized by type
  const prompts = {
    general: [
      { id: 'gen1', text: 'Hoe voel je je op dit moment? Beschrijf je emoties zonder oordeel.', category: 'Reflectie' },
      { id: 'gen2', text: 'Wat was het beste moment van vandaag, hoe klein ook?', category: 'Dankbaarheid' },
      { id: 'gen3', text: 'Als je huidige stemming een kleur was, welke zou het zijn en waarom?', category: 'Creatief' },
      { id: 'gen4', text: 'Waar maak je je op dit moment zorgen over? Schrijf het van je af.', category: 'Verwerking' },
      { id: 'gen5', text: 'Wat heb je vandaag voor jezelf gedaan?', category: 'Zelfzorg' },
    ],
    depression: [
      { id: 'dep1', text: 'Hoe was je energieniveau vandaag op een schaal van 1-10? Wat heeft het beïnvloed?', category: 'Symptomen' },
      { id: 'dep2', text: 'Noem drie dingen waar je dankbaar voor bent, hoe klein ook.', category: 'Dankbaarheid' },
      { id: 'dep3', text: 'Welke activiteit, hoe klein ook, bracht vandaag een beetje vreugde?', category: 'Gedragsactivatie' },
      { id: 'dep4', text: 'Welke negatieve gedachte kwam vandaag naar boven? Kun je er een alternatief perspectief op geven?', category: 'CBT' },
    ],
    anxiety: [
      { id: 'anx1', text: 'Welke zorgen kwamen vandaag op? Hoe realistisch zijn ze op een schaal van 1-10?', category: 'Bezorgdheid' },
      { id: 'anx2', text: 'Beschrijf een moment van kalmte vandaag. Wat maakte het rustgevend?', category: 'Grounding' },
      { id: 'anx3', text: 'Welke fysieke sensaties merk je op wanneer je angstig bent? Waar in je lichaam voel je het?', category: 'Lichaamsbewustzijn' },
      { id: 'anx4', text: 'Schrijf over een situatie die je vermijdt. Wat is het ergste dat zou kunnen gebeuren?', category: 'Exposure' },
    ],
    bipolar: [
      { id: 'bip1', text: 'Hoe zou je je stemming vandaag omschrijven? Is er een patroon de afgelopen dagen?', category: 'Monitoring' },
      { id: 'bip2', text: 'Hoe was je slaap afgelopen nacht? Merk je veranderingen in je slaappatroon?', category: 'Slaap' },
      { id: 'bip3', text: 'Heb je veel energie of juist weinig? Hoe beïnvloedt dit je dag?', category: 'Energie' },
    ],
    trauma: [
      { id: 'trm1', text: 'Wat is een veilige plek in je gedachten waar je nu naartoe kunt gaan?', category: 'Grounding' },
      { id: 'trm2', text: 'Wat heb je vandaag gedaan om voor jezelf te zorgen?', category: 'Zelfzorg' },
      { id: 'trm3', text: 'Beschrijf vijf dingen die je nu kunt zien, vier die je kunt horen, drie die je kunt voelen.', category: 'Grounding' },
    ],
  };

  // Determine which prompts to use based on health info
  let relevantPrompts = [...prompts.general];

  if (healthInfo) {
    const mentalConditions = healthInfo.mentalHealth || [];
    
    mentalConditions.forEach((condition: any) => {
      const conditionName = typeof condition === 'string' ? condition : condition.condition;
      const conditionLower = conditionName.toLowerCase();

      if (conditionLower.includes('depress')) {
        relevantPrompts = [...relevantPrompts, ...prompts.depression];
      }
      if (conditionLower.includes('angst') || conditionLower.includes('anxiety')) {
        relevantPrompts = [...relevantPrompts, ...prompts.anxiety];
      }
      if (conditionLower.includes('bipolair') || conditionLower.includes('bipolar')) {
        relevantPrompts = [...relevantPrompts, ...prompts.bipolar];
      }
      if (conditionLower.includes('trauma') || conditionLower.includes('ptss') || conditionLower.includes('ptsd')) {
        relevantPrompts = [...relevantPrompts, ...prompts.trauma];
      }
    });
  }

  // Filter out recently used prompts
  const recentPromptIds = recentEntries
    .filter((e) => e.promptId)
    .map((e) => e.promptId);
  
  const unusedPrompts = relevantPrompts.filter((p) => !recentPromptIds.includes(p.id));
  
  // Select random prompt from unused, or all if all have been used
  const promptPool = unusedPrompts.length > 0 ? unusedPrompts : relevantPrompts;
  const selectedPrompt = promptPool[Math.floor(Math.random() * promptPool.length)];

  return selectedPrompt;
}





