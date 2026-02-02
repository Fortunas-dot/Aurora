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
      
      // Prepare conversation history for OpenAI with A.I. mental health support companion system message
      let systemContent = 'Je bent Aurora, een empathische en professionele A.I. mentale gezondheid companion. Je luistert aandachtig, stelt doordachte vragen en biedt ondersteunende begeleiding. Je bent warm, begripvol en niet-oordelend. Je helpt mensen hun gedachten en gevoelens te verkennen op een veilige en ondersteunende manier. Spreek in het Nederlands.';
      
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

      try {
        // Start streaming
        const cleanup = await openAIService.streamChatCompletion(
          conversationMessages,
          // On chunk received
          (chunk) => {
            fullResponse += chunk;
            updateStreamingMessage(fullResponse);
          },
          // On complete
          () => {
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
            cleanupRef.current = null;
          },
          // On error
          (err) => {
            console.error('Streaming error:', err);
            setError(err.message);
            setStreaming(false);
            setIsLoading(false);
            updateStreamingMessage('');
            cleanupRef.current = null;
          }
        );

        cleanupRef.current = cleanup;
      } catch (err) {
        console.error('Failed to start streaming:', err);
        setError('Failed to send message. Please try again.');
        setStreaming(false);
        setIsLoading(false);
        updateStreamingMessage('');
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
