import { secureStorage } from '../utils/secureStorage';
import { apiService, ApiResponse } from './api.service';

export interface User {
  _id: string;
  email: string;
  username: string;
  displayName?: string;
  avatar?: string;
  avatarCharacter?: string;
  avatarBackgroundColor?: string;
  bio?: string;
  isAnonymous: boolean;
  showEmail: boolean;
  healthInfo?: {
    mentalHealth?: Array<{ condition: string; type?: string; severity: 'mild' | 'moderate' | 'severe' }>;
    physicalHealth?: Array<{ condition: string; type?: string; severity: 'mild' | 'moderate' | 'severe' }>;
    medications?: string[];
    therapies?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

class AuthService {
  async register(
    email: string,
    password: string,
    username: string,
    displayName?: string
  ): Promise<ApiResponse<AuthResponse>> {
    const response = await apiService.post<AuthResponse>('/auth/register', {
      email,
      password,
      username,
      displayName,
    });

    if (response.success && response.data?.token) {
      await this.saveToken(response.data.token);
    }

    return response;
  }

  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    const response = await apiService.post<AuthResponse>('/auth/login', {
      email,
      password,
    });

    if (response.success && response.data?.token) {
      await this.saveToken(response.data.token);
    }

    return response;
  }

  async logout(): Promise<void> {
    await apiService.post('/auth/logout', {});
    await this.removeToken();
  }

  async getMe(): Promise<ApiResponse<User>> {
    return apiService.get<User>('/auth/me');
  }

  async saveToken(token: string): Promise<void> {
    try {
      await secureStorage.setItemAsync('auth_token', token);
      console.log('✅ Token saved successfully');
    } catch (error) {
      console.error('❌ Error saving token:', error);
      throw error;
    }
  }

  async getToken(): Promise<string | null> {
    try {
      const token = await secureStorage.getItemAsync('auth_token');
      if (token) {
        console.log('✅ Token retrieved successfully');
      } else {
        console.log('⚠️ No token found in storage');
      }
      return token;
    } catch (error) {
      console.error('❌ Error getting token:', error);
      return null;
    }
  }

  async removeToken(): Promise<void> {
    await secureStorage.deleteItemAsync('auth_token');
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }

  async loginWithFacebook(accessToken: string, userInfo: any): Promise<ApiResponse<AuthResponse>> {
    const response = await apiService.post<AuthResponse>('/auth/facebook', {
      accessToken,
      email: userInfo.email,
      name: userInfo.name,
      facebookId: userInfo.id,
      picture: userInfo.picture,
    });

    if (response.success && response.data?.token) {
      await this.saveToken(response.data.token);
    }

    return response;
  }
}

export const authService = new AuthService();

