import { Platform } from 'react-native';
import { secureStorage } from '../utils/secureStorage';
import { apiService } from './api.service';

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
   * Upload a file (image, video, or audio) to the server
   * @param uri Local file URI
   * @param type MIME type of the file
   * @returns Upload response with file URL
   */
  async uploadFile(uri: string, type: 'image' | 'video' | 'audio'): Promise<UploadResponse> {
    try {
      const token = await secureStorage.getItemAsync('auth_token');
      
      if (!token) {
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
      } else if (type === 'audio') {
        // Audio MIME types based on extension
        if (fileExtension === 'm4a') {
          mimeType = 'audio/x-m4a'; // Use x-m4a for better compatibility
        } else if (fileExtension === 'mp4') {
          mimeType = 'audio/mp4';
        } else if (fileExtension === 'mp3') {
          mimeType = 'audio/mpeg';
        } else if (fileExtension === 'wav') {
          mimeType = 'audio/wav';
        } else if (fileExtension === 'aac') {
          mimeType = 'audio/aac';
        } else if (fileExtension === 'ogg') {
          mimeType = 'audio/ogg';
        } else {
          // Default to x-m4a for iOS recordings
          mimeType = 'audio/x-m4a';
        }
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
      
      // Handle iOS file URI format - React Native FormData needs the full file:// URI on iOS
      // On Android, we can use the URI as-is
      const fileUri = uri;
      
      formData.append('file', {
        uri: fileUri,
        type: mimeType,
        name: `${type}-${Date.now()}.${fileExtension}`,
      } as any);


      // Upload to server
      const baseUrl = apiService.getBaseUrl();
      const uploadUrl = `${baseUrl}/upload`;
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData - browser will set it with boundary
        },
        body: formData,
      });


      if (!response.ok) {
        const errorText = await response.text();
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
      

      if (result.success && result.data?.url) {
        // Convert relative URL to absolute URL
        const absoluteUrl = result.data.url.startsWith('http') 
          ? result.data.url 
          : `${baseUrl.replace('/api', '')}${result.data.url}`;
        
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
   * Upload an audio file
   */
  async uploadAudio(uri: string): Promise<UploadResponse> {
    return this.uploadFile(uri, 'audio');
  }

  /**
   * Upload multiple files
   */
  async uploadMultiple(files: Array<{ uri: string; type: 'image' | 'video' | 'audio' }>): Promise<UploadResponse[]> {
    const results = await Promise.all(
      files.map(file => this.uploadFile(file.uri, file.type))
    );
    return results;
  }
}

export const uploadService = new UploadService();
