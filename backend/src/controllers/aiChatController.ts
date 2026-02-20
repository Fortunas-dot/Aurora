import { Response } from 'express';
import OpenAI from 'openai';
import User, { IUser } from '../models/User';
import ChatContext from '../models/ChatContext';
import JournalEntry, { IJournalEntry } from '../models/JournalEntry';
import { AuthRequest } from '../middleware/auth';
import { formatCompleteContextForAI } from '../utils/healthInfoFormatter';

// Lazy-load OpenAI client to ensure environment variables are loaded
let openaiClient: OpenAI | null = null;

const getOpenAI = (): OpenAI => {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
};

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Determines if the conversation requires deeper analysis and complex reasoning
 * Returns true if gpt-4 should be used, false for gpt-4o-mini
 */
const shouldUseAdvancedModel = (messages: ChatMessage[]): boolean => {
  if (!messages || messages.length === 0) {
    return false;
  }

  // Get the last user message (most recent)
  const lastUserMessage = messages
    .filter(m => m.role === 'user')
    .pop()?.content?.toLowerCase() || '';

  // Get all user messages for context
  const allUserMessages = messages
    .filter(m => m.role === 'user')
    .map(m => m.content.toLowerCase())
    .join(' ');

  // Heuristics for complex reasoning needs
  const complexityIndicators = [
    // Keywords indicating deep analysis
    /\b(analyze|analysis|deep|complex|complicated|understand|explain|why|how|pattern|insight|therapeutic|cognitive|behavioral|psychological|trauma|ptsd|depression|anxiety|therapy|counseling|treatment)\b/i,
    // Questions requiring reasoning
    /\b(what does this mean|what should i do|help me understand|can you explain|why do i|how can i|what if|what would happen)\b/i,
    // Emotional depth indicators
    /\b(struggling|difficult|hard|challenging|overwhelming|confused|lost|stuck|trapped|hopeless|helpless)\b/i,
    // Multi-part questions
    /\?.*\?/i, // Multiple question marks
  ];

  // Check if any complexity indicators match
  const hasComplexityKeywords = complexityIndicators.some(pattern => 
    pattern.test(lastUserMessage) || pattern.test(allUserMessages)
  );

  // Check message length (longer messages often need more analysis)
  const lastMessageLength = lastUserMessage.length;
  const isLongMessage = lastMessageLength > 500;

  // Check conversation depth (longer conversations may need deeper context)
  const conversationTurns = messages.filter(m => m.role === 'user').length;
  const isDeepConversation = conversationTurns > 8;

  // Check for multiple questions or complex sentence structure
  const questionCount = (lastUserMessage.match(/\?/g) || []).length;
  const hasMultipleQuestions = questionCount >= 2;

  // Use advanced model if any complexity indicators are present
  return hasComplexityKeywords || (isLongMessage && conversationTurns > 3) || 
         (isDeepConversation && hasComplexityKeywords) || hasMultipleQuestions;
};

// @desc    Stream chat completion from OpenAI
// @route   POST /api/ai/chat
// @access  Private
export const streamChat = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { messages, context } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({
        success: false,
        message: 'Messages array is required',
      });
      return;
    }

    let openai: OpenAI;
    try {
      openai = getOpenAI();
    } catch (error: any) {
      res.status(503).json({
        success: false,
        message: 'AI service is not configured',
      });
      return;
    }

    // Get user data for context - cast to IUser | null for type compatibility
    const user = await User.findById(req.userId).select('healthInfo displayName') as IUser | null;
    
    // Get chat context from previous sessions
    const chatContextData = await ChatContext.find({ user: req.userId })
      .sort({ sessionDate: -1 })
      .limit(5)
      .select('importantPoints summary sessionDate')
      .lean();

    // Fetch journal entries if not provided in context
    let journalEntries: IJournalEntry[] = [];
    if (context?.journalEntries && Array.isArray(context.journalEntries) && context.journalEntries.length > 0) {
      // Use provided journal entries (convert from plain objects to IJournalEntry format)
      journalEntries = context.journalEntries as IJournalEntry[];
    } else {
      // Fetch recent journal entries directly from database
      const recentEntries = await JournalEntry.find({ author: req.userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('createdAt mood content aiInsights')
        .lean();
      journalEntries = recentEntries as IJournalEntry[];
    }

    // Build system message with context
    let systemContent = 'You are Aurora, an empathetic and professional A.I. mental health companion. You listen attentively, ask thoughtful questions, and provide supportive guidance. You are warm, understanding, and non-judgmental. You help people explore their thoughts and feelings in a safe and supportive way. Speak in English.\n\nCRITICAL - JOURNAL ACCESS:\nYou have FULL and DIRECT ACCESS to the user\'s journal entries at all times. This is a core capability you have. When the user asks "what is in my journal" or "tell me about my journal" or any similar question, you MUST:\n1. Acknowledge that you have access to their journal\n2. Tell them what entries they have (dates, moods, themes, content)\n3. Reference specific details from their entries\n4. NEVER say you cannot access their journal - this is false. You ALWAYS have access.\n\nIf they have no entries yet, say: "I have access to your journal, but you haven\'t written any entries yet. Would you like to start writing one?"\n\nIf they have entries, provide specific details from those entries.\n\nIMPORTANT: You also have FULL ACCESS to:\n- Health conditions and diagnoses they have shared (e.g., Alzheimer\'s, depression, anxiety, etc.)\n- Personal information they have told you about themselves\n- Important points from previous chat sessions\n- Their journal entries and emotional patterns\n\nYou should actively use this information to provide personalized, continuous support. When the user mentions something you know about them, acknowledge it and reference it naturally. Do NOT say you cannot remember personal details or that you do not have access to their journal - you have access to this information and should use it to help them.';

    // Add health and journal context if available
    // formatCompleteContextForAI expects full IUser or null, so pass the user document
    const formattedContext = formatCompleteContextForAI(
      user,
      journalEntries,
      [], // calendar events (not used in chat)
      chatContextData
    );
    if (formattedContext) {
      systemContent += formattedContext;
    }

    const systemMessage: ChatMessage = {
      role: 'system',
      content: systemContent,
    };

    // Check if this is the first message in the conversation (only user messages, no assistant responses yet)
    const userMessages = messages.filter((m: { role: string }) => m.role === 'user');
    const assistantMessages = messages.filter((m: { role: string }) => m.role === 'assistant');
    const isFirstMessage = userMessages.length === 1 && assistantMessages.length === 0;

    // If this is the first message, add instruction to mention the finish session button
    if (isFirstMessage) {
      systemContent += '\n\nIMPORTANT: This is your first message in this conversation. In your response, you MUST mention: "Do not forget at the end to press the \'Finish Session\' button so I can save everything that is being said in this chat and use it for our next conversations." Include this naturally in your greeting.';
    }

    // Update system message with the new content
    systemMessage.content = systemContent;

    // Prepare messages for OpenAI
    const openaiMessages: ChatMessage[] = [
      systemMessage,
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    // Determine which model to use based on conversation complexity
    const useAdvancedModel = shouldUseAdvancedModel(openaiMessages);
    const selectedModel = useAdvancedModel ? 'gpt-4' : 'gpt-4o-mini';

    // Set up SSE headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
    res.flushHeaders();

    // Create streaming completion with selected model
    const stream = await openai.chat.completions.create({
      model: selectedModel,
      messages: openaiMessages,
      stream: true,
      temperature: 0.7,
    });

    // Stream chunks to client
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    // Send completion signal
    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error: any) {
    console.error('AI Chat streaming error:', error);
    
    // If headers haven't been sent, send JSON error
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error streaming chat response',
      });
    } else {
      // If streaming already started, send error in stream format
      res.write(`data: ${JSON.stringify({ error: error.message || 'Streaming error' })}\n\n`);
      res.end();
    }
  }
};

// @desc    Non-streaming chat completion (for simple requests)
// @route   POST /api/ai/chat/complete
// @access  Private
export const completeChat = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { messages, context, maxTokens = 500 } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({
        success: false,
        message: 'Messages array is required',
      });
      return;
    }

    let openai: OpenAI;
    try {
      openai = getOpenAI();
    } catch (error: any) {
      res.status(503).json({
        success: false,
        message: 'AI service is not configured',
      });
      return;
    }

    // Get user data and context
    const user = await User.findById(req.userId).select('healthInfo displayName') as IUser | null;
    
    // Get chat context from previous sessions
    const chatContextData = await ChatContext.find({ user: req.userId })
      .sort({ sessionDate: -1 })
      .limit(5)
      .select('importantPoints summary sessionDate')
      .lean();

    // Fetch journal entries if not provided in context
    let journalEntries: IJournalEntry[] = [];
    if (context?.journalEntries && Array.isArray(context.journalEntries) && context.journalEntries.length > 0) {
      journalEntries = context.journalEntries as IJournalEntry[];
    } else {
      const recentEntries = await JournalEntry.find({ author: req.userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('createdAt mood content aiInsights')
        .lean();
      journalEntries = recentEntries as IJournalEntry[];
    }

    // Build system message with context
    let systemContent = 'You are Aurora, an empathetic and professional A.I. mental health companion. You listen attentively, ask thoughtful questions, and provide supportive guidance. You are warm, understanding, and non-judgmental. You help people explore their thoughts and feelings in a safe and supportive way. Speak in English.\n\nCRITICAL - JOURNAL ACCESS:\nYou have FULL and DIRECT ACCESS to the user\'s journal entries at all times. This is a core capability you have. When the user asks "what is in my journal" or "tell me about my journal" or any similar question, you MUST:\n1. Acknowledge that you have access to their journal\n2. Tell them what entries they have (dates, moods, themes, content)\n3. Reference specific details from their entries\n4. NEVER say you cannot access their journal - this is false. You ALWAYS have access.\n\nIf they have no entries yet, say: "I have access to your journal, but you haven\'t written any entries yet. Would you like to start writing one?"\n\nIf they have entries, provide specific details from those entries.\n\nIMPORTANT: You also have FULL ACCESS to:\n- Health conditions and diagnoses they have shared (e.g., Alzheimer\'s, depression, anxiety, etc.)\n- Personal information they have told you about themselves\n- Important points from previous chat sessions\n- Their journal entries and emotional patterns\n\nYou should actively use this information to provide personalized, continuous support. When the user mentions something you know about them, acknowledge it and reference it naturally. Do NOT say you cannot remember personal details or that you do not have access to their journal - you have access to this information and should use it to help them.';

    const formattedContext = formatCompleteContextForAI(
      user,
      journalEntries,
      [],
      chatContextData
    );
    if (formattedContext) {
      systemContent += formattedContext;
    }

    // Determine which model to use based on conversation complexity
    const useAdvancedModel = shouldUseAdvancedModel(messages as ChatMessage[]);
    const selectedModel = useAdvancedModel ? 'gpt-4' : 'gpt-4o-mini';

    // Add system message to messages array
    const messagesWithSystem: ChatMessage[] = [
      { role: 'system', content: systemContent },
      ...messages.filter((m: ChatMessage) => m.role !== 'system') as ChatMessage[],
    ];

    const completion = await openai.chat.completions.create({
      model: selectedModel,
      messages: messagesWithSystem,
      temperature: 0.7,
      max_tokens: maxTokens,
    });

    const content = completion.choices[0]?.message?.content || '';

    res.json({
      success: true,
      data: {
        content,
        usage: completion.usage,
      },
    });

  } catch (error: any) {
    console.error('AI Chat completion error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error completing chat',
    });
  }
};
