/**
 * Session Controller
 * Handles therapy session operations
 */

import { Response } from 'express';
import { SessionModel } from '../models/Session.model';
import { MessageModel } from '../models/Message.model';
import { UserModel } from '../models/User.model';
import { OpenAIService } from '../services/ai/OpenAIService';
import { PromptEngine } from '../services/ai/PromptEngine';
import { AuthRequest, ApiResponse } from '../types';
import { generateEncryptionKey } from '../utils/auth.utils';

/**
 * Create a new therapy session
 * POST /api/sessions
 */
export async function createSession(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
      } as ApiResponse);
      return;
    }

    // Check if user already has an active session
    const activeSession = await SessionModel.findActiveSession(req.user.userId);
    if (activeSession) {
      res.status(400).json({
        success: false,
        error: 'You already have an active session. Please end it before starting a new one.',
        data: { sessionId: activeSession.id },
      } as ApiResponse);
      return;
    }

    // Create new session
    const session = await SessionModel.create(req.user.userId);

    // Get user profile for context
    const userWithProfile = await UserModel.findWithProfile(req.user.userId);
    const profile = userWithProfile?.profile;

    // Generate opening message
    const openingMessage = PromptEngine.buildOpeningMessage();

    // Store opening message
    const encryptionKey = generateEncryptionKey();
    await MessageModel.create(
      session.id,
      'assistant',
      openingMessage,
      encryptionKey
    );

    res.status(201).json({
      success: true,
      data: {
        session: {
          id: session.id,
          startedAt: session.startedAt,
          status: session.status,
        },
        openingMessage,
        encryptionKey, // Send to client for this session
      },
      message: 'Session created successfully',
    } as ApiResponse);
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create session',
    } as ApiResponse);
  }
}

/**
 * Send a message in a session and get AI response
 * POST /api/sessions/:id/message
 */
export async function sendMessage(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
      } as ApiResponse);
      return;
    }

    const { id: sessionId } = req.params;
    const { message, encryptionKey } = req.body;

    if (!message || !encryptionKey) {
      res.status(400).json({
        success: false,
        error: 'Message and encryption key are required',
      } as ApiResponse);
      return;
    }

    // Verify session belongs to user
    const session = await SessionModel.findById(sessionId);
    if (!session || session.userId !== req.user.userId) {
      res.status(404).json({
        success: false,
        error: 'Session not found',
      } as ApiResponse);
      return;
    }

    if (session.status !== 'active') {
      res.status(400).json({
        success: false,
        error: 'Session is not active',
      } as ApiResponse);
      return;
    }

    // Store user message
    await MessageModel.create(sessionId, 'user', message, encryptionKey);

    // Get conversation history
    const messages = await MessageModel.getSessionMessages(sessionId, encryptionKey);
    const conversationHistory = messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    // Get user profile for context
    const userWithProfile = await UserModel.findWithProfile(req.user.userId);
    const profile = userWithProfile?.profile as any;

    // Generate AI response (streaming)
    const aiMessages = PromptEngine.buildMessages(
      profile,
      conversationHistory.slice(0, -1), // Exclude the message we just added
      message
    );

    // For now, use non-streaming response
    // TODO: Implement WebSocket streaming for real-time responses
    const aiResponse = await OpenAIService.generateCompletion(aiMessages);

    // Store AI response
    await MessageModel.create(sessionId, 'assistant', aiResponse, encryptionKey);

    res.status(200).json({
      success: true,
      data: {
        response: aiResponse,
      },
      message: 'Message sent successfully',
    } as ApiResponse);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message',
    } as ApiResponse);
  }
}

/**
 * End a therapy session
 * PUT /api/sessions/:id/end
 */
export async function endSession(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
      } as ApiResponse);
      return;
    }

    const { id: sessionId } = req.params;
    const { encryptionKey } = req.body;

    if (!encryptionKey) {
      res.status(400).json({
        success: false,
        error: 'Encryption key is required',
      } as ApiResponse);
      return;
    }

    // Verify session belongs to user
    const session = await SessionModel.findById(sessionId);
    if (!session || session.userId !== req.user.userId) {
      res.status(404).json({
        success: false,
        error: 'Session not found',
      } as ApiResponse);
      return;
    }

    // Get conversation text
    const conversationText = await MessageModel.getConversationText(
      sessionId,
      encryptionKey
    );

    // Generate summary and extract insights
    const [summary, insightsData] = await Promise.all([
      OpenAIService.generateSessionSummary(conversationText),
      OpenAIService.extractInsights(conversationText),
    ]);

    // Extract key themes
    const keyThemes = insightsData.insights
      .filter((i: any) => i.importanceScore >= 7)
      .map((i: any) => i.content)
      .slice(0, 5);

    // End session
    const updatedSession = await SessionModel.endSession(
      sessionId,
      summary,
      keyThemes
    );

    // TODO: Store insights in database
    // TODO: Update user profile with new patterns

    res.status(200).json({
      success: true,
      data: {
        session: updatedSession,
        summary,
        insights: insightsData.insights,
      },
      message: 'Session ended successfully',
    } as ApiResponse);
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end session',
    } as ApiResponse);
  }
}

/**
 * Get session details
 * GET /api/sessions/:id
 */
export async function getSession(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
      } as ApiResponse);
      return;
    }

    const { id: sessionId } = req.params;

    const session = await SessionModel.findById(sessionId);
    if (!session || session.userId !== req.user.userId) {
      res.status(404).json({
        success: false,
        error: 'Session not found',
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: session,
    } as ApiResponse);
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get session',
    } as ApiResponse);
  }
}

/**
 * Get user's sessions
 * GET /api/sessions
 */
export async function getSessions(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
      } as ApiResponse);
      return;
    }

    const limit = parseInt(req.query.limit as string) || 10;
    const sessions = await SessionModel.findByUserId(req.user.userId, limit);

    res.status(200).json({
      success: true,
      data: sessions,
    } as ApiResponse);
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sessions',
    } as ApiResponse);
  }
}
