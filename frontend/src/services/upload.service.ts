import * as SecureStore from 'expo-secure-store';
import { getApiUrl } from '../utils/apiUrl';

export interface UploadResponse {
  url: string;
  filename: string;
  mimetype: string;
  size: number;
}

class UploadService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getApiUrl();
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await SecureStore.getItemAsync('auth_token');
    const headers: HeadersInit = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  async uploadImage(uri: string): Promise<{ success: boolean; data?: UploadResponse; message?: string }> {
    try {
      const headers = await this.getAuthHeaders();
      
      // Create form data
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('file', {
        uri,
        name: filename,
        type,
      } as any);

      const response = await fetch(`${this.baseUrl}/upload`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('Upload error:', error);
      return {
        success: false,
        message: error.message || 'Error uploading image',
      };
    }
  }

  async uploadVideo(uri: string): Promise<{ success: boolean; data?: UploadResponse; message?: string }> {
    try {
      const headers = await this.getAuthHeaders();
      
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'video.mp4';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `video/${match[1]}` : 'video/mp4';

      formData.append('file', {
        uri,
        name: filename,
        type,
      } as any);

      const response = await fetch(`${this.baseUrl}/upload`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('Upload error:', error);
      return {
        success: false,
        message: error.message || 'Error uploading video',
      };
    }
  }

  getFullUrl(relativeUrl: string): string {
    const baseUrl = this.baseUrl.replace('/api', '');
    return `${baseUrl}${relativeUrl}`;
  }
}

export const uploadService = new UploadService();

