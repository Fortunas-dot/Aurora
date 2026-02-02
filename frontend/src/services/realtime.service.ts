import 'react-native-url-polyfill/auto';
import Constants from 'expo-constants';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

const OPENAI_API_KEY = Constants.expoConfig?.extra?.OPENAI_API_KEY || '';

// Proxy server URL - set PROXY_URL in app.config.js for production
// For local development, falls back to platform-specific defaults
const getProxyUrl = (): string => {
  // Check for configured proxy URL (Railway, Render, etc.)
  const configuredUrl = Constants.expoConfig?.extra?.PROXY_URL;
  if (configuredUrl) {
    return configuredUrl;
  }
  
  // Local development fallbacks
  if (__DEV__) {
    // Custom host for physical device testing
    const customHost = Constants.expoConfig?.extra?.PROXY_HOST;
    if (customHost) {
      return `ws://${customHost}:8080`;
    }
    
    // Platform-specific defaults
    if (Platform.OS === 'android') {
      return 'ws://10.0.2.2:8080';
    }
    return 'ws://localhost:8080';
  }
  
  // Production must have PROXY_URL configured
  console.warn('PROXY_URL not configured! Set it in app.config.js');
  return 'wss://your-proxy.up.railway.app';
};

const REALTIME_API_URL = getProxyUrl();

interface RealtimeServiceCallbacks {
  onTranscript?: (text: string) => void;
  onAudioChunk?: (audioData: ArrayBuffer) => void;
  onResponseStart?: () => void;
  onResponseEnd?: () => void;
  onError?: (error: Error) => void;
  onAudioLevel?: (level: number) => void;
}

interface ConnectOptions extends RealtimeServiceCallbacks {
  healthInfoContext?: string; // Optional health information context for AI
}

export class RealtimeService {
  private apiKey: string;
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private isConnected: boolean = false;
  private sessionReady: boolean = false;
  private callbacks: RealtimeServiceCallbacks = {};
  private audioChunks: ArrayBuffer[] = [];
  private isPlayingAudio: boolean = false; // Track if audio is currently playing
  private currentSound: Audio.Sound | null = null;
  private healthInfoContext: string = ''; // Store health info context

  constructor(apiKey?: string) {
    this.apiKey = apiKey || OPENAI_API_KEY;

    if (!this.apiKey) {
      console.warn('OpenAI API key not found. Please set OPENAI_API_KEY in .env file');
    }
  }

  /**
   * Connect to OpenAI Realtime API
   */
  async connect(options: ConnectOptions): Promise<void> {
    if (this.isConnected) {
      console.warn('Already connected to Realtime API');
      return;
    }

    const { healthInfoContext, ...callbacks } = options;
    this.callbacks = callbacks;
    this.healthInfoContext = healthInfoContext || '';

    return new Promise((resolve, reject) => {
      try {
        // Create WebSocket connection with authentication
        const wsUrl = `${REALTIME_API_URL}`;
        // Create WebSocket connection
        // Note: If using proxy server, connect directly (proxy adds auth headers)
        // If connecting directly, React Native WebSocket can't send headers (will fail)
        console.log(`Connecting to Realtime API via: ${REALTIME_API_URL}`);
        this.ws = new WebSocket(REALTIME_API_URL);

        this.ws.onopen = () => {
          console.log('Realtime API connected');
          this.isConnected = true;
          
          console.log('✅ WebSocket connected');
          
          // MINIMAL REPRO: Send basic session.update after connection
          // Wait for session.created before sending session.update
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.ws.onerror = (error) => {
          console.error('Realtime API connection error:', error);
          this.isConnected = false;
          const errorMessage = __DEV__ 
            ? 'Kon niet verbinden. Start de proxy server: node proxy-server.js (in root directory)'
            : 'WebSocket connection error';
          if (this.callbacks.onError) {
            this.callbacks.onError(new Error(errorMessage));
          }
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('Realtime API disconnected');
          this.isConnected = false;
        };
      } catch (error) {
        console.error('Failed to connect to Realtime API:', error);
        reject(error);
      }
    });
  }

  /**
   * Send session configuration
   */
  private sendConfig(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    // Base instructions
    let instructions = 'Je bent Aurora, een warme en empathische A.I. mentale gezondheid companion. Je luistert aandachtig, stelt doordachte vragen en biedt ondersteunende begeleiding. Je bent warm, begripvol en niet-oordelend. Je helpt mensen hun gedachten en gevoelens te verkennen op een veilige en ondersteunende manier. Houd je antwoorden beknopt voor spraakgesprekken. Spreek altijd in het Nederlands.';

    // Add health information context if available
    if (this.healthInfoContext) {
      instructions += this.healthInfoContext;
    }

    const config = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        voice: 'alloy',
        instructions: instructions,
        input_audio_transcription: {
          model: 'whisper-1',
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
        },
      },
    };

    console.log('📤 Sending session.update with health context...');
    this.ws.send(JSON.stringify(config));
  }

  /**
   * Send minimal session update after delay
   */
  private sendMinimalUpdate(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.log('❌ WebSocket closed before we could send');
      return;
    }

    // Try the absolute minimum - just set voice
    const msg = {
      type: 'session.update',
      session: {
        voice: 'alloy',
      },
    };

    console.log('📤 Sending minimal session.update after 3s delay...');
    console.log('📤 Message:', JSON.stringify(msg));
    this.ws.send(JSON.stringify(msg));
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(event: MessageEvent): void {
    try {
      // Handle different data types (string, Buffer, Blob)
      let dataStr: string;
      if (typeof event.data === 'string') {
        dataStr = event.data;
      } else if (event.data instanceof ArrayBuffer) {
        dataStr = new TextDecoder().decode(event.data);
      } else if (event.data?.toString) {
        dataStr = event.data.toString();
      } else {
        console.warn('Unknown WebSocket data type:', typeof event.data);
        return;
      }
      
      const message = JSON.parse(dataStr);

      switch (message.type) {
        case 'session.created':
          console.log('✅ Session created:', message.session?.id);
          // Now send session.update from mobile app (proxy will forward as string)
          this.sendConfig();
          break;

        case 'session.updated':
          console.log('✅ Session updated');
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/2b25c5b5-3faf-43ea-844d-1c98148740b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'realtime.service.ts:session.updated',message:'Session updated confirmed',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          this.sessionReady = true;
          break;

        case 'response.created':
          console.log('🎤 Response started');
          if (this.callbacks.onResponseStart) {
            this.callbacks.onResponseStart();
          }
          break;

        case 'response.output_item.added':
          console.log('📝 Output item added');
          break;

        case 'conversation.item.created':
          console.log('💬 Conversation item created');
          break;

        case 'conversation.item.input_audio_transcription.completed':
          console.log('📝 User transcript:', message.transcript);
          if (message.transcript && this.callbacks.onTranscript) {
            this.callbacks.onTranscript(message.transcript);
          }
          break;

        case 'response.audio_transcript.delta':
          // Real-time transcript of AI response (streaming)
          if (message.delta && this.callbacks.onTranscript) {
            this.callbacks.onTranscript(message.delta);
          }
          break;

        case 'response.audio.delta':
          // Audio chunks from AI
          if (message.delta) {
            const audioData = this.base64ToArrayBuffer(message.delta);
            this.audioChunks.push(audioData);
            
            if (this.callbacks.onAudioChunk) {
              this.callbacks.onAudioChunk(audioData);
            }
          }
          break;

        case 'response.audio_transcript.done':
          console.log('✅ Audio transcript complete');
          break;

        case 'response.output_item.done':
          console.log('✅ Output item complete');
          break;

        case 'response.done':
          console.log('✅ Response complete');
          // Play accumulated audio and wait for it to finish before calling onResponseEnd
          this.playAccumulatedAudio().then(() => {
            // Only call onResponseEnd AFTER audio finishes playing
            // This prevents recording from restarting during playback
            console.log('🔊 Audio finished, calling onResponseEnd');
          if (this.callbacks.onResponseEnd) {
            this.callbacks.onResponseEnd();
          }
          });
          break;

        case 'input_audio_buffer.speech_started':
          console.log('🎙️ Speech detected');
          break;

        case 'input_audio_buffer.speech_stopped':
          console.log('🎙️ Speech ended');
          break;

        case 'input_audio_buffer.committed':
          console.log('✅ Audio buffer committed');
          break;

        case 'rate_limits.updated':
          // Ignore rate limit updates
          break;

        case 'error':
          console.error('❌ Realtime API error:', message.error);
          const errorMsg = message.error?.message || 'Unknown error';
          
          // Check for authentication error
          if (errorMsg.includes('authentication') || errorMsg.includes('bearer') || errorMsg.includes('Missing')) {
            const authError = 'Authentication error. Please check your API key.';
            if (this.callbacks.onError) {
              this.callbacks.onError(new Error(authError));
            }
          } else {
            if (this.callbacks.onError) {
              this.callbacks.onError(new Error(errorMsg));
            }
          }
          break;

        default:
          // Log unknown message types for debugging
          console.log('📨 Message:', message.type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  /**
   * Send audio input
   */
  sendAudio(audioData: ArrayBuffer): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const base64Audio = this.arrayBufferToBase64(audioData);
    
    const message = {
      type: 'input_audio_buffer.append',
      audio: base64Audio,
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Commit audio input (end of user speech)
   */
  commitAudio(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const message = {
      type: 'input_audio_buffer.commit',
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Send text message and trigger AI response
   */
  sendText(text: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    // Add user message to conversation
    const createMessage = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: text,
          },
        ],
      },
    };

    this.ws.send(JSON.stringify(createMessage));
    
    // Trigger AI response
    const responseRequest = {
      type: 'response.create',
    };
    
    this.ws.send(JSON.stringify(responseRequest));
  }
  
  /**
   * Send a text message and get AI response (no audio required)
   */
  sendTextAndRespond(text: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.log('❌ Cannot send - WebSocket not open');
      return;
    }

    console.log('📤 Sending text message:', text);
    
    // First, create a conversation item with user text
    const createItem = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: text,
          },
        ],
      },
    };

    this.ws.send(JSON.stringify(createItem));
    
    // Then trigger AI response (text + audio output)
    setTimeout(() => {
      const responseRequest = {
        type: 'response.create',
        response: {
          modalities: ['text', 'audio'],
        },
      };
      console.log('📤 Requesting AI response...');
      this.ws?.send(JSON.stringify(responseRequest));
    }, 100);
  }
  
  /**
   * @deprecated Use sendTextAndRespond instead
   */
  triggerGreeting(greeting: string): void {
    this.sendTextAndRespond(greeting);
  }

  /**
   * Play accumulated audio chunks
   * OpenAI Realtime API sends PCM16 @ 24kHz mono
   */
  private async playAccumulatedAudio(): Promise<void> {
    if (this.audioChunks.length === 0) {
      return;
    }

    try {
      // Combine all audio chunks (raw PCM data)
      const totalLength = this.audioChunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
      const pcmData = new Uint8Array(totalLength);
      let offset = 0;
      
      for (const chunk of this.audioChunks) {
        pcmData.set(new Uint8Array(chunk), offset);
        offset += chunk.byteLength;
      }

      // MAXIMUM amplification for loud playback
      // PCM16 is signed 16-bit, so we process as Int16Array
      const int16View = new Int16Array(pcmData.buffer);
      
      // First, find the peak amplitude to normalize
      let maxAmplitude = 0;
      for (let i = 0; i < int16View.length; i++) {
        maxAmplitude = Math.max(maxAmplitude, Math.abs(int16View[i]));
      }
      
      // Normalize to use full dynamic range, then apply boost
      const targetAmplitude = 32000; // Just below max to prevent clipping
      const normalizeRatio = maxAmplitude > 0 ? targetAmplitude / maxAmplitude : 1;
      const finalGain = Math.min(normalizeRatio, 15); // Cap at 15x to prevent extreme amplification
      
      console.log(`🔊 Audio: peak=${maxAmplitude}, normalizing with gain=${finalGain.toFixed(2)}x`);
      
      for (let i = 0; i < int16View.length; i++) {
        let sample = int16View[i] * finalGain;
        sample = Math.max(-32767, Math.min(32767, sample));
        int16View[i] = Math.round(sample);
      }

      // Create WAV header for PCM16 @ 24kHz mono
      const wavHeader = this.createWavHeader(pcmData.length, 24000, 1, 16);
      
      // Combine header + PCM data
      const wavFile = new Uint8Array(wavHeader.length + pcmData.length);
      wavFile.set(wavHeader, 0);
      wavFile.set(pcmData, wavHeader.length);

      // Convert to base64 and save
      const base64Audio = this.arrayBufferToBase64(wavFile.buffer);
      const fileUri = `${FileSystem.cacheDirectory}realtime_${Date.now()}.wav`;
      await FileSystem.writeAsStringAsync(fileUri, base64Audio, {
        encoding: 'base64',
      });

      console.log(`🔊 Playing ${pcmData.length} bytes of audio...`);
      
      // Mark that we're playing audio - prevents recording from restarting
      this.isPlayingAudio = true;

      // IMPORTANT: Set allowsRecordingIOS to FALSE for playback
      // When true, iOS routes audio to earpiece (phone speaker)
      // When false, iOS routes audio to loudspeaker
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,  // FALSE = loudspeaker, TRUE = earpiece
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        playThroughEarpieceAndroid: false,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        shouldDuckAndroid: false,
      });
      
      // Wait for audio mode to fully switch
      await new Promise(resolve => setTimeout(resolve, 150));

      // Load and play at full volume
      const { sound } = await Audio.Sound.createAsync(
        { uri: fileUri },
        { 
          shouldPlay: true,
          volume: 1.0,  // Maximum volume
          isMuted: false,
        }
      );

      this.currentSound = sound;

      // Ensure volume is at maximum and stays at maximum
      await sound.setVolumeAsync(1.0);
      
      // Wait for audio to finish playing
      await new Promise<void>((resolve) => {
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            console.log('🔊 Audio playback finished');
            this.isPlayingAudio = false;
            this.currentSound?.unloadAsync().catch(console.error);
            this.currentSound = null;
            resolve();
          }
        });
      });

      // Cleanup chunks
      this.audioChunks = [];
    } catch (error) {
      console.error('Error playing audio:', error);
      this.isPlayingAudio = false; // Reset on error
      this.audioChunks = []; // Clear on error too
    }
  }

  /**
   * Create a WAV file header for PCM audio
   */
  private createWavHeader(dataLength: number, sampleRate: number, channels: number, bitDepth: number): Uint8Array {
    const header = new ArrayBuffer(44);
    const view = new DataView(header);
    
    const byteRate = sampleRate * channels * (bitDepth / 8);
    const blockAlign = channels * (bitDepth / 8);

    // "RIFF" chunk
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + dataLength, true); // file size - 8
    view.setUint32(8, 0x57415645, false); // "WAVE"

    // "fmt " sub-chunk
    view.setUint32(12, 0x666D7420, false); // "fmt "
    view.setUint32(16, 16, true); // sub-chunk size (16 for PCM)
    view.setUint16(20, 1, true); // audio format (1 = PCM)
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);

    // "data" sub-chunk
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, dataLength, true);

    return new Uint8Array(header);
  }

  /**
   * Disconnect from Realtime API
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.isPlayingAudio = false;
    this.audioChunks = [];
    
    if (this.currentSound) {
      this.currentSound.unloadAsync().catch(console.error);
      this.currentSound = null;
    }
  }

  /**
   * Check if audio is currently playing
   * Used by audioStreaming to prevent recording during playback
   */
  getIsPlaying(): boolean {
    return this.isPlayingAudio;
  }

  /**
   * Helper: ArrayBuffer to base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Helper: base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

export const realtimeService = new RealtimeService();

