import { Response } from 'express';
import OpenAI from 'openai';
import User from '../models/User';
import ChatContext from '../models/ChatContext';
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

    // Get user data for context
    const user = await User.findById(req.userId).select('healthInfo displayName');
    
    // Get chat context from previous sessions
    const chatContextData = await ChatContext.find({ user: req.userId })
      .sort({ sessionDate: -1 })
      .limit(5)
      .select('importantPoints summary')
      .lean();

    // Build system message with context
    let systemContent = 'You are Aurora, an empathetic and professional A.I. mental health companion. You listen attentively, ask thoughtful questions, and provide supportive guidance. You are warm, understanding, and non-judgmental. You help people explore their thoughts and feelings in a safe and supportive way. Speak in English.';

    // Add health and journal context if provided
    if (context?.healthInfo || context?.journalEntries) {
      const formattedContext = formatCompleteContextForAI(
        user ? { healthInfo: user.healthInfo } : null,
        context?.journalEntries || [],
        chatContextData
      );
      if (formattedContext) {
        systemContent += formattedContext;
      }
    }

    const systemMessage: ChatMessage = {
      role: 'system',
      content: systemContent,
    };

    // Prepare messages for OpenAI
    const openaiMessages: ChatMessage[] = [
      systemMessage,
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    // Set up SSE headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
    res.flushHeaders();

    // Create streaming completion
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
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
    const { messages, maxTokens = 500 } = req.body;

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

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages as ChatMessage[],
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
