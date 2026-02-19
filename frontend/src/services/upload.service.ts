import { Platform } from 'react-native';
import { secureStorage } from '../utils/secureStorage';
import { API_CONFIG } from './api.service';

export interface UploadResponse {
  success: boolean;
  data?: {
    url: string;
    filename: string;
    mimetype: string;
    size: number;
  };
  message?: string;
}

class UploadService {
  /**
   * Upload a file (image or video) to the server
   * @param uri Local file URI
   * @param type MIME type of the file
   * @returns Upload response with file URL
   */
  async uploadFile(uri: string, type: 'image' | 'video'): Promise<UploadResponse> {
    try {
      const token = await secureStorage.getItemAsync('auth_token');
      
      if (!token) {
        console.error('📤 No auth token found for upload');
        return {
          success: false,
          message: 'Not authenticated',
        };
      }

      // Get file extension from URI
      const uriParts = uri.split('.');
      const fileExtension = uriParts[uriParts.length - 1].toLowerCase();
      
      // Determine MIME type
      let mimeType = 'image/jpeg';
      if (type === 'video') {
        mimeType = fileExtension === 'mov' ? 'video/quicktime' : 'video/mp4';
      } else {
        if (fileExtension === 'png') {
          mimeType = 'image/png';
        } else if (fileExtension === 'gif') {
          mimeType = 'image/gif';
        } else if (fileExtension === 'webp') {
          mimeType = 'image/webp';
        }
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        type: mimeType,
        name: `${type}-${Date.now()}.${fileExtension}`,
      } as any);

      // Upload to server
      const uploadUrl = `${API_CONFIG.BASE_URL}/upload`;
      console.log('📤 Uploading file to:', uploadUrl);
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData - browser will set it with boundary
        },
        body: formData,
      });

      console.log('📤 Upload response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('📤 Upload failed:', response.status, errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || `HTTP ${response.status}` };
        }
        return {
          success: false,
          message: errorData.message || `Upload failed: ${response.status}`,
        };
      }

      const result = await response.json();
      console.log('📤 Upload result:', result);

      if (result.success && result.data?.url) {
        // Convert relative URL to absolute URL
        const absoluteUrl = result.data.url.startsWith('http') 
          ? result.data.url 
          : `${API_CONFIG.BASE_URL.replace('/api', '')}${result.data.url}`;
        
        return {
          success: true,
          data: {
            ...result.data,
            url: absoluteUrl,
          },
        };
      }

      return {
        success: false,
        message: result.message || 'Upload failed - no URL returned',
      };
    } catch (error: any) {
      console.error('📤 Error uploading file:', error);
      return {
        success: false,
        message: error.message || 'Upload failed',
      };
    }
  }

  /**
   * Upload an image
   */
  async uploadImage(uri: string): Promise<UploadResponse> {
    return this.uploadFile(uri, 'image');
  }

  /**
   * Upload a video
   */
  async uploadVideo(uri: string): Promise<UploadResponse> {
    return this.uploadFile(uri, 'video');
  }

  /**
   * Upload multiple files
   */
  async uploadMultiple(files: Array<{ uri: string; type: 'image' | 'video' }>): Promise<UploadResponse[]> {
    const results = await Promise.all(
      files.map(file => this.uploadFile(file.uri, file.type))
    );
    return results;
  }
}

export const uploadService = new UploadService();
