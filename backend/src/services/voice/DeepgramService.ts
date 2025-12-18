/**
 * Deepgram Service
 * Speech-to-Text using Deepgram Nova-2 model
 */

import { createClient, LiveTranscriptionEvents, LiveClient } from '@deepgram/sdk';
import type { LiveTranscriptionEvent } from '@deepgram/sdk/dist/types';

export interface TranscriptionResult {
  transcript: string;
  isFinal: boolean;
  confidence: number;
}

export class DeepgramService {
  private deepgram: ReturnType<typeof createClient>;

  constructor() {
    const apiKey = process.env.DEEPGRAM_API_KEY;

    if (!apiKey) {
      throw new Error('DEEPGRAM_API_KEY is not set in environment variables');
    }

    this.deepgram = createClient(apiKey);
  }

  /**
   * Create a live transcription connection
   * Optimized for real-time conversational AI
   */
  createLiveTranscription(
    onTranscript: (result: TranscriptionResult) => void,
    onError: (error: Error) => void
  ): LiveClient {
    const connection = this.deepgram.listen.live({
      model: 'nova-2',
      language: 'en-US',
      punctuate: true,
      smart_format: true,
      encoding: 'linear16',
      sample_rate: 16000,
      channels: 1,

      // Voice Activity Detection
      endpointing: 300, // ms of silence to finalize transcript
      interim_results: true,

      // Optimization for low latency
      no_delay: true,
    });

    // Handle transcript events
    connection.on(LiveTranscriptionEvents.Transcript, (data: LiveTranscriptionEvent) => {
      const alternative = data.channel?.alternatives?.[0];

      if (alternative && alternative.transcript) {
        const result: TranscriptionResult = {
          transcript: alternative.transcript,
          isFinal: data.is_final ?? false,
          confidence: alternative.confidence ?? 0,
        };

        onTranscript(result);
      }
    });

    // Handle errors
    connection.on(LiveTranscriptionEvents.Error, (error: any) => {
      console.error('Deepgram error:', error);
      onError(new Error(error.message || 'Deepgram transcription error'));
    });

    // Handle connection close
    connection.on(LiveTranscriptionEvents.Close, () => {
      console.log('Deepgram connection closed');
    });

    return connection;
  }

  /**
   * Send audio data to live transcription
   */
  sendAudio(connection: LiveClient, audioData: Buffer): void {
    if (connection.getReadyState() === 1) { // OPEN state
      connection.send(audioData);
    } else {
      console.warn('Deepgram connection not ready, skipping audio chunk');
    }
  }

  /**
   * Close live transcription connection
   */
  closeConnection(connection: LiveClient): void {
    connection.finish();
  }
}

export default new DeepgramService();
