import { apiService, ApiResponse } from './api.service';

export type SeverityLevel = 'mild' | 'moderate' | 'severe';

export interface ISymptom {
  condition: string;
  type?: string;
  severity: SeverityLevel;
}

export interface IAIInsights {
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  themes: string[];
  cognitivePatterns?: string[];
  therapeuticFeedback?: string;
  followUpQuestions?: string[];
  analyzedAt?: string;
}

export interface JournalEntry {
  _id: string;
  author: string;
  content: string;
  audioUrl?: string;
  transcription?: string;
  mood: number;
  symptoms: ISymptom[];
  tags: string[];
  promptId?: string;
  promptText?: string;
  aiInsights?: IAIInsights;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JournalPrompt {
  id: string;
  text: string;
  category: string;
}

export interface JournalInsights {
  totalEntries: number;
  averageMood: number | null;
  moodTrend: { date: string; mood: number }[];
  topThemes: { theme: string; count: number }[];
  commonPatterns: { pattern: string; count: number }[];
  symptomFrequency: { [key: string]: { count: number; avgSeverity: string } };
  streakDays: number;
}

export interface AuroraJournalContext {
  date: string;
  mood: number;
  summary: string;
  themes: string[];
  sentiment?: string;
}

export interface CreateEntryData {
  content: string;
  mood: number;
  audioUrl?: string;
  transcription?: string;
  symptoms?: ISymptom[];
  tags?: string[];
  promptId?: string;
  promptText?: string;
}

export interface UpdateEntryData {
  content?: string;
  mood?: number;
  symptoms?: ISymptom[];
  tags?: string[];
}

class JournalService {
  // Get all journal entries with optional filters
  async getEntries(
    page: number = 1,
    limit: number = 20,
    options?: {
      startDate?: string;
      endDate?: string;
      mood?: number;
      tag?: string;
    }
  ): Promise<ApiResponse<JournalEntry[]>> {
    let endpoint = `/journal?page=${page}&limit=${limit}`;
    
    if (options?.startDate) {
      endpoint += `&startDate=${options.startDate}`;
    }
    if (options?.endDate) {
      endpoint += `&endDate=${options.endDate}`;
    }
    if (options?.mood !== undefined) {
      endpoint += `&mood=${options.mood}`;
    }
    if (options?.tag) {
      endpoint += `&tag=${options.tag}`;
    }
    
    return apiService.get<JournalEntry[]>(endpoint);
  }

  // Get single entry
  async getEntry(id: string): Promise<ApiResponse<JournalEntry>> {
    return apiService.get<JournalEntry>(`/journal/${id}`);
  }

  // Create new entry
  async createEntry(data: CreateEntryData): Promise<ApiResponse<JournalEntry>> {
    return apiService.post<JournalEntry>('/journal', data);
  }

  // Update entry
  async updateEntry(id: string, data: UpdateEntryData): Promise<ApiResponse<JournalEntry>> {
    return apiService.put<JournalEntry>(`/journal/${id}`, data);
  }

  // Delete entry
  async deleteEntry(id: string): Promise<ApiResponse<void>> {
    return apiService.delete(`/journal/${id}`);
  }

  // Get insights and patterns
  async getInsights(days: number = 30): Promise<ApiResponse<JournalInsights>> {
    return apiService.get<JournalInsights>(`/journal/insights?days=${days}`);
  }

  // Get personalized prompt
  async getPrompt(): Promise<ApiResponse<JournalPrompt>> {
    return apiService.get<JournalPrompt>('/journal/prompt');
  }

  // Trigger AI analysis on entry
  async analyzeEntry(id: string): Promise<ApiResponse<JournalEntry>> {
    return apiService.post<JournalEntry>(`/journal/${id}/analyze`, {});
  }

  // Get journal context for Aurora
  async getAuroraContext(limit: number = 5): Promise<ApiResponse<AuroraJournalContext[]>> {
    return apiService.get<AuroraJournalContext[]>(`/journal/aurora-context?limit=${limit}`);
  }
}

export const journalService = new JournalService();





