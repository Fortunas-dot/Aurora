import 'react-native-get-random-values';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useChatStore } from '../store/chatStore';
import { openAIService } from '../services/openai.service';
import { useAuthStore } from '../store/authStore';
import { formatCompleteContextForAI } from '../utils/healthInfoFormatter';
import { journalService, AuroraJournalContext } from '../services/journal.service';
import { v4 as uuidv4 } from 'uuid';

export const useStreamingResponse = () => {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [journalContext, setJournalContext] = useState<AuroraJournalContext[]>([]);
  const cleanupRef = useRef<(() => void) | null>(null);

  const {
    messages,
    addMessage,
    updateStreamingMessage,
    setStreaming,
    setError,
    setAvailableContext,
  } = useChatStore();

  // Load journal context when component mounts or user changes
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

  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (!userMessage.trim() || isLoading) {
        return;
      }

      // Add user message
      const userMsg = {
        id: uuidv4(),
        role: 'user' as const,
        content: userMessage.trim(),
        timestamp: new Date().toISOString(),
      };

      addMessage(userMsg);
      setStreaming(true);
      setIsLoading(true);
      setError(null);

      // Format complete context (health info + journal entries) for AI
      const completeContext = formatCompleteContextForAI(user, journalContext);
      
      // Track available context for UI display
      const hasHealthInfo = !!(user?.healthInfo && (
        (user.healthInfo.mentalHealth && user.healthInfo.mentalHealth.length > 0) ||
        (user.healthInfo.physicalHealth && user.healthInfo.physicalHealth.length > 0) ||
        (user.healthInfo.medications && user.healthInfo.medications.length > 0) ||
        (user.healthInfo.therapies && user.healthInfo.therapies.length > 0)
      ));
      const hasJournalEntries = !!(journalContext && journalContext.length > 0);
      
      // Set context info - will be used to show indicator during streaming and badge on message
      setAvailableContext({
        hasHealthInfo,
        hasJournalEntries,
      });
      
      // Prepare conversation history for OpenAI with A.I. mental health support companion system message
      let systemContent = 'You are Aurora, an empathetic and professional A.I. mental health companion. You listen attentively, ask thoughtful questions, and provide supportive guidance. You are warm, understanding, and non-judgmental. You help people explore their thoughts and feelings in a safe and supportive way. Speak in English.';
      
      // Add complete context (health + journal) if available
      if (completeContext) {
        systemContent += completeContext;
      }
      
      const systemMessage = {
        role: 'system' as const,
        content: systemContent,
      };

      const conversationMessages = [
        systemMessage,
        ...messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        { role: 'user' as const, content: userMessage.trim() },
      ];

      let fullResponse = '';
      let hasReceivedData = false;
      let timeoutId: NodeJS.Timeout | null = null;

      // Set a timeout to reset streaming state if no data is received within 30 seconds
      timeoutId = setTimeout(() => {
        if (!hasReceivedData) {
          console.warn('Streaming timeout - no data received');
          setError('Request timed out. Please try again.');
          setStreaming(false);
          setIsLoading(false);
          updateStreamingMessage('');
          if (cleanupRef.current) {
            cleanupRef.current();
            cleanupRef.current = null;
          }
        }
      }, 30000); // 30 second timeout

      try {
        // Start streaming
        const cleanup = await openAIService.streamChatCompletion(
          conversationMessages,
          // On chunk received
          (chunk) => {
            hasReceivedData = true;
            if (timeoutId) {
              clearTimeout(timeoutId);
              timeoutId = null;
            }
            fullResponse += chunk;
            updateStreamingMessage(fullResponse);
          },
          // On complete
          () => {
            if (timeoutId) {
              clearTimeout(timeoutId);
              timeoutId = null;
            }
            const assistantMsg = {
              id: uuidv4(),
              role: 'assistant' as const,
              content: fullResponse,
              timestamp: new Date().toISOString(),
            };

            addMessage(assistantMsg);
            updateStreamingMessage('');
            setStreaming(false);
            setIsLoading(false);
            // Keep context available for showing badge on completed message
            cleanupRef.current = null;
          },
          // On error
          (err) => {
            if (timeoutId) {
              clearTimeout(timeoutId);
              timeoutId = null;
            }
            console.error('Streaming error:', err);
            setError(err.message);
            setStreaming(false);
            setIsLoading(false);
            updateStreamingMessage('');
            cleanupRef.current = null;
          }
        );

        cleanupRef.current = () => {
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          cleanup();
        };
      } catch (err) {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        console.error('Failed to start streaming:', err);
        setError('Failed to send message. Please try again.');
        setStreaming(false);
        setIsLoading(false);
        updateStreamingMessage('');
        if (cleanupRef.current) {
          cleanupRef.current();
          cleanupRef.current = null;
        }
      }
    },
    [messages, addMessage, updateStreamingMessage, setStreaming, setError, isLoading]
  );

  const cancelStreaming = useCallback(() => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
      setStreaming(false);
      setIsLoading(false);
      updateStreamingMessage('');
    }
  }, [setStreaming, updateStreamingMessage]);

  return {
    sendMessage,
    cancelStreaming,
    isLoading,
  };
};
