import { useEffect, useState } from 'react';
import { useChatStore } from '../store/chatStore';
import { StorageService } from '../services/storage.service';

export const useChatHistory = () => {
  const { messages, loadMessages } = useChatStore();
  const [isLoading, setIsLoading] = useState(true);

  // Load messages on mount
  useEffect(() => {
    const loadInitialMessages = async () => {
      try {
        const savedMessages = await StorageService.loadMessages();
        if (savedMessages.length > 0) {
          loadMessages(savedMessages);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialMessages();
  }, []);

  // Save messages whenever they change (with debouncing to avoid excessive writes)
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      const timeoutId = setTimeout(() => {
        StorageService.saveMessages(messages).catch((error) => {
          console.error('Failed to save chat history:', error);
        });
      }, 500); // Debounce for 500ms

      return () => clearTimeout(timeoutId);
    }
  }, [messages, isLoading]);

  const clearHistory = async () => {
    try {
      await StorageService.clearMessages();
      useChatStore.getState().clearMessages();
    } catch (error) {
      console.error('Failed to clear chat history:', error);
      throw error;
    }
  };

  return {
    clearHistory,
    isLoading,
  };
};
