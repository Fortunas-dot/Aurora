import { create } from 'zustand';
import { Message } from '../types/chat.types';

interface ChatState {
  // Current chat state
  messages: Message[];
  isStreaming: boolean;
  currentStreamingMessage: string;
  error: string | null;

  // Actions
  addMessage: (message: Message) => void;
  updateStreamingMessage: (content: string) => void;
  setStreaming: (isStreaming: boolean) => void;
  setError: (error: string | null) => void;
  clearMessages: () => void;
  loadMessages: (messages: Message[]) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isStreaming: false,
  currentStreamingMessage: '',
  error: null,

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  updateStreamingMessage: (content) =>
    set({ currentStreamingMessage: content }),

  setStreaming: (isStreaming) =>
    set({ isStreaming }),

  setError: (error) =>
    set({ error }),

  clearMessages: () =>
    set({ messages: [], currentStreamingMessage: '', error: null }),

  loadMessages: (messages) =>
    set({ messages }),
}));
