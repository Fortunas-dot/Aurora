/**
 * Shared TypeScript types for backend
 */

import { Request } from 'express';

// User types
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  encryptionKeyHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  userId: string;
  coreValues: string[];
  emotionalPatterns: EmotionalPattern[];
  currentGoals: Goal[];
  personalityTraits: PersonalityTraits;
  communicationPreferences: CommunicationPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmotionalPattern {
  pattern: string;
  frequency: 'occasional' | 'frequent' | 'persistent';
  triggers: string[];
  copingStrategies: string[];
  firstIdentified: string;
  lastSeen: string;
}

export interface Goal {
  goal: string;
  status: 'active' | 'progressing' | 'achieved';
  createdAt: string;
  milestones: Milestone[];
}

export interface Milestone {
  description: string;
  achieved: boolean;
  date?: string;
}

export interface PersonalityTraits {
  openness?: number;
  conscientiousness?: number;
  extraversion?: number;
  agreeableness?: number;
  neuroticism?: number;
  resilience?: number;
  selfAwareness?: number;
}

export interface CommunicationPreferences {
  preferredMode?: 'voice' | 'text' | 'mixed';
  pacePreference?: 'slow' | 'moderate' | 'fast';
  directness?: 'gentle' | 'balanced' | 'direct';
}

// Session types
export interface Session {
  id: string;
  userId: string;
  startedAt: Date;
  endedAt?: Date;
  status: 'active' | 'completed' | 'abandoned';
  sessionSummary?: string;
  emotionalTrajectory?: Record<string, unknown>;
  keyThemes: string[];
  durationSeconds?: number;
}

// Insight types
export interface Insight {
  id: string;
  userId: string;
  sessionId: string;
  type: 'breakthrough' | 'pattern' | 'goal' | 'value';
  category: 'emotional' | 'behavioral' | 'cognitive';
  content: string;
  emotionalContext?: EmotionalContext;
  importanceScore: number;
  tags: string[];
  createdAt: Date;
}

export interface EmotionalContext {
  primaryEmotion: string;
  intensity: number;
  triggers: string[];
}

// Auth types
export interface JWTPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
