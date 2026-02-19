import { apiService, ApiResponse } from './api.service';
import { User } from './auth.service';

export type SeverityLevel = 'mild' | 'moderate' | 'severe';

export interface Journal {
  _id: string;
  name: string;
  description?: string;
  owner: User | string;
  isPublic: boolean;
  topics?: string[];
  followers: string[];
  followersCount: number;
  entriesCount: number;
  coverImage?: string;
  isFollowing?: boolean;
  isOwner?: boolean;
  createdAt: string;
  updatedAt: string;
}

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

export interface MediaItem {
  type: 'image' | 'video';
  url: string;
}

export interface JournalEntry {
  _id: string;
  author: string;
  journal: string | Journal;
  content: string;
  audioUrl?: string;
  transcription?: string;
  media?: MediaItem[]; // Images and videos attached to entry
  mood: number;
  symptoms: ISymptom[];
  tags: string[];
  promptId?: string;
  promptText?: string;
  aiInsights?: IAIInsights;
  fontFamily?: string; // Font family used for this entry
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

export interface ChatContext {
  importantPoints: string[];
  summary?: string;
  sessionDate: string;
}

export interface AuroraContextResponse {
  journalEntries: AuroraJournalContext[];
  calendarEvents?: any[];
  chatContext?: ChatContext[];
}

export interface CreateEntryData {
  content: string;
  mood: number;
  journalId: string;
  audioUrl?: string;
  transcription?: string;
  media?: MediaItem[]; // Images and videos to attach
  symptoms?: ISymptom[];
  tags?: string[];
  promptId?: string;
  promptText?: string;
  fontFamily?: string; // Font family to use for this entry
}

export interface CreateJournalData {
  name: string;
  description?: string;
  isPublic: boolean;
  coverImage?: string;
  topics?: string[];
}

export interface UpdateEntryData {
  content?: string;
  mood?: number;
  symptoms?: ISymptom[];
  tags?: string[];
}

class JournalService {
  // ==================== JOURNAL CRUD ====================
  
  // Create a new journal
  async createJournal(data: CreateJournalData): Promise<ApiResponse<Journal>> {
    return apiService.post<Journal>('/journals', data);
  }

  // Get user's journals
  async getUserJournals(page: number = 1, limit: number = 20): Promise<ApiResponse<Journal[]>> {
    return apiService.get<Journal[]>(`/journals?page=${page}&limit=${limit}`);
  }

  // Get public journals
  async getPublicJournals(page: number = 1, limit: number = 20, search?: string): Promise<ApiResponse<Journal[]>> {
    let endpoint = `/journals/public?page=${page}&limit=${limit}`;
    if (search) {
      endpoint += `&search=${encodeURIComponent(search)}`;
    }
    return apiService.get<Journal[]>(endpoint);
  }

  // Get single journal
  async getJournal(id: string): Promise<ApiResponse<Journal>> {
    return apiService.get<Journal>(`/journals/${id}`);
  }

  // Update journal
  async updateJournal(id: string, data: Partial<CreateJournalData>): Promise<ApiResponse<Journal>> {
    return apiService.put<Journal>(`/journals/${id}`, data);
  }

  // Delete journal
  async deleteJournal(id: string): Promise<ApiResponse<void>> {
    return apiService.delete(`/journals/${id}`);
  }

  // Follow a journal
  async followJournal(id: string): Promise<ApiResponse<Journal>> {
    return apiService.post<Journal>(`/journals/${id}/follow`, {});
  }

  // Unfollow a journal
  async unfollowJournal(id: string): Promise<ApiResponse<Journal>> {
    return apiService.post<Journal>(`/journals/${id}/unfollow`, {});
  }

  // Get followed journals
  async getFollowingJournals(page: number = 1, limit: number = 20): Promise<ApiResponse<Journal[]>> {
    return apiService.get<Journal[]>(`/journals/following?page=${page}&limit=${limit}`);
  }

  // ==================== JOURNAL ENTRY CRUD ====================
  
  // Get all journal entries with optional filters
  async getEntries(
    page: number = 1,
    limit: number = 20,
    options?: {
      startDate?: string;
      endDate?: string;
      mood?: number;
      tag?: string;
      journalId?: string;
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
    if (options?.journalId) {
      endpoint += `&journalId=${options.journalId}`;
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

  // Get entries from followed journals
  async getFollowingEntries(page: number = 1, limit: number = 20): Promise<ApiResponse<JournalEntry[]>> {
    return apiService.get<JournalEntry[]>(`/journal/following?page=${page}&limit=${limit}`);
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
  // days: number of days to look back. Use 'all' to fetch insights for all time.
  async getInsights(
    days: number | 'all' = 30,
    journalId?: string,
    signal?: AbortSignal
  ): Promise<ApiResponse<JournalInsights>> {
    let endpoint = '/journal/insights';
    const params: string[] = [];

    if (days !== 'all') {
      params.push(`days=${days}`);
    }
    if (journalId) {
      params.push(`journalId=${journalId}`);
    }

    if (params.length > 0) {
      endpoint += `?${params.join('&')}`;
    }

    return apiService.get<JournalInsights>(endpoint, { signal });
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
  async getAuroraContext(limit: number = 5): Promise<ApiResponse<AuroraContextResponse>> {
    return apiService.get<AuroraContextResponse>(`/journal/aurora-context?limit=${limit}`);
  }

  // Finish chat session and extract important points
  // Routes through backend which has the OpenAI API key
  async finishChatSession(messages: Array<{ role: string; content: string }>): Promise<ApiResponse<{
    importantPoints: string[];
    summary: string;
    sessionDate: string;
  }>> {
    return apiService.post('/journal/finish-session', { messages });
  }
}

export const journalService = new JournalService();







