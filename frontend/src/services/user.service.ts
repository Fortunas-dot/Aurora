import { apiService, ApiResponse } from './api.service';

export interface UserProfile {
  _id: string;
  username: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  email?: string;
  postCount: number;
  createdAt: string;
  healthInfo?: {
    mentalHealth?: Array<{ condition: string; type?: string; severity: 'mild' | 'moderate' | 'severe' }>;
    physicalHealth?: Array<{ condition: string; type?: string; severity: 'mild' | 'moderate' | 'severe' }>;
    medications?: string[];
    therapies?: string[];
  };
}

class UserService {
  async getUserProfile(userId: string): Promise<ApiResponse<UserProfile>> {
    return apiService.get<UserProfile>(`/users/${userId}`);
  }

  async searchUsers(
    query: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<UserProfile[]>> {
    return apiService.get<UserProfile[]>(
      `/users/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
    );
  }

  async updateProfile(data: {
    username?: string;
    displayName?: string;
    bio?: string;
    avatar?: string;
    isAnonymous?: boolean;
    showEmail?: boolean;
    healthInfo?: {
      mentalHealth?: Array<{ condition: string; type?: string; severity: 'mild' | 'moderate' | 'severe' }>;
      physicalHealth?: Array<{ condition: string; type?: string; severity: 'mild' | 'moderate' | 'severe' }>;
      medications?: string[];
      therapies?: string[];
    };
  }): Promise<ApiResponse<UserProfile>> {
    return apiService.put<UserProfile>('/users/profile', data);
  }
}

export const userService = new UserService();

