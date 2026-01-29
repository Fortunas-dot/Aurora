import { useState, useCallback, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';

const OPENAI_API_KEY = Constants.expoConfig?.extra?.OPENAI_API_KEY || '';

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
      setError(err.message || 'Failed to start recording');
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

// Helper function to transcribe audio using OpenAI Whisper
async function transcribeAudio(audioUri: string): Promise<string> {
  try {
    // Read audio file
    const fileInfo = await FileSystem.getInfoAsync(audioUri);
    if (!fileInfo.exists) {
      throw new Error('Audio file not found');
    }

    // Create form data
    const formData = new FormData();
    
    // Get file extension and mime type
    const ext = audioUri.split('.').pop() || 'm4a';
    const mimeType = ext === 'wav' ? 'audio/wav' : 'audio/m4a';

    formData.append('file', {
      uri: audioUri,
      type: mimeType,
      name: `recording.${ext}`,
    } as any);
    formData.append('model', 'whisper-1');
    formData.append('language', 'nl');

    // Send to OpenAI
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Whisper API error:', errorData);
      throw new Error('Transcription failed');
    }

    const data = await response.json();
    return data.text || '';

  } catch (error) {
    console.error('Transcription error:', error);
    return '';
  }
}

// Format duration as MM:SS
export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};





