/**
 * Voice WebSocket Handler
 * Manages real-time voice streaming connections
 */

import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { VoicePipeline } from '../services/voice/VoicePipeline';
import { Session } from '../models/Session.model';
import { verifyAccessToken } from '../utils/auth.utils';
import type { UserProfile } from '@prisma/client';
import { prisma } from '../utils/prisma';

interface AuthenticatedWebSocket extends WebSocket {
  isAlive?: boolean;
  sessionId?: string;
  userId?: string;
  pipeline?: VoicePipeline;
}

export interface VoiceMessage {
  type: 'AUDIO_DATA' | 'START_RECORDING' | 'STOP_RECORDING' | 'PING';
  data?: any;
}

export interface VoiceResponse {
  type: 'TRANSCRIPT' | 'AI_TEXT' | 'AUDIO_CHUNK' | 'ERROR' | 'COMPLETE' | 'PONG';
  data?: any;
  isFinal?: boolean;
}

export class VoiceSocketHandler {
  private wss: WebSocketServer;
  private activePipelines: Map<string, VoicePipeline>;

  constructor(wss: WebSocketServer) {
    this.wss = wss;
    this.activePipelines = new Map();
    this.setupHeartbeat();
  }

  /**
   * Handle new WebSocket connection
   */
  async handleConnection(ws: AuthenticatedWebSocket, request: IncomingMessage): Promise<void> {
    console.log('[VoiceSocket] New connection attempt');

    try {
      // Extract session ID from URL path
      const url = new URL(request.url || '', `http://${request.headers.host}`);
      const pathParts = url.pathname.split('/');
      const sessionId = pathParts[pathParts.length - 1];

      if (!sessionId) {
        this.sendError(ws, 'Session ID is required');
        ws.close(1008, 'Session ID required');
        return;
      }

      // Authenticate via token in query params
      const token = url.searchParams.get('token');

      if (!token) {
        this.sendError(ws, 'Authentication token is required');
        ws.close(1008, 'Authentication required');
        return;
      }

      let userId: string;
      try {
        const payload = verifyAccessToken(token);
        userId = payload.userId;
      } catch (error) {
        this.sendError(ws, 'Invalid authentication token');
        ws.close(1008, 'Invalid token');
        return;
      }

      // Verify session exists and belongs to user
      const session = await Session.getById(sessionId);

      if (!session) {
        this.sendError(ws, 'Session not found');
        ws.close(1008, 'Session not found');
        return;
      }

      if (session.userId !== userId) {
        this.sendError(ws, 'Unauthorized access to session');
        ws.close(1008, 'Unauthorized');
        return;
      }

      if (session.status !== 'active') {
        this.sendError(ws, 'Session is not active');
        ws.close(1008, 'Session not active');
        return;
      }

      // Attach metadata to WebSocket
      ws.isAlive = true;
      ws.sessionId = sessionId;
      ws.userId = userId;

      console.log(`[VoiceSocket] Authenticated connection for session ${sessionId}`);

      // Get user profile for context
      const userProfile = await prisma.userProfile.findUnique({
        where: { userId },
      });

      // Create voice pipeline
      const pipeline = new VoicePipeline();
      ws.pipeline = pipeline;
      this.activePipelines.set(sessionId, pipeline);

      // Start pipeline with callbacks
      await pipeline.startPipeline(sessionId, userProfile, {
        onTranscript: (transcript, isFinal) => {
          this.sendMessage(ws, {
            type: 'TRANSCRIPT',
            data: transcript,
            isFinal,
          });
        },
        onAIResponse: (text) => {
          this.sendMessage(ws, {
            type: 'AI_TEXT',
            data: text,
          });
        },
        onAudioChunk: (audioData) => {
          this.sendMessage(ws, {
            type: 'AUDIO_CHUNK',
            data: audioData.toString('base64'), // Base64 encode for JSON transport
          });
        },
        onError: (error) => {
          this.sendError(ws, error.message);
        },
        onComplete: () => {
          this.sendMessage(ws, {
            type: 'COMPLETE',
          });
        },
      });

      // Setup message handler
      ws.on('message', (data: Buffer) => {
        this.handleMessage(ws, data);
      });

      // Setup close handler
      ws.on('close', () => {
        this.handleClose(ws);
      });

      // Setup error handler
      ws.on('error', (error) => {
        console.error('[VoiceSocket] WebSocket error:', error);
        this.handleClose(ws);
      });

      // Setup ping/pong for heartbeat
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      console.log(`[VoiceSocket] Connection established for session ${sessionId}`);

    } catch (error: any) {
      console.error('[VoiceSocket] Connection error:', error);
      this.sendError(ws, 'Internal server error');
      ws.close(1011, 'Internal error');
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(ws: AuthenticatedWebSocket, data: Buffer): void {
    try {
      // Try to parse as JSON message
      const text = data.toString('utf-8');

      if (text.startsWith('{')) {
        const message: VoiceMessage = JSON.parse(text);

        switch (message.type) {
          case 'START_RECORDING':
            console.log(`[VoiceSocket] Start recording for session ${ws.sessionId}`);
            break;

          case 'STOP_RECORDING':
            console.log(`[VoiceSocket] Stop recording for session ${ws.sessionId}`);
            break;

          case 'PING':
            this.sendMessage(ws, { type: 'PONG' });
            break;

          default:
            console.warn(`[VoiceSocket] Unknown message type: ${message.type}`);
        }
      } else {
        // Treat as raw audio data
        if (ws.pipeline) {
          ws.pipeline.processAudio(data);
        } else {
          console.warn('[VoiceSocket] Received audio but no pipeline active');
        }
      }
    } catch (error: any) {
      console.error('[VoiceSocket] Message handling error:', error);
      this.sendError(ws, 'Failed to process message');
    }
  }

  /**
   * Handle WebSocket close
   */
  private handleClose(ws: AuthenticatedWebSocket): void {
    const sessionId = ws.sessionId;

    if (!sessionId) {
      return;
    }

    console.log(`[VoiceSocket] Connection closed for session ${sessionId}`);

    // Stop and remove pipeline
    const pipeline = this.activePipelines.get(sessionId);

    if (pipeline) {
      pipeline.stopPipeline();
      this.activePipelines.delete(sessionId);
    }

    ws.pipeline = undefined;
  }

  /**
   * Send message to client
   */
  private sendMessage(ws: AuthenticatedWebSocket, message: VoiceResponse): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Send error message to client
   */
  private sendError(ws: AuthenticatedWebSocket, errorMessage: string): void {
    this.sendMessage(ws, {
      type: 'ERROR',
      data: errorMessage,
    });
  }

  /**
   * Setup heartbeat to detect dead connections
   */
  private setupHeartbeat(): void {
    const interval = setInterval(() => {
      this.wss.clients.forEach((ws: WebSocket) => {
        const authWs = ws as AuthenticatedWebSocket;

        if (authWs.isAlive === false) {
          console.log(`[VoiceSocket] Terminating dead connection for session ${authWs.sessionId}`);
          return authWs.terminate();
        }

        authWs.isAlive = false;
        authWs.ping();
      });
    }, 30000); // 30 seconds

    this.wss.on('close', () => {
      clearInterval(interval);
    });
  }

  /**
   * Get active pipeline count
   */
  getActivePipelineCount(): number {
    return this.activePipelines.size;
  }

  /**
   * Close all connections and cleanup
   */
  shutdown(): void {
    console.log('[VoiceSocket] Shutting down...');

    // Stop all pipelines
    this.activePipelines.forEach((pipeline) => {
      pipeline.stopPipeline();
    });

    this.activePipelines.clear();

    // Close all WebSocket connections
    this.wss.clients.forEach((ws) => {
      ws.close(1001, 'Server shutting down');
    });

    console.log('[VoiceSocket] Shutdown complete');
  }
}
