import { useState, useCallback, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { getApiUrl } from '../utils/apiUrl';
import { secureStorage } from '../utils/secureStorage';

export type RecordingState = 'idle' | 'recording' | 'processing' | 'done' | 'error';

interface VoiceJournalingResult {
  state: RecordingState;
  audioUri: string | null;
  transcription: string;
  duration: number;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  cancelRecording: () => void;
  reset: () => void;
}

export const useVoiceJournaling = (): VoiceJournalingResult => {
  const [state, setState] = useState<RecordingState>('idle');
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [transcription, setTranscription] = useState('');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync();
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

  const requestPermissions = async (): Promise<boolean> => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        setError('Microphone permission denied');
        return false;
      }
      return true;
    } catch (err) {
      setError('Failed to request permissions');
      return false;
    }
  };

  const startRecording = useCallback(async () => {
    try {
      // Request permissions
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        setState('error');
        return;
      }

      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      // Create and start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setState('recording');
      setError(null);
      setDuration(0);

      // Start duration counter
      durationIntervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error('Error starting recording:', err);
      const message = String(err?.message || '');
      if (message.includes('background') || message.includes('audio session could not be activated')) {
        setError('Recording only works while the app is active on screen. Please bring Aurora to the foreground and try again.');
      } else {
        setError('Failed to start recording. Please try again.');
      }
      setState('error');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    try {
      // Clear duration interval
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      if (!recordingRef.current) {
        return;
      }

      setState('processing');

      // Stop recording
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) {
        throw new Error('No recording URI');
      }

      setAudioUri(uri);

      // Transcribe audio
      const text = await transcribeAudio(uri);
      setTranscription(text);
      setState('done');

    } catch (err: any) {
      console.error('Error stopping recording:', err);
      setError(err.message || 'Failed to process recording');
      setState('error');
    }
  }, []);

  const cancelRecording = useCallback(() => {
    // Clear duration interval
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    if (recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync();
      recordingRef.current = null;
    }

    reset();
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setAudioUri(null);
    setTranscription('');
    setDuration(0);
    setError(null);
  }, []);

  return {
    state,
    audioUri,
    transcription,
    duration,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
    reset,
  };
};

// Helper function to transcribe audio using backend (which talks to OpenAI Whisper)
async function transcribeAudio(audioUri: string): Promise<string> {
  try {
    // Check if file exists using legacy API (to avoid deprecation warning)
    const fileInfo = await FileSystem.getInfoAsync(audioUri);
    if (!fileInfo.exists) {
      throw new Error('Audio file not found');
    }

    const baseUrl = getApiUrl();
    const token = await secureStorage.getItemAsync('auth_token');

    // 1) Upload audio file to backend using existing /api/upload endpoint
    const ext = audioUri.split('.').pop() || 'm4a';
    const mimeType = ext === 'wav' ? 'audio/wav' : 'audio/m4a';

    const uploadForm = new FormData();
    uploadForm.append('file', {
      uri: audioUri,
      type: mimeType,
      name: `recording.${ext}`,
    } as any);

    const uploadResponse = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        // DO NOT set Content-Type; React Native will set the correct multipart boundary
      },
      body: uploadForm,
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json().catch(() => ({}));
      console.warn('Audio upload failed:', uploadResponse.status, errorData);
      throw new Error('Failed to upload audio for transcription');
    }

    const uploadJson = await uploadResponse.json().catch(() => ({}));
    const audioUrl: string | undefined = uploadJson?.data?.url;

    if (!audioUrl) {
      console.warn('Upload response missing audio URL:', uploadJson);
      throw new Error('Audio URL missing after upload');
    }

    // 2) Ask backend to transcribe the uploaded audio using OpenAI Whisper
    const transcribeResponse = await fetch(`${baseUrl}/journal/transcribe-audio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        audioUrl,
        language: 'nl',
      }),
    });

    if (!transcribeResponse.ok) {
      const errorData = await transcribeResponse.json().catch(() => ({}));
      console.warn('Backend transcription error:', transcribeResponse.status, errorData);
      throw new Error(errorData?.message || 'Transcription failed');
    }

    const transcribeJson = await transcribeResponse.json().catch(() => ({}));
    const text: string = transcribeJson?.data?.text || '';

    // Fallback in case the backend returns empty text
    return text || 'Voice note (no text detected).';

  } catch (error) {
    console.warn('Transcription error:', error);
    // Return a visible placeholder so the entry isn't empty
    return 'Voice note (transcription failed).';
  }
}

// Format duration as MM:SS
export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};






