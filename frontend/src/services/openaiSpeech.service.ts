import 'react-native-url-polyfill/auto';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import { Audio } from 'expo-av';

// Get the cache directory path
const getCacheDirectory = () => {
  return FileSystem.cacheDirectory || FileSystem.documentDirectory || '';
};

const OPENAI_API_KEY = Constants.expoConfig?.extra?.OPENAI_API_KEY || '';
const SPEECH_TO_TEXT_URL = 'https://api.openai.com/v1/audio/transcriptions';
const TEXT_TO_SPEECH_URL = 'https://api.openai.com/v1/audio/speech';

class OpenAISpeechService {
  /**
   * Convert audio file to text using OpenAI Whisper
   */
  async transcribeAudio(audioUri: string): Promise<string> {
    try {
      if (!OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured');
      }

      // Create form data with file URI (React Native way)
      const formData = new FormData();

      formData.append('file', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'audio.m4a',
      } as any);
      formData.append('model', 'whisper-1');
      formData.append('language', 'nl'); // Dutch language

      const response = await fetch(SPEECH_TO_TEXT_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Speech-to-text failed: ${errorData}`);
      }

      const data = await response.json();
      return data.text || '';
    } catch (error) {
      console.error('Transcription error:', error);
      throw error;
    }
  }

  /**
   * Convert text to speech using OpenAI TTS
   */
  async synthesizeSpeech(
    text: string,
    onAudioLevel?: (level: number) => void
  ): Promise<{ sound: Audio.Sound; uri: string }> {
    try {
      if (!OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured');
      }

      const response = await fetch(TEXT_TO_SPEECH_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          voice: 'nova', // Warm, empathetic female voice - good for therapy
          input: text,
          speed: 1.0,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Text-to-speech failed: ${errorData}`);
      }

      // Get audio data as ArrayBuffer
      const arrayBuffer = await response.arrayBuffer();

      // Convert ArrayBuffer to base64
      const base64Audio = this.arrayBufferToBase64(arrayBuffer);

      // Save to file
      const fileUri = `${getCacheDirectory()}tts_${Date.now()}.mp3`;
      await FileSystem.writeAsStringAsync(fileUri, base64Audio, {
        encoding: 'base64',
      });

      // Load and prepare sound
      const { sound } = await Audio.Sound.createAsync(
        { uri: fileUri },
        { shouldPlay: false },
        onAudioLevel ? (status) => {
          if (status.isLoaded && status.isPlaying && status.durationMillis) {
            // Simulate audio level based on position
            const progress = status.positionMillis / status.durationMillis;
            const level = Math.sin(progress * Math.PI * 10) * 0.5 + 0.5;
            onAudioLevel(level);
          }
        } : undefined
      );

      return { sound, uri: fileUri };
    } catch (error) {
      console.error('Speech synthesis error:', error);
      throw error;
    }
  }

  /**
   * Play audio with callback for audio levels
   */
  async playAudio(
    sound: Audio.Sound,
    onComplete?: () => void,
    onAudioLevel?: (level: number) => void
  ): Promise<void> {
    try {
      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      // Set up completion callback
      if (onComplete) {
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            onComplete();
          }

          if (onAudioLevel && status.isLoaded && status.isPlaying && status.durationMillis) {
            // Estimate audio level based on playback position
            const progress = status.positionMillis / status.durationMillis;
            const level = Math.abs(Math.sin(progress * Math.PI * 20)) * 0.7 + 0.3;
            onAudioLevel(level);
          }
        });
      }

      // Play the sound
      await sound.playAsync();
    } catch (error) {
      console.error('Audio playback error:', error);
      throw error;
    }
  }

  /**
   * Stop and unload audio
   */
  async stopAudio(sound: Audio.Sound): Promise<void> {
    try {
      await sound.stopAsync();
      await sound.unloadAsync();
    } catch (error) {
      console.error('Failed to stop audio:', error);
    }
  }

  /**
   * Clean up audio file
   */
  async cleanupAudioFile(uri: string): Promise<void> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(uri);
      }
    } catch (error) {
      console.error('Failed to cleanup audio file:', error);
    }
  }

  // Helper method to convert ArrayBuffer to base64
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}

export const openaiSpeechService = new OpenAISpeechService();
