import 'react-native-url-polyfill/auto';
import Constants from 'expo-constants';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { authService } from './auth.service';

// Backend API URL - PersonaPlex gaat via backend proxy
const API_URL = Constants.expoConfig?.extra?.API_URL || 'https://aurora-production.up.railway.app/api';

// Helper to get WebSocket URL for PersonaPlex (via backend)
const getPersonaPlexWsUrl = async (): Promise<string> => {
  const token = await authService.getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  // Convert HTTP API URL to WebSocket URL
  // API_URL format: https://domain.com/api or http://domain.com/api
  let baseUrl = API_URL;
  
  // Remove trailing /api if present
  if (baseUrl.endsWith('/api')) {
    baseUrl = baseUrl.slice(0, -4);
  } else if (baseUrl.endsWith('/api/')) {
    baseUrl = baseUrl.slice(0, -5);
  }
  
  // Convert protocol
  if (baseUrl.startsWith('https://')) {
    baseUrl = baseUrl.replace('https://', 'wss://');
  } else if (baseUrl.startsWith('http://')) {
    baseUrl = baseUrl.replace('http://', 'ws://');
  }
  
  const wsUrl = `${baseUrl}/api/personaplex/ws?token=${encodeURIComponent(token)}`;
  console.log('🔗 Constructed WebSocket URL:', wsUrl.replace(/\?token=.*/, '?token=***'));
  return wsUrl;
};

interface PersonaPlexServiceCallbacks {
  onTranscript?: (text: string) => void;
  onAudioChunk?: (audioData: ArrayBuffer) => void;
  onResponseStart?: () => void;
  onResponseEnd?: () => void;
  onError?: (error: Error) => void;
  onAudioLevel?: (level: number) => void;
}

interface ConnectOptions extends PersonaPlexServiceCallbacks {
  healthInfoContext?: string;
}

export class PersonaPlexService {
  private ws: WebSocket | null = null;
  private isConnected: boolean = false;
  private callbacks: PersonaPlexServiceCallbacks = {};
  private audioChunks: ArrayBuffer[] = [];
  private isPlayingAudio: boolean = false;
  private currentSound: Audio.Sound | null = null;

  /**
   * Connect to PersonaPlex via backend proxy
   * Backend handles connection to PersonaPlex server and context injection
   */
  async connect(options: ConnectOptions): Promise<void> {
    if (this.isConnected) {
      console.warn('Already connected to PersonaPlex');
      return;
    }

    const { healthInfoContext, ...callbacks } = options;
    this.callbacks = callbacks;
    // Note: healthInfoContext is now handled by backend, but we keep it for compatibility

    return new Promise(async (resolve, reject) => {
      try {
        // Get WebSocket URL via backend (includes auth token)
        const wsUrl = await getPersonaPlexWsUrl();
        
        console.log(`🔗 Connecting to PersonaPlex via backend: ${wsUrl.replace(/\?token=.*/, '?token=***')}`);
        
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('✅ Connected to PersonaPlex via backend');
          this.isConnected = true;
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.ws.onerror = (error) => {
          console.error('❌ PersonaPlex connection error:', error);
          console.error('WebSocket readyState:', this.ws?.readyState);
          console.error('WebSocket URL:', wsUrl.replace(/\?token=.*/, '?token=***'));
          this.isConnected = false;
          const errorMessage = 'Kon niet verbinden met PersonaPlex. Controleer je internetverbinding.';
          if (this.callbacks.onError) {
            this.callbacks.onError(new Error(errorMessage));
          }
          reject(error);
        };

        this.ws.onclose = (event) => {
          const reason = event.reason || 'No reason provided';
          const code = event.code || 0;
          console.log(`PersonaPlex disconnected: ${code} - ${reason}`);
          
          // Provide more specific error messages based on close code
          let errorMessage = `Connection closed: ${reason} (code: ${code})`;
          
          if (code === 0 || code === 1006) {
            // Abnormal closure - connection closed without proper handshake
            errorMessage = 'Kan niet verbinden met PersonaPlex server. Controleer of de server draait en bereikbaar is.';
            console.error('❌ Abnormal closure - server may not be responding, route not found, or connection refused');
            console.error('❌ This usually means:');
            console.error('   1. PersonaPlex server is not running on Railway');
            console.error('   2. Backend cannot reach PersonaPlex server URL');
            console.error('   3. WebSocket route not found (404)');
            console.error('   4. SSL/TLS certificate issue');
          } else if (code === 1008) {
            errorMessage = 'Authenticatie mislukt. Log opnieuw in.';
            console.error('❌ Policy violation - authentication failed');
          } else if (code === 1011) {
            errorMessage = 'Backend kan niet verbinden met PersonaPlex server. Check backend logs.';
            console.error('❌ Server error - backend connection failed');
          } else if (code === 1000 || code === 1001) {
            // Normal closure - don't show error
            console.log('✅ Normal WebSocket closure');
            this.isConnected = false;
            return;
          }
          
          this.isConnected = false;
          
          // Always call error callback for abnormal closures
          if (code !== 1000 && code !== 1001) {
            if (this.callbacks.onError) {
              this.callbacks.onError(new Error(errorMessage));
            }
            // Also reject the promise if connection failed during setup
            if (!this.isConnected) {
              reject(new Error(errorMessage));
            }
          }
        };
      } catch (error: any) {
        console.error('❌ Failed to connect to PersonaPlex:', error);
        const errorMessage = error.message || 'Kon niet verbinden met PersonaPlex.';
        if (this.callbacks.onError) {
          this.callbacks.onError(new Error(errorMessage));
        }
        reject(error);
      }
    });
  }

  // Note: Session configuration is now handled by backend
  // Backend automatically injects therapist prompt and user context

  /**
   * Handle incoming messages
   * Adjust message handling based on actual PersonaPlex 7B API format
   */
  private handleMessage(event: MessageEvent): void {
    try {
      let dataStr: string;
      if (typeof event.data === 'string') {
        dataStr = event.data;
      } else if (event.data instanceof ArrayBuffer) {
        dataStr = new TextDecoder().decode(event.data);
      } else {
        console.warn('Unknown WebSocket data type:', typeof event.data);
        return;
      }
      
      const message = JSON.parse(dataStr);

      // Handle messages from PersonaPlex (forwarded by backend)
      // Message format depends on actual PersonaPlex API protocol
      // Backend acts as a transparent bridge, so we receive PersonaPlex messages directly
      
      // Try to parse as JSON first
      if (typeof dataStr === 'string' && dataStr.startsWith('{')) {
        const message = JSON.parse(dataStr);

        switch (message.type) {
          case 'response.created':
            console.log('🎤 PersonaPlex response started');
            if (this.callbacks.onResponseStart) {
              this.callbacks.onResponseStart();
            }
            break;

          case 'transcript':
          case 'conversation.item.input_audio_transcription.completed':
            if (message.transcript || message.text) {
              const transcript = message.transcript || message.text;
              if (this.callbacks.onTranscript) {
                this.callbacks.onTranscript(transcript);
              }
            }
            break;

          case 'response.audio.delta':
          case 'audio.delta':
            if (message.delta) {
              const audioData = this.base64ToArrayBuffer(message.delta);
              this.audioChunks.push(audioData);
              
              if (this.callbacks.onAudioChunk) {
                this.callbacks.onAudioChunk(audioData);
              }
            }
            break;

          case 'response.done':
            console.log('✅ PersonaPlex response complete');
            this.playAccumulatedAudio().then(() => {
              if (this.callbacks.onResponseEnd) {
                this.callbacks.onResponseEnd();
              }
            });
            break;

          case 'error':
            console.error('❌ PersonaPlex error:', message.error);
            const errorMsg = message.error?.message || 'Unknown error';
            if (this.callbacks.onError) {
              this.callbacks.onError(new Error(errorMsg));
            }
            break;

          default:
            console.log('📨 PersonaPlex message:', message.type);
        }
      } else {
        // If not JSON, might be raw audio data (binary)
        // Backend forwards audio chunks directly
        if (event.data instanceof ArrayBuffer) {
          this.audioChunks.push(event.data);
          if (this.callbacks.onAudioChunk) {
            this.callbacks.onAudioChunk(event.data);
          }
        }
      }
    } catch (error) {
      console.error('Error handling PersonaPlex message:', error);
    }
  }

  /**
   * Send audio input
   * Audio is forwarded directly to PersonaPlex via backend bridge
   */
  sendAudio(audioData: ArrayBuffer): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    // Backend forwards audio directly to PersonaPlex
    // Format depends on PersonaPlex API - try both JSON and binary
    try {
      const base64Audio = this.arrayBufferToBase64(audioData);
      const message = {
        type: 'input_audio_buffer.append',
        audio: base64Audio,
      };
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      // Fallback: send raw binary
      this.ws.send(audioData);
    }
  }

  /**
   * Send text message
   */
  sendText(text: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    // Backend forwards text to PersonaPlex
    const message = {
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

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Play accumulated audio chunks
   */
  private async playAccumulatedAudio(): Promise<void> {
    if (this.audioChunks.length === 0) {
      return;
    }

    try {
      // Combine all audio chunks
      const totalLength = this.audioChunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
      const audioData = new Uint8Array(totalLength);
      let offset = 0;
      
      for (const chunk of this.audioChunks) {
        audioData.set(new Uint8Array(chunk), offset);
        offset += chunk.byteLength;
      }

      // TODO: Adjust audio format based on PersonaPlex 7B output format
      // Assuming PCM16 @ 24kHz mono for now (similar to OpenAI)
      const sampleRate = 24000;
      const channels = 1;
      const bitDepth = 16;

      // Create WAV header
      const wavHeader = this.createWavHeader(audioData.length, sampleRate, channels, bitDepth);
      
      // Combine header + audio data
      const wavFile = new Uint8Array(wavHeader.length + audioData.length);
      wavFile.set(wavHeader, 0);
      wavFile.set(audioData, wavHeader.length);

      // Convert to base64 and save
      const base64Audio = this.arrayBufferToBase64(wavFile.buffer);
      const fileUri = `${FileSystem.cacheDirectory}personaplex_${Date.now()}.wav`;
      await FileSystem.writeAsStringAsync(fileUri, base64Audio, {
        encoding: 'base64',
      });

      console.log(`🔊 Playing PersonaPlex audio (${audioData.length} bytes)...`);
      
      this.isPlayingAudio = true;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        playThroughEarpieceAndroid: false,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        shouldDuckAndroid: false,
      });
      
      await new Promise(resolve => setTimeout(resolve, 150));

      const { sound } = await Audio.Sound.createAsync(
        { uri: fileUri },
        { 
          shouldPlay: true,
          volume: 1.0,
          isMuted: false,
        }
      );

      this.currentSound = sound;
      await sound.setVolumeAsync(1.0);
      
      await new Promise<void>((resolve) => {
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            console.log('🔊 PersonaPlex audio playback finished');
            this.isPlayingAudio = false;
            this.currentSound?.unloadAsync().catch(console.error);
            this.currentSound = null;
            resolve();
          }
        });
      });

      this.audioChunks = [];
    } catch (error) {
      console.error('Error playing PersonaPlex audio:', error);
      this.isPlayingAudio = false;
      this.audioChunks = [];
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

    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + dataLength, true);
    view.setUint32(8, 0x57415645, false); // "WAVE"
    view.setUint32(12, 0x666D7420, false); // "fmt "
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, dataLength, true);

    return new Uint8Array(header);
  }

  /**
   * Disconnect from PersonaPlex API
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

export const personaplexService = new PersonaPlexService();

