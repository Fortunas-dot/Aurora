import { useState, useCallback, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import { personaplexService } from '../services/personaplex.service';
import { audioStreamingService } from '../services/audioStreaming.service';
import { useAuthStore } from '../store/authStore';
import { formatCompleteContextForAI } from '../utils/healthInfoFormatter';
import { journalService, AuroraJournalContext } from '../services/journal.service';

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

export const useVoiceTherapyPersonaPlex = ({ enabled = true }: { enabled?: boolean } = {}) => {
  const { user } = useAuthStore();
  const [state, setState] = useState<VoiceState>('idle');
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [journalContext, setJournalContext] = useState<AuroraJournalContext[]>([]);

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
          setJournalContext(response.data);
        }
      } catch (error) {
        console.log('Could not load journal context:', error);
      }
    };

    if (user) {
      loadJournalContext();
    }
  }, [user]);

  // Initialize PersonaPlex API connection
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

    initializePersonaPlex();

    return () => {
      cleanup();
    };
  }, [enabled, user?.healthInfo, journalContext]); // Reconnect when enabled/health info/journal changes

  const initializePersonaPlex = useCallback(async () => {
    try {
      setState('processing');
      stateRef.current = 'processing';
      setError(null);

      console.log('Connecting to PersonaPlex 7B API...');

      // Format complete context (health info + journal entries) for AI
      const completeContext = formatCompleteContextForAI(user, journalContext);
      if (completeContext) {
        console.log('📋 Including health information and journal context in PersonaPlex 7B');
      }

      // Connect to PersonaPlex API
      await personaplexService.connect({
        healthInfoContext: completeContext,
        onTranscript: (text) => {
          console.log('PersonaPlex transcript:', text);
          setTranscript(text);
        },
        onAudioChunk: (audioData) => {
          // Audio chunks are handled internally by personaplexService
        },
        onResponseStart: async () => {
          console.log('PersonaPlex response started - pausing recording');
          setState('speaking');
          stateRef.current = 'speaking';
          await audioStreamingService.cancelStreaming();
        },
        onResponseEnd: async () => {
          console.log('PersonaPlex response ended');
          if (currentSound.current) {
            await currentSound.current.unloadAsync();
            currentSound.current = null;
          }
          
          // Auto-restart listening after AI finishes speaking
          setTimeout(async () => {
            if (!isMutedRef.current && isConnected.current) {
              console.log('🎤 Resuming listening after PersonaPlex response');
              setState('listening');
              stateRef.current = 'listening';
              await startListening();
            }
          }, 800);
        },
        onError: (err) => {
          console.error('PersonaPlex API error:', err);
          setError(err.message);
          setState('idle');
          stateRef.current = 'idle';
        },
        onAudioLevel: (level) => {
          setAudioLevel(level);
        },
      });

      isConnected.current = true;
      console.log('✅ PersonaPlex 7B API connected and session configured!');

      // Send initial greeting and start listening
      if (!hasGreeted.current) {
        hasGreeted.current = true;
        setTimeout(() => {
          console.log('🎤 Starting PersonaPlex voice session...');
          setState('listening');
          stateRef.current = 'listening';
          startListening();
        }, 500);
      }
    } catch (err) {
      console.error('Failed to initialize PersonaPlex API:', err);
      setError('Kon niet verbinden met PersonaPlex 7B API. Controleer je internetverbinding en API configuratie.');
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

      // Start audio streaming to PersonaPlex API
      await audioStreamingService.startStreaming((level) => {
        setAudioLevel(level);
      });

      console.log('Started listening and streaming to PersonaPlex 7B API');
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

      await audioStreamingService.stopStreaming();

      console.log('Stopped listening, audio committed to PersonaPlex API');
    } catch (err) {
      console.error('Failed to stop listening:', err);
      setError('Fout bij het stoppen van de opname.');
    }
  }, []);

  const sendTextMessage = useCallback((text: string) => {
    if (isConnected.current && personaplexService) {
      console.log('Sending text message to PersonaPlex:', text);
      personaplexService.sendText(text);
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
          await initializePersonaPlex();
        } else {
          setState('listening');
          stateRef.current = 'listening';
          await startListening();
        }
      }
    } catch (err) {
      console.error('Failed to toggle mute:', err);
    }
  }, [isMuted, initializePersonaPlex, startListening]);

  const cleanup = useCallback(() => {
    if (audioStreamingService.getIsRecording()) {
      audioStreamingService.cancelStreaming().catch(console.error);
    }
    personaplexService.disconnect();
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

