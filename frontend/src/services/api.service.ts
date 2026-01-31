import * as SecureStore from 'expo-secure-store';
import { getApiUrl } from '../utils/apiUrl';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getApiUrl();
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await SecureStore.getItemAsync('auth_token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API GET Error:', response.status, errorData);
        return {
          success: false,
          message: errorData.message || `HTTP ${response.status}`,
        };
      }
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('API GET Error:', error);
      return {
        success: false,
        message: error.message || 'Network error',
      };
    }
  }

  async post<T = any>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('API POST Error:', error);
      return {
        success: false,
        message: error.message || 'Network error',
      };
    }
  }

  async put<T = any>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
      });
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('API PUT Error:', error);
      return {
        success: false,
        message: error.message || 'Network error',
      };
    }
  }

  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers,
      });
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('API DELETE Error:', error);
      return {
        success: false,
        message: error.message || 'Network error',
      };
    }
  }
}

export const apiService = new ApiService();
export type { ApiResponse };

