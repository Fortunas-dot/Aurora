import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

class VoiceRecordingService {
  private recording: Audio.Recording | null = null;
  private isRecording: boolean = false;

  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Failed to request audio permissions:', error);
      return false;
    }
  }

  async startRecording(onAudioLevel?: (level: number) => void): Promise<void> {
    try {
      // Request permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Audio recording permission not granted');
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create recording with metering enabled
      const { recording } = await Audio.Recording.createAsync(
        {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
          isMeteringEnabled: true, // Enable metering for audio level detection
        },
        onAudioLevel ? (status) => {
          if (status.isRecording && status.metering !== undefined) {
            // Expo AV metering gives values in dB, typically between -160 and 0
            // Normalize to 0-1 range where 0 = silence, 1 = loud
            // -160 dB = 0, 0 dB = 1
            const dbValue = status.metering;
            const normalizedLevel = Math.min(1, Math.max(0, (dbValue + 160) / 160));
            onAudioLevel(normalizedLevel);
          }
        } : undefined,
        50 // Update interval in ms (more frequent for better detection)
      );

      this.recording = recording;
      this.isRecording = true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  async stopRecording(): Promise<{ uri: string; duration: number } | null> {
    try {
      if (!this.recording) {
        return null;
      }

      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      const status = await this.recording.getStatusAsync();

      this.isRecording = false;
      const duration = status.durationMillis || 0;

      this.recording = null;

      if (!uri) {
        throw new Error('Recording URI is null');
      }

      return {
        uri,
        duration,
      };
    } catch (error) {
      console.error('Failed to stop recording:', error);
      throw error;
    }
  }

  async cancelRecording(): Promise<void> {
    try {
      if (this.recording) {
        await this.recording.stopAndUnloadAsync();
        this.recording = null;
        this.isRecording = false;
      }
    } catch (error) {
      console.error('Failed to cancel recording:', error);
    }
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }

  async cleanupRecording(uri: string): Promise<void> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(uri);
      }
    } catch (error) {
      console.error('Failed to cleanup recording:', error);
    }
  }
}

export const voiceRecordingService = new VoiceRecordingService();
