import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { realtimeService } from './realtime.service';

// OpenAI Realtime API expects: PCM16, 24kHz, mono
// We send raw base64 audio - the proxy will convert if needed
const PCM_RECORDING_OPTIONS: Audio.RecordingOptions = {
  isMeteringEnabled: true,
  android: {
    // Android: Use 3GP with AMR-NB (widely supported, will convert on proxy)
    extension: '.3gp',
    outputFormat: Audio.AndroidOutputFormat.THREE_GPP,
    audioEncoder: Audio.AndroidAudioEncoder.AMR_NB,
    sampleRate: 8000, // AMR-NB is limited to 8kHz
    numberOfChannels: 1,
    bitRate: 12200,
  },
  ios: {
    // iOS: Use Linear PCM directly (native support)
    extension: '.wav',
    outputFormat: Audio.IOSOutputFormat.LINEARPCM,
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 24000,
    numberOfChannels: 1,
    bitRate: 384000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/wav',
    bitsPerSecond: 384000,
  },
};

/**
 * Service for streaming audio to Realtime API
 * Configured for PCM16 @ 24kHz mono output (OpenAI Realtime format)
 */
export class AudioStreamingService {
  private recording: Audio.Recording | null = null;
  private isRecording: boolean = false;
  private streamInterval: ReturnType<typeof setInterval> | null = null;
  private lastChunkTime: number = 0;
  private isLocked: boolean = false; // Prevent concurrent recording operations

  /**
   * Acquire lock for recording operations
   */
  private async acquireLock(timeout: number = 2000): Promise<boolean> {
    const start = Date.now();
    while (this.isLocked) {
      if (Date.now() - start > timeout) {
        console.warn('⚠️ Failed to acquire recording lock (timeout)');
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    this.isLocked = true;
    return true;
  }

  private releaseLock(): void {
    this.isLocked = false;
  }

  /**
   * Force cleanup any existing recording
   */
  private async forceCleanup(): Promise<void> {
    if (this.streamInterval) {
      clearInterval(this.streamInterval);
      this.streamInterval = null;
    }
    
    if (this.recording) {
      try {
        await this.recording.stopAndUnloadAsync();
      } catch (e) {
        // Ignore errors during cleanup
      }
      this.recording = null;
    }
    this.isRecording = false;
  }

  /**
   * Start recording and streaming audio to Realtime API
   */
  async startStreaming(
    onAudioLevel?: (level: number) => void
  ): Promise<void> {
    // Acquire lock to prevent race conditions
    const hasLock = await this.acquireLock();
    if (!hasLock) {
      console.warn('⚠️ Could not start streaming - another operation in progress');
      return;
    }

    try {
      // Force cleanup any existing recording
      await this.forceCleanup();
      
      // Wait a bit for cleanup
      await new Promise(resolve => setTimeout(resolve, 150));

      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Audio recording permission not granted');
      }

      // Set audio mode for recording
      console.log('🎙️ Setting audio mode for recording...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });

      console.log(`🎤 Starting recording on ${Platform.OS}...`);
      
      // Create recording with platform-specific settings
      const { recording } = await Audio.Recording.createAsync(
        PCM_RECORDING_OPTIONS,
        onAudioLevel ? (status) => {
          if (status.isRecording && status.metering !== undefined) {
            const dbValue = status.metering;
            const normalizedLevel = Math.min(1, Math.max(0, (dbValue + 160) / 160));
            onAudioLevel(normalizedLevel);
          }
        } : undefined,
        50 // Update every 50ms
      );

      this.recording = recording;
      this.isRecording = true;

      // Start streaming audio chunks
      this.startStreamingChunks();
    } catch (error) {
      console.error('Failed to start streaming:', error);
      this.recording = null;
      this.isRecording = false;
      throw error;
    } finally {
      this.releaseLock();
    }
  }

  /**
   * Stream audio chunks to Realtime API
   * Expo AV doesn't provide direct buffer access, so we use periodic recording
   */
  private startStreamingChunks(): void {
    this.lastChunkTime = Date.now();
    
    // Send audio chunks every 2 seconds (more stable)
    this.streamInterval = setInterval(async () => {
      // Skip if not recording or locked
      if (!this.recording || !this.isRecording || this.isLocked) return;
      
      // Try to acquire lock, skip this interval if can't
      if (this.isLocked) return;
      this.isLocked = true;
      
      try {
        // Stop and unload current recording
        const currentRecording = this.recording;
        this.recording = null;
        
        await currentRecording.stopAndUnloadAsync();
        const uri = currentRecording.getURI();
        
        if (uri) {
          // Send the audio chunk
          console.log('📤 Sending audio chunk...');
          await this.sendAudioFile(uri);
        }
        
        // Only restart if we're still supposed to be recording AND audio is not playing
        if (this.isRecording && !realtimeService.getIsPlaying()) {
          // Delay to ensure cleanup
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Ensure audio mode allows recording
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
            interruptionModeIOS: InterruptionModeIOS.DoNotMix,
            interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
            shouldDuckAndroid: false,
            playThroughEarpieceAndroid: false,
            staysActiveInBackground: false,
          });
          
          // Restart recording
          const { recording } = await Audio.Recording.createAsync(
            PCM_RECORDING_OPTIONS
          );
          this.recording = recording;
        } else if (realtimeService.getIsPlaying()) {
          console.log('⏸️ Skipping recording restart - audio is playing');
        }
        
      } catch (error) {
        console.error('Error in audio chunk streaming:', error);
        // Try to recover
        this.recording = null;
      } finally {
        this.isLocked = false;
      }
    }, 2000); // Every 2 seconds
  }

  /**
   * Stop recording and commit audio to Realtime API
   */
  async stopStreaming(): Promise<{ uri: string; duration: number } | null> {
    const hasLock = await this.acquireLock(3000);
    
    try {
      // Mark as not recording first
      this.isRecording = false;

      // Clear streaming interval
      if (this.streamInterval) {
        clearInterval(this.streamInterval);
        this.streamInterval = null;
      }

      if (!this.recording) {
        return null;
      }

      // Stop recording
      const currentRecording = this.recording;
      this.recording = null;

      const status = await currentRecording.getStatusAsync();
      await currentRecording.stopAndUnloadAsync();
      const uri = currentRecording.getURI();
      const duration = status.durationMillis || 0;

      if (uri) {
        // Send final audio chunk
      await this.sendAudioFile(uri);
      }

      // Commit audio to Realtime API
      realtimeService.commitAudio();

      return { uri: uri || '', duration };
    } catch (error) {
      console.error('Failed to stop streaming:', error);
      this.recording = null;
      this.isRecording = false;
      throw error;
    } finally {
      if (hasLock) {
        this.releaseLock();
      }
    }
  }

  /**
   * Send audio file to Realtime API
   * The file should be WAV format with PCM16 data
   * We find and strip the WAV header to get raw PCM data
   */
  private async sendAudioFile(audioUri: string): Promise<void> {
    try {
      // Read audio file as base64
      const audioData = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to ArrayBuffer
      const audioBuffer = this.base64ToArrayBuffer(audioData);
      const dataView = new DataView(audioBuffer);
      
      // Find the actual PCM data by looking for 'data' chunk in WAV
      let pcmStartOffset = 44; // Default WAV header size
      let pcmDataLength = audioBuffer.byteLength - 44;
      
      // Log file info for debugging
      const header = String.fromCharCode(
        dataView.getUint8(0),
        dataView.getUint8(1),
        dataView.getUint8(2),
        dataView.getUint8(3)
      );
      console.log(`📊 Audio file: ${audioBuffer.byteLength} bytes, header: "${header}"`);
      
      // Check if this is a valid WAV file (starts with "RIFF")
      if (audioBuffer.byteLength > 44) {
        const riff = header;
        
        if (riff === 'RIFF') {
          // Find 'data' chunk - it contains the actual PCM samples
          let offset = 12; // Skip RIFF header
          while (offset < audioBuffer.byteLength - 8) {
            const chunkId = String.fromCharCode(
              dataView.getUint8(offset),
              dataView.getUint8(offset + 1),
              dataView.getUint8(offset + 2),
              dataView.getUint8(offset + 3)
            );
            const chunkSize = dataView.getUint32(offset + 4, true);
            
            if (chunkId === 'data') {
              pcmStartOffset = offset + 8;
              pcmDataLength = chunkSize;
              console.log(`📊 Found PCM data at offset ${pcmStartOffset}, size ${pcmDataLength}`);
              break;
            }
            offset += 8 + chunkSize;
          }
        }
      }

      // For iOS (WAV), extract raw PCM data
      // For Android (non-WAV), send entire file - proxy will need to convert
      const isWav = header === 'RIFF';
      
      if (isWav) {
        const pcmData = audioBuffer.slice(pcmStartOffset, pcmStartOffset + pcmDataLength);
        if (pcmData.byteLength > 0) {
          realtimeService.sendAudio(pcmData);
          console.log(`📤 Sent ${pcmData.byteLength} bytes of raw PCM audio (iOS)`);
        }
      } else {
        // Non-WAV file (likely Android 3GP/AMR)
        // For now, try sending the raw bytes anyway - OpenAI might reject it
        console.log(`⚠️ Non-WAV audio (${header}), sending raw file...`);
      realtimeService.sendAudio(audioBuffer);
        console.log(`📤 Sent ${audioBuffer.byteLength} bytes of audio (Android)`);
      }
    } catch (error) {
      console.error('Error sending audio file:', error);
      throw error;
    }
  }

  /**
   * Cancel recording without sending
   */
  async cancelStreaming(): Promise<void> {
    // Wait for lock if needed
    const hasLock = await this.acquireLock(3000);
    
    try {
      await this.forceCleanup();
    } catch (error) {
      console.error('Failed to cancel streaming:', error);
    } finally {
      if (hasLock) {
        this.releaseLock();
      }
    }
  }

  /**
   * Helper: Base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }
}

export const audioStreamingService = new AudioStreamingService();

