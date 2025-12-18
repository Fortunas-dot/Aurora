/**
 * ElevenLabs Service
 * Text-to-Speech using ElevenLabs Turbo v2 model
 */

import { ElevenLabsClient, stream } from 'elevenlabs';
import { Readable } from 'stream';

export interface TTSOptions {
  voiceId?: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
  optimizeStreamingLatency?: number;
}

export class ElevenLabsService {
  private client: ElevenLabsClient;
  private defaultVoiceId: string;

  constructor() {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = process.env.ELEVENLABS_VOICE_ID;

    if (!apiKey) {
      throw new Error('ELEVENLABS_API_KEY is not set in environment variables');
    }

    if (!voiceId) {
      throw new Error('ELEVENLABS_VOICE_ID is not set in environment variables');
    }

    this.client = new ElevenLabsClient({ apiKey });
    this.defaultVoiceId = voiceId;
  }

  /**
   * Convert text to speech with streaming
   * Returns an async generator that yields audio chunks
   */
  async *textToSpeechStream(
    text: string,
    options: TTSOptions = {}
  ): AsyncGenerator<Buffer, void, unknown> {
    const {
      voiceId = this.defaultVoiceId,
      modelId = 'eleven_turbo_v2',
      stability = 0.5,
      similarityBoost = 0.75,
      optimizeStreamingLatency = 4,
    } = options;

    try {
      const audioStream = await this.client.generate({
        voice: voiceId,
        model_id: modelId,
        text,
        voice_settings: {
          stability,
          similarity_boost: similarityBoost,
        },
        optimize_streaming_latency: optimizeStreamingLatency,
      });

      // Convert to Node.js readable stream and yield chunks
      for await (const chunk of audioStream) {
        yield chunk;
      }
    } catch (error: any) {
      console.error('ElevenLabs TTS error:', error);
      throw new Error(`Text-to-speech failed: ${error.message}`);
    }
  }

  /**
   * Convert text to speech and return complete audio buffer
   * Use this for non-streaming scenarios
   */
  async textToSpeech(text: string, options: TTSOptions = {}): Promise<Buffer> {
    const chunks: Buffer[] = [];

    for await (const chunk of this.textToSpeechStream(text, options)) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  }

  /**
   * Get available voices
   */
  async getVoices() {
    try {
      const voices = await this.client.voices.getAll();
      return voices.voices;
    } catch (error: any) {
      console.error('Failed to fetch ElevenLabs voices:', error);
      throw new Error(`Failed to fetch voices: ${error.message}`);
    }
  }

  /**
   * Stream text to speech with sentence chunking for lower latency
   * Splits text into sentences and streams each one immediately
   */
  async *textToSpeechStreamChunked(
    textGenerator: AsyncGenerator<string> | string,
    options: TTSOptions = {}
  ): AsyncGenerator<Buffer, void, unknown> {
    let sentenceBuffer = '';

    // Handle both string and generator inputs
    const textIterator = typeof textGenerator === 'string'
      ? (async function* () { yield textGenerator; })()
      : textGenerator;

    for await (const textChunk of textIterator) {
      sentenceBuffer += textChunk;

      // Check for sentence boundaries
      const sentences = sentenceBuffer.split(/([.!?]\s+)/);

      // Process complete sentences
      for (let i = 0; i < sentences.length - 1; i += 2) {
        const sentence = sentences[i] + (sentences[i + 1] || '');
        const trimmed = sentence.trim();

        if (trimmed.length > 0) {
          // Stream this sentence to audio
          for await (const audioChunk of this.textToSpeechStream(trimmed, options)) {
            yield audioChunk;
          }
        }
      }

      // Keep incomplete sentence in buffer
      sentenceBuffer = sentences[sentences.length - 1] || '';
    }

    // Process any remaining text
    if (sentenceBuffer.trim().length > 0) {
      for await (const audioChunk of this.textToSpeechStream(sentenceBuffer.trim(), options)) {
        yield audioChunk;
      }
    }
  }
}

export default new ElevenLabsService();
