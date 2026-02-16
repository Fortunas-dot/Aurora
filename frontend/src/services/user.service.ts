import { apiService, ApiResponse } from './api.service';

export interface UserProfile {
  _id: string;
  username: string;
  displayName?: string;
  avatar?: string;
  avatarCharacter?: string;
  avatarBackgroundColor?: string;
  bio?: string;
  email?: string;
  postCount: number;
  followersCount?: number;
  followingCount?: number;
  totalLikes?: number;
  totalComments?: number;
  isFollowing?: boolean;
  isBlocked?: boolean;
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
    avatarCharacter?: string;
    avatarBackgroundColor?: string;
    isAnonymous?: boolean;
    showEmail?: boolean;
    email?: string;
    phoneNumber?: string;
    healthInfo?: {
      mentalHealth?: Array<{ condition: string; type?: string; severity: 'mild' | 'moderate' | 'severe' }>;
      physicalHealth?: Array<{ condition: string; type?: string; severity: 'mild' | 'moderate' | 'severe' }>;
      medications?: string[];
      therapies?: string[];
    };
  }): Promise<ApiResponse<UserProfile>> {
    return apiService.put<UserProfile>('/users/profile', data);
  }

  async followUser(userId: string): Promise<ApiResponse<{ isFollowing: boolean }>> {
    return apiService.post<{ isFollowing: boolean }>(`/users/${userId}/follow`, {});
  }

  async getFollowers(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<UserProfile[]>> {
    return apiService.get<UserProfile[]>(
      `/users/${userId}/followers?page=${page}&limit=${limit}`
    );
  }

  async getFollowing(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<UserProfile[]>> {
    return apiService.get<UserProfile[]>(
      `/users/${userId}/following?page=${page}&limit=${limit}`
    );
  }

  async blockUser(userId: string): Promise<ApiResponse<{ isBlocked: boolean }>> {
    return apiService.post<{ isBlocked: boolean }>(`/users/${userId}/block`, {});
  }

  async getBlockedUsers(): Promise<ApiResponse<UserProfile[]>> {
    return apiService.get<UserProfile[]>('/users/blocked');
  }

  async deleteAccount(): Promise<ApiResponse<void>> {
    return apiService.delete<void>('/users/account');
  }
}

export const userService = new UserService();

