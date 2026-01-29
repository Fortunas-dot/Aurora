import * as SecureStore from 'expo-secure-store';
import { apiService, ApiResponse } from './api.service';

export interface User {
  _id: string;
  email: string;
  username: string;
  displayName?: string;
  avatar?: string;
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
    await SecureStore.setItemAsync('auth_token', token);
  }

  async getToken(): Promise<string | null> {
    return SecureStore.getItemAsync('auth_token');
  }

  async removeToken(): Promise<void> {
    await SecureStore.deleteItemAsync('auth_token');
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }
}

export const authService = new AuthService();

