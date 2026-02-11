import { create } from 'zustand';
import { Message } from '../types/chat.types';

interface ContextInfo {
  hasHealthInfo: boolean;
  hasJournalEntries: boolean;
}

interface ChatState {
  // Current chat state
  messages: Message[];
  isStreaming: boolean;
  currentStreamingMessage: string;
  error: string | null;
  availableContext: ContextInfo | null;

  // Actions
  addMessage: (message: Message) => void;
  updateStreamingMessage: (content: string) => void;
  setStreaming: (isStreaming: boolean) => void;
  setError: (error: string | null) => void;
  setAvailableContext: (context: ContextInfo | null) => void;
  clearMessages: () => void;
  loadMessages: (messages: Message[]) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isStreaming: false,
  currentStreamingMessage: '',
  error: null,
  availableContext: null,

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  updateStreamingMessage: (content) =>
    set({ currentStreamingMessage: content }),

  setStreaming: (isStreaming) =>
    set({ isStreaming }),

  setError: (error) =>
    set({ error }),

  setAvailableContext: (context) =>
    set({ availableContext: context }),

  clearMessages: () =>
    set({ messages: [], currentStreamingMessage: '', error: null, availableContext: null }),

  loadMessages: (messages) =>
    set({ messages }),
}));
