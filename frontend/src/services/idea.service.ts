import { apiService, ApiResponse } from './api.service';

export interface Idea {
  _id: string;
  author: {
    _id: string;
    username: string;
    displayName?: string;
    avatar?: string;
  };
  title: string;
  description: string;
  category: 'feature' | 'improvement' | 'bug-fix' | 'design' | 'other';
  status: 'open' | 'in-progress' | 'completed' | 'rejected';
  upvotes: string[];
  downvotes: string[];
  upvotesCount?: number;
  downvotesCount?: number;
  voteScore?: number;
  hasUpvoted?: boolean;
  hasDownvoted?: boolean;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIdeaData {
  title: string;
  description: string;
  category?: 'feature' | 'improvement' | 'bug-fix' | 'design' | 'other';
}

class IdeaService {
  async getIdeas(params: {
    page?: number;
    limit?: number;
    sortBy?: 'recent' | 'popular' | 'trending';
    category?: string;
    status?: string;
  } = {}): Promise<ApiResponse<Idea[]>> {
    const { page = 1, limit = 20, sortBy = 'recent', category, status } = params;
    let endpoint = `/ideas?page=${page}&limit=${limit}&sortBy=${sortBy}`;
    if (category && category !== 'all') endpoint += `&category=${category}`;
    if (status && status !== 'all') endpoint += `&status=${status}`;
    return apiService.get<Idea[]>(endpoint);
  }

  async getIdea(id: string): Promise<ApiResponse<Idea>> {
    return apiService.get<Idea>(`/ideas/${id}`);
  }

  async createIdea(data: CreateIdeaData): Promise<ApiResponse<Idea>> {
    return apiService.post<Idea>('/ideas', data);
  }

  async upvoteIdea(id: string): Promise<ApiResponse<{
    hasUpvoted: boolean;
    hasDownvoted: boolean;
    upvotesCount: number;
    downvotesCount: number;
    voteScore: number;
  }>> {
    return apiService.post(`/ideas/${id}/upvote`, {});
  }

  async downvoteIdea(id: string): Promise<ApiResponse<{
    hasUpvoted: boolean;
    hasDownvoted: boolean;
    upvotesCount: number;
    downvotesCount: number;
    voteScore: number;
  }>> {
    return apiService.post(`/ideas/${id}/downvote`, {});
  }
}

export const ideaService = new IdeaService();

