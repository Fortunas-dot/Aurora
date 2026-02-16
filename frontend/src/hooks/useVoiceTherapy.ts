import { useState, useCallback, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import { realtimeService } from '../services/realtime.service';
import { audioStreamingService } from '../services/audioStreaming.service';
import { useAuthStore } from '../store/authStore';
import { formatCompleteContextForAI } from '../utils/healthInfoFormatter';
import { journalService, AuroraJournalContext } from '../services/journal.service';

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

export const useVoiceTherapy = ({ enabled = true }: { enabled?: boolean } = {}) => {
  const { user } = useAuthStore();
  const [state, setState] = useState<VoiceState>('idle');
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [journalContext, setJournalContext] = useState<AuroraJournalContext[]>([]);
  const [chatContext, setChatContext] = useState<Array<{
    importantPoints: string[];
    summary?: string;
    sessionDate: string;
  }>>([]);

  const isMutedRef = useRef(false);
  const stateRef = useRef<VoiceState>('idle');
  const hasGreeted = useRef(false);
  const isConnected = useRef(false);
  const currentSound = useRef<Audio.Sound | null>(null);

  // Keep refs in sync with state
  useEffect(() => {
    isMutedRef.current = isMuted;
    stateRef.current = state;
  }, [isMuted, state]);

  // Load journal context when user changes
  useEffect(() => {
    const loadJournalContext = async () => {
      try {
        const response = await journalService.getAuroraContext(5);
        if (response.success && response.data) {
          setJournalContext(response.data.journalEntries || []);
          setChatContext(response.data.chatContext || []);
        }
      } catch (error) {
        console.log('Could not load journal context:', error);
      }
    };

    if (user) {
      loadJournalContext();
    }
  }, [user]);

  // Initialize Realtime API connection
  // Re-initialize when user changes (to update health info context)
  // Note: This hook will always initialize - use conditionally in parent component if needed
  useEffect(() => {
    if (!enabled) {
      // If this model is not active, ensure everything is cleaned up
      cleanup();
      setState('idle');
      stateRef.current = 'idle';
      return;
    }

    initializeRealtime();

    return () => {
      cleanup();
    };
  }, [enabled, user?.healthInfo, journalContext, chatContext]); // Reconnect when enabled/health info/journal/chat changes

  const initializeRealtime = useCallback(async () => {
    try {
      setState('processing');
      stateRef.current = 'processing';
      setError(null);

      console.log('Connecting to Realtime API...');

      // Format complete context (health info + journal entries + chat context) for AI
      const completeContext = formatCompleteContextForAI(user, journalContext, chatContext);
      if (completeContext) {
        console.log('📋 Including health information and journal context in AI');
      }

      // Connect to Realtime API
      await realtimeService.connect({
        healthInfoContext: completeContext, // Pass complete context to AI
        onTranscript: (text) => {
          console.log('Transcript:', text);
          setTranscript(text);
        },
        onAudioChunk: (audioData) => {
          // Audio chunks are handled internally by realtimeService
        },
        onResponseStart: async () => {
          console.log('AI response started - pausing recording');
          setState('speaking');
          stateRef.current = 'speaking';
          // Stop recording while AI is speaking to prevent audio conflicts
          await audioStreamingService.cancelStreaming();
        },
        onResponseEnd: async () => {
          console.log('AI response ended');
          // Clear audio chunks after playing
          if (currentSound.current) {
            await currentSound.current.unloadAsync();
            currentSound.current = null;
          }
          
          // Auto-restart listening after AI finishes speaking
          setTimeout(async () => {
            if (!isMutedRef.current && isConnected.current) {
              console.log('🎤 Resuming listening after AI response');
              setState('listening');
              stateRef.current = 'listening';
              await startListening();
            }
          }, 800); // Slightly longer delay for smooth transition
        },
        onError: (err) => {
          console.error('Realtime API error:', err);
          setError(err.message);
          setState('idle');
          stateRef.current = 'idle';
        },
        onAudioLevel: (level) => {
          setAudioLevel(level);
        },
      });

      isConnected.current = true;
      console.log('✅ Realtime API connected and session configured!');

      // Send initial greeting and start listening
      if (!hasGreeted.current) {
        hasGreeted.current = true;
        // Small delay to ensure session is fully ready
        setTimeout(() => {
          console.log('🎤 Starting voice session...');
      setState('listening');
      stateRef.current = 'listening';
          startListening();
        }, 500);
      }
    } catch (err) {
      console.error('Failed to initialize Realtime API:', err);
      setError('Kon niet verbinden met de Realtime API. Controleer je internetverbinding.');
      setState('idle');
      stateRef.current = 'idle';
    }
  }, []);

  const startListening = useCallback(async () => {
    try {
      if (isMutedRef.current || !isConnected.current) {
        return;
      }

      setState('listening');
      stateRef.current = 'listening';

      // Start audio streaming to Realtime API
      // Note: Server-side VAD will handle speech detection automatically
      await audioStreamingService.startStreaming((level) => {
        setAudioLevel(level);
      });

      console.log('Started listening and streaming to Realtime API');
    } catch (err) {
      console.error('Failed to start listening:', err);
      setError('Kan niet beginnen met luisteren. Controleer de microfoon rechten.');
      setState('idle');
      stateRef.current = 'idle';
    }
  }, []);

  const stopListening = useCallback(async () => {
    try {
      if (!audioStreamingService.getIsRecording()) {
        return;
      }

      setState('processing');
      stateRef.current = 'processing';

      // Stop streaming and commit audio to Realtime API
      // The Realtime API will automatically:
      // 1. Detect the end of speech (server-side VAD)
      // 2. Transcribe the audio
      // 3. Generate and stream the response
      await audioStreamingService.stopStreaming();

      console.log('Stopped listening, audio committed to Realtime API');
    } catch (err) {
      console.error('Failed to stop listening:', err);
      setError('Fout bij het stoppen van de opname.');
    }
  }, []);

  const sendTextMessage = useCallback((text: string) => {
    // Send text message to Realtime API
    // This can be used for the initial greeting
    if (isConnected.current && realtimeService) {
      console.log('Sending text message:', text);
      realtimeService.sendText(text);
    }
  }, []);

  const toggleMute = useCallback(async () => {
    try {
      if (!isMuted) {
        // Muting - stop recording and disconnect
        if (audioStreamingService.getIsRecording()) {
          await audioStreamingService.cancelStreaming();
        }
        setState('idle');
        stateRef.current = 'idle';
        setIsMuted(true);
      } else {
        // Unmuting - reconnect and start listening
        setIsMuted(false);
        if (!isConnected.current) {
          await initializeRealtime();
        } else {
          setState('listening');
          stateRef.current = 'listening';
          await startListening();
        }
      }
    } catch (err) {
      console.error('Failed to toggle mute:', err);
    }
  }, [isMuted, initializeRealtime, startListening]);

  const cleanup = useCallback(() => {
    if (audioStreamingService.getIsRecording()) {
      audioStreamingService.cancelStreaming().catch(console.error);
    }
    realtimeService.disconnect();
    isConnected.current = false;
    
    if (currentSound.current) {
      currentSound.current.unloadAsync().catch(console.error);
    }
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
