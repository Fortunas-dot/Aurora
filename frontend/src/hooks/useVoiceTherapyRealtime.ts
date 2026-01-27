import { useState, useCallback, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import { voiceRecordingService } from '../services/voiceRecording.service';
import { realtimeService } from '../services/realtime.service';

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

export const useVoiceTherapyRealtime = () => {
  const [state, setState] = useState<VoiceState>('idle');
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState<string>('');

  const isMutedRef = useRef(false);
  const stateRef = useRef<VoiceState>('idle');
  const hasGreeted = useRef(false);
  const recording = useRef<Audio.Recording | null>(null);
  const isRecording = useRef(false);
  const audioChunks = useRef<ArrayBuffer[]>([]);

  // Keep refs in sync with state
  useEffect(() => {
    isMutedRef.current = isMuted;
    stateRef.current = state;
  }, [isMuted, state]);

  // Connect to Realtime API and play greeting
  useEffect(() => {
    initializeRealtime();

    return () => {
      cleanup();
    };
  }, []);

  const initializeRealtime = useCallback(async () => {
    try {
      setState('processing');
      stateRef.current = 'processing';

      // Connect to Realtime API
      await realtimeService.connect({
        onTranscript: (text) => {
          console.log('Transcript:', text);
          setTranscript(text);
        },
        onAudioChunk: (audioData) => {
          audioChunks.current.push(audioData);
        },
        onResponseStart: () => {
          console.log('AI response started');
          setState('speaking');
          stateRef.current = 'speaking';
        },
        onResponseEnd: () => {
          console.log('AI response ended');
          setState('listening');
          stateRef.current = 'listening';
          audioChunks.current = [];
        },
        onError: (err) => {
          console.error('Realtime API error:', err);
          setError(err.message);
        },
        onAudioLevel: (level) => {
          setAudioLevel(level);
        },
      });

      // Play initial greeting
      if (!hasGreeted.current) {
        hasGreeted.current = true;
        // The greeting will come from the AI via the Realtime API
        // We can trigger it by sending a text message
        setTimeout(() => {
          sendTextMessage("Hallo, ik ben Aurora. Welkom. Ik luister naar je. Vertel me gerust wat er in je omgaat.");
        }, 500);
      }

      // Start listening
      setState('listening');
      stateRef.current = 'listening';
      await startRecording();
    } catch (err) {
      console.error('Failed to initialize Realtime API:', err);
      setError('Kon niet verbinden met de Realtime API');
      setState('idle');
      stateRef.current = 'idle';
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      if (isMutedRef.current || isRecording.current) {
        return;
      }

      const hasPermission = await voiceRecordingService.requestPermissions();
      if (!hasPermission) {
        throw new Error('Audio recording permission not granted');
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording with audio streaming to Realtime API
      const { recording: newRecording } = await Audio.Recording.createAsync(
        {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
          isMeteringEnabled: true,
        },
        (status) => {
          if (status.isRecording && status.metering !== undefined) {
            const dbValue = status.metering;
            const normalizedLevel = Math.min(1, Math.max(0, (dbValue + 160) / 160));
            setAudioLevel(normalizedLevel);
          }
        },
        50
      );

      recording.current = newRecording;
      isRecording.current = true;

      // Stream audio to Realtime API
      streamAudioToRealtime();
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Kon niet beginnen met opnemen');
    }
  }, []);

  const streamAudioToRealtime = useCallback(async () => {
    // Note: Expo AV doesn't provide direct access to audio buffer
    // We need to periodically read the recording and send chunks
    // For now, we'll use a workaround: record in chunks and send them
    
    const streamInterval = setInterval(async () => {
      if (!isRecording.current || !recording.current) {
        clearInterval(streamInterval);
        return;
      }

      try {
        // Get recording URI and read audio data
        // This is a simplified version - in production, you'd want to
        // use a library that provides direct audio buffer access
        const status = await recording.current.getStatusAsync();
        
        if (status.isRecording) {
          // In a real implementation, you'd read the audio buffer here
          // and send it to realtimeService.sendAudio()
          // For now, this is a placeholder
        }
      } catch (err) {
        console.error('Error streaming audio:', err);
        clearInterval(streamInterval);
      }
    }, 100); // Send chunks every 100ms
  }, []);

  const stopRecording = useCallback(async () => {
    try {
      if (!recording.current || !isRecording.current) {
        return;
      }

      await recording.current.stopAndUnloadAsync();
      const uri = recording.current.getURI();
      
      recording.current = null;
      isRecording.current = false;

      // Commit audio to Realtime API
      realtimeService.commitAudio();

      // Note: The Realtime API will handle transcription and response automatically
      // via server-side VAD
    } catch (err) {
      console.error('Failed to stop recording:', err);
    }
  }, []);

  const sendTextMessage = useCallback((text: string) => {
    // Send text message to Realtime API
    if (realtimeService && (realtimeService as any).sendText) {
      (realtimeService as any).sendText(text);
    }
  }, []);

  const toggleMute = useCallback(async () => {
    try {
      if (!isMuted) {
        // Muting
        if (isRecording.current && recording.current) {
          await stopRecording();
        }
        setState('idle');
        stateRef.current = 'idle';
        setIsMuted(true);
      } else {
        // Unmuting
        setIsMuted(false);
        setState('listening');
        stateRef.current = 'listening';
        await startRecording();
      }
    } catch (err) {
      console.error('Failed to toggle mute:', err);
    }
  }, [isMuted, startRecording, stopRecording]);

  const cleanup = useCallback(() => {
    if (recording.current) {
      recording.current.stopAndUnloadAsync().catch(console.error);
    }
    realtimeService.disconnect();
  }, []);

  return {
    state,
    audioLevel,
    error,
    isMuted,
    transcript,
    toggleMute,
  };
};





