import { create } from 'zustand';
import { Message } from '../types/chat.types';

interface ContextInfo {
  hasHealthInfo: boolean;
  hasJournalEntries: boolean;
}

export interface CrisisResource {
  name: string;
  number: string;
  available: string;
}

export interface CrisisResources {
  riskLevel: string;
  message: string;
  resources: CrisisResource[];
}

interface ChatState {
  // Current chat state
  messages: Message[];
  isStreaming: boolean;
  currentStreamingMessage: string;
  error: string | null;
  availableContext: ContextInfo | null;
  crisisResources: CrisisResources | null; // Crisis resources for the last message

  // Actions
  addMessage: (message: Message) => void;
  updateStreamingMessage: (content: string) => void;
  setStreaming: (isStreaming: boolean) => void;
  setError: (error: string | null) => void;
  setAvailableContext: (context: ContextInfo | null) => void;
  setCrisisResources: (resources: CrisisResources | null) => void;
  clearMessages: () => void;
  loadMessages: (messages: Message[]) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isStreaming: false,
  currentStreamingMessage: '',
  error: null,
  availableContext: null,
  crisisResources: null,

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

  setCrisisResources: (resources) =>
    set({ crisisResources: resources }),

  clearMessages: () =>
    set({ messages: [], currentStreamingMessage: '', error: null, availableContext: null, crisisResources: null }),

  loadMessages: (messages) =>
    set({ messages }),
}));
