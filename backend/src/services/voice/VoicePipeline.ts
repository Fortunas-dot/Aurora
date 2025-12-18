/**
 * Voice Pipeline
 * Orchestrates real-time voice conversation: STT → GPT-4 → TTS
 * Target latency: < 2 seconds
 */

import { LiveClient } from '@deepgram/sdk';
import deepgramService, { DeepgramService, TranscriptionResult } from './DeepgramService';
import elevenLabsService, { ElevenLabsService } from './ElevenLabsService';
import { OpenAIService } from '../ai/OpenAIService';
import { PromptEngine } from '../ai/PromptEngine';
import { Message } from '../../models/Message.model';
import { Session } from '../../models/Session.model';
import type { UserProfile } from '@prisma/client';

export interface VoicePipelineCallbacks {
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onAIResponse?: (text: string) => void;
  onAudioChunk?: (audioData: Buffer) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

export class VoicePipeline {
  private deepgramService: DeepgramService;
  private elevenLabsService: ElevenLabsService;
  private openaiService: OpenAIService;
  private promptEngine: PromptEngine;

  // Active connections
  private deepgramConnection: LiveClient | null = null;
  private isProcessing: boolean = false;

  // Transcript buffer for interim results
  private interimTranscript: string = '';

  constructor() {
    this.deepgramService = deepgramService;
    this.elevenLabsService = elevenLabsService;
    this.openaiService = new OpenAIService();
    this.promptEngine = new PromptEngine();
  }

  /**
   * Start voice pipeline for a session
   */
  async startPipeline(
    sessionId: string,
    userProfile: UserProfile | null,
    callbacks: VoicePipelineCallbacks
  ): Promise<void> {
    console.log(`[VoicePipeline] Starting pipeline for session ${sessionId}`);

    // Create Deepgram live transcription
    this.deepgramConnection = this.deepgramService.createLiveTranscription(
      async (result: TranscriptionResult) => {
        await this.handleTranscription(sessionId, userProfile, result, callbacks);
      },
      (error: Error) => {
        console.error('[VoicePipeline] Deepgram error:', error);
        callbacks.onError?.(error);
      }
    );

    console.log('[VoicePipeline] Pipeline started successfully');
  }

  /**
   * Process incoming audio data
   */
  processAudio(audioData: Buffer): void {
    if (!this.deepgramConnection) {
      console.warn('[VoicePipeline] No active Deepgram connection');
      return;
    }

    this.deepgramService.sendAudio(this.deepgramConnection, audioData);
  }

  /**
   * Handle transcription results from Deepgram
   */
  private async handleTranscription(
    sessionId: string,
    userProfile: UserProfile | null,
    result: TranscriptionResult,
    callbacks: VoicePipelineCallbacks
  ): Promise<void> {
    // Send interim transcript to client for real-time feedback
    if (!result.isFinal) {
      this.interimTranscript = result.transcript;
      callbacks.onTranscript?.(result.transcript, false);
      return;
    }

    // Final transcript - process with AI
    const finalTranscript = result.transcript.trim();

    if (!finalTranscript || finalTranscript.length === 0) {
      return;
    }

    console.log(`[VoicePipeline] Final transcript: "${finalTranscript}"`);
    callbacks.onTranscript?.(finalTranscript, true);

    // Reset interim transcript
    this.interimTranscript = '';

    // Prevent concurrent processing
    if (this.isProcessing) {
      console.log('[VoicePipeline] Already processing, skipping...');
      return;
    }

    this.isProcessing = true;

    try {
      // Save user message
      await Message.create({
        sessionId,
        role: 'user',
        content: finalTranscript,
      });

      // Get conversation history
      const messages = await Message.getBySession(sessionId);
      const conversationHistory = messages.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

      // Build system prompt with user context
      const systemPrompt = this.promptEngine.buildSystemPrompt(userProfile);

      // Get AI response with streaming
      const aiMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...conversationHistory,
      ];

      console.log('[VoicePipeline] Requesting GPT-4 response...');
      const startTime = Date.now();

      // Stream AI response and convert to speech sentence-by-sentence
      await this.streamAIResponseToSpeech(
        sessionId,
        aiMessages,
        callbacks
      );

      const elapsed = Date.now() - startTime;
      console.log(`[VoicePipeline] Complete pipeline latency: ${elapsed}ms`);

    } catch (error: any) {
      console.error('[VoicePipeline] Pipeline error:', error);
      callbacks.onError?.(error);
    } finally {
      this.isProcessing = false;
      callbacks.onComplete?.();
    }
  }

  /**
   * Stream GPT-4 response and convert to speech with sentence chunking
   * This achieves low latency by streaming audio as soon as complete sentences are ready
   */
  private async streamAIResponseToSpeech(
    sessionId: string,
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    callbacks: VoicePipelineCallbacks
  ): Promise<void> {
    let fullResponse = '';
    let sentenceBuffer = '';

    // Stream GPT-4 response
    const responseStream = this.openaiService.streamCompletion(messages, 0.8);

    for await (const chunk of responseStream) {
      const content = chunk.content || '';
      fullResponse += content;
      sentenceBuffer += content;

      // Send text chunk to client
      callbacks.onAIResponse?.(content);

      // Check for sentence boundaries (period, exclamation, question mark)
      const sentenceMatch = sentenceBuffer.match(/^(.*?[.!?]\s*)/);

      if (sentenceMatch) {
        const completeSentence = sentenceMatch[1].trim();
        sentenceBuffer = sentenceBuffer.slice(sentenceMatch[1].length);

        if (completeSentence.length > 0) {
          console.log(`[VoicePipeline] Converting sentence to speech: "${completeSentence}"`);

          // Convert sentence to speech and stream audio
          try {
            for await (const audioChunk of this.elevenLabsService.textToSpeechStream(completeSentence)) {
              callbacks.onAudioChunk?.(audioChunk);
            }
          } catch (error: any) {
            console.error('[VoicePipeline] TTS error:', error);
            // Continue processing even if one sentence fails
          }
        }
      }
    }

    // Process any remaining text in buffer
    if (sentenceBuffer.trim().length > 0) {
      console.log(`[VoicePipeline] Converting final fragment to speech: "${sentenceBuffer}"`);

      try {
        for await (const audioChunk of this.elevenLabsService.textToSpeechStream(sentenceBuffer.trim())) {
          callbacks.onAudioChunk?.(audioChunk);
        }
      } catch (error: any) {
        console.error('[VoicePipeline] Final TTS error:', error);
      }
    }

    // Save AI message
    if (fullResponse.trim().length > 0) {
      await Message.create({
        sessionId,
        role: 'assistant',
        content: fullResponse.trim(),
      });
    }

    console.log(`[VoicePipeline] AI response complete: "${fullResponse}"`);
  }

  /**
   * Stop the voice pipeline
   */
  stopPipeline(): void {
    console.log('[VoicePipeline] Stopping pipeline...');

    if (this.deepgramConnection) {
      this.deepgramService.closeConnection(this.deepgramConnection);
      this.deepgramConnection = null;
    }

    this.isProcessing = false;
    this.interimTranscript = '';

    console.log('[VoicePipeline] Pipeline stopped');
  }

  /**
   * Check if pipeline is currently processing
   */
  isActive(): boolean {
    return this.deepgramConnection !== null;
  }
}
