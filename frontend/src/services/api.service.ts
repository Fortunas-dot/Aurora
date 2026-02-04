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
        // Only log non-404 errors to reduce noise
        if (response.status !== 404) {
          console.error('API GET Error:', response.status, errorData);
        }
        
        // For 401 errors, include status in response for token cleanup
        const apiResponse: ApiResponse<T> = {
          success: false,
          message: errorData.message || `HTTP ${response.status}`,
        };
        
        // Attach status code for error handling
        (apiResponse as any).status = response.status;
        
        return apiResponse;
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
      
      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      if (!response.ok) {
        let errorData: any = {};
        if (isJson) {
          try {
            errorData = await response.json();
          } catch {
            // If JSON parsing fails, use status text
            errorData = { message: response.statusText || `HTTP ${response.status}` };
          }
        } else {
          // If not JSON, read as text to avoid parse errors
          const text = await response.text();
          errorData = { message: text || response.statusText || `HTTP ${response.status}` };
        }
        
        // Only log non-404 errors to reduce noise
        if (response.status !== 404) {
          console.error('API POST Error:', response.status, errorData);
        }
        
        const apiResponse: ApiResponse<T> = {
          success: false,
          message: errorData.message || `HTTP ${response.status}`,
        };
        
        // Attach status code for error handling
        (apiResponse as any).status = response.status;
        
        return apiResponse;
      }
      
      // Parse JSON response
      if (isJson) {
        const data = await response.json();
        return data;
      } else {
        // If response is not JSON, return error
        const text = await response.text();
        return {
          success: false,
          message: `Expected JSON response but received: ${contentType || 'unknown'}`,
        };
      }
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
      
      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      if (!response.ok) {
        let errorData: any = {};
        if (isJson) {
          try {
            errorData = await response.json();
          } catch {
            errorData = { message: response.statusText || `HTTP ${response.status}` };
          }
        } else {
          const text = await response.text();
          errorData = { message: text || response.statusText || `HTTP ${response.status}` };
        }
        
        if (response.status !== 404) {
          console.error('API PUT Error:', response.status, errorData);
        }
        
        const apiResponse: ApiResponse<T> = {
          success: false,
          message: errorData.message || `HTTP ${response.status}`,
        };
        
        (apiResponse as any).status = response.status;
        return apiResponse;
      }
      
      if (isJson) {
        const data = await response.json();
        return data;
      } else {
        const text = await response.text();
        return {
          success: false,
          message: `Expected JSON response but received: ${contentType || 'unknown'}`,
        };
      }
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
      
      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      if (!response.ok) {
        let errorData: any = {};
        if (isJson) {
          try {
            errorData = await response.json();
          } catch {
            errorData = { message: response.statusText || `HTTP ${response.status}` };
          }
        } else {
          const text = await response.text();
          errorData = { message: text || response.statusText || `HTTP ${response.status}` };
        }
        
        if (response.status !== 404) {
          console.error('API DELETE Error:', response.status, errorData);
        }
        
        const apiResponse: ApiResponse<T> = {
          success: false,
          message: errorData.message || `HTTP ${response.status}`,
        };
        
        (apiResponse as any).status = response.status;
        return apiResponse;
      }
      
      // For DELETE, response might be empty (204 No Content)
      if (response.status === 204 || !isJson) {
        return {
          success: true,
        };
      }
      
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

