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
  const [chatContext, setChatContext] = useState<Array<{
    importantPoints: string[];
    summary?: string;
    sessionDate: string;
  }>>([]);
  const cleanupRef = useRef<(() => void) | null>(null);

  const {
    messages,
    addMessage,
    updateStreamingMessage,
    setStreaming,
    setError,
    setAvailableContext,
    setCrisisResources,
  } = useChatStore();

  // Load journal context when component mounts or user changes
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
      
      // Store user message ID for potential crisis resources
      const currentUserMessageId = userMsg.id;

      // Format complete context (health info + journal entries + chat context) for AI
      const completeContext = formatCompleteContextForAI(user, journalContext, chatContext);
      
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
      // Note: The full system prompt with therapeutic techniques is built on the backend
      // This is just a fallback for frontend context preparation
      let systemContent = 'You are Aurora, an empathetic and professional A.I. mental health companion. You listen attentively, ask thoughtful questions, and provide supportive guidance. You are warm, understanding, and non-judgmental. You help people explore their thoughts and feelings in a safe and supportive way. Speak in English.\n\nIMPORTANT: You have access to the user\'s personal information, health conditions, previous conversations, and important details they have shared with you. You MUST remember and reference these details when relevant. This includes:\n- Health conditions and diagnoses they have shared (e.g., Alzheimer\'s, depression, anxiety, etc.)\n- Personal information they have told you about themselves\n- Important points from previous chat sessions\n- Their journal entries and emotional patterns\n\nYou should actively use this information to provide personalized, continuous support. When the user mentions something you know about them, acknowledge it and reference it naturally. Do NOT say you cannot remember personal details - you have access to this information and should use it to help them.';
      
      // Add complete context (health + journal) if available
      if (completeContext) {
        systemContent += completeContext;
      }

      // Check if this is the first message in the conversation (only user messages, no assistant responses yet)
      const userMessages = messages.filter((m) => m.role === 'user');
      const assistantMessages = messages.filter((m) => m.role === 'assistant');
      const isFirstMessage = userMessages.length === 0 && assistantMessages.length === 0;

      // If this is the first message, add instruction to mention the finish session button
      if (isFirstMessage) {
        systemContent += '\n\nIMPORTANT: This is your first message in this conversation. In your response, you MUST mention: "Do not forget at the end to press the \'Finish Session\' button so I can save everything that is being said in this chat and use it for our next conversations." Include this naturally in your greeting.';
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

      // Full response as received from the stream (raw)
      let fullResponse = '';
      // What we actually show to the user (typed out progressively)
      let displayedResponse = '';
      // Flags and timers
      let hasReceivedData = false;
      let timeoutId: NodeJS.Timeout | null = null;
      let typingInterval: NodeJS.Timeout | null = null;
      let streamCompleted = false;

      // Typing speed configuration (characters per second)
      // Fast, but with a small visible typing effect (not fully instant)
      const TYPING_CHARS_PER_SECOND = 95; // slightly faster
      const TYPING_INTERVAL_MS = 22; // slightly shorter interval

      const clearTypingInterval = () => {
        if (typingInterval) {
          clearInterval(typingInterval);
          typingInterval = null;
        }
      };

      const finalizeMessage = () => {
        // Called once typing has finished and stream is complete
        const finalContent = fullResponse || displayedResponse;
        if (!finalContent.trim()) {
          // Nothing meaningful to add
          updateStreamingMessage('');
          setStreaming(false);
          setIsLoading(false);
          return;
        }

        const assistantMsg = {
          id: uuidv4(),
          role: 'assistant' as const,
          content: finalContent,
          timestamp: new Date().toISOString(),
        };

        addMessage(assistantMsg);
        updateStreamingMessage('');
        setStreaming(false);
        setIsLoading(false);
        // Keep context available for showing badge on completed message
        cleanupRef.current = null;
      };

      const startTyping = () => {
        if (typingInterval) {
          return;
        }

        typingInterval = setInterval(() => {
          // Nothing new to type yet
          if (displayedResponse.length >= fullResponse.length) {
            // If the stream has finished and we've typed everything, we can finalize
            if (streamCompleted) {
              clearTypingInterval();
              finalizeMessage();
            }
            return;
          }

          const charsPerTick = Math.max(
            1,
            Math.round((TYPING_CHARS_PER_SECOND * TYPING_INTERVAL_MS) / 1000)
          );
          const targetLength = Math.min(
            fullResponse.length,
            displayedResponse.length + charsPerTick
          );

          displayedResponse = fullResponse.slice(0, targetLength);
          updateStreamingMessage(displayedResponse);
        }, TYPING_INTERVAL_MS);
      };

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
            // Append new content and let the typing loop reveal it quickly
            fullResponse += chunk;
            startTyping();
          },
          // On complete
          () => {
            if (timeoutId) {
              clearTimeout(timeoutId);
              timeoutId = null;
            }
            // Mark stream as finished; finalization happens after typing catches up
            streamCompleted = true;

            // If nothing is typing (e.g. very short answer), finalize immediately
            if (!typingInterval) {
              finalizeMessage();
            }
          },
          // On error
          (err) => {
            if (timeoutId) {
              clearTimeout(timeoutId);
              timeoutId = null;
            }
            clearTypingInterval();
            console.error('Streaming error:', err);
            setError(err.message);
            setStreaming(false);
            setIsLoading(false);
            updateStreamingMessage('');
            cleanupRef.current = null;
          },
          // Options with crisis resources callback
          {
            onCrisisResources: (resources) => {
              console.log('🚨 Setting crisis resources in store:', resources, 'for message:', currentUserMessageId);
              // Link crisis resources to the specific user message that triggered them
              setCrisisResources(resources, currentUserMessageId);
            },
          }
        );

        cleanupRef.current = () => {
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          clearTypingInterval();
          cleanup();
        };
      } catch (err) {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        clearTypingInterval();
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
