import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
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
      console.log(`📤 Starting ${type} upload from:`, uri);
      
      // Check file size before uploading (max 50MB)
      try {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (fileInfo.exists && 'size' in fileInfo) {
          const fileSizeMB = fileInfo.size / (1024 * 1024);
          console.log(`📊 File size: ${fileSizeMB.toFixed(2)} MB`);
          
          if (fileSizeMB > 50) {
            return {
              success: false,
              message: `File is too large (${fileSizeMB.toFixed(2)} MB). Maximum size is 50 MB.`,
            };
          }
        }
      } catch (fileInfoError) {
        console.warn('Could not check file size:', fileInfoError);
        // Continue with upload even if we can't check file size
      }
      
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
      
      // Create an AbortController for timeout handling (especially important for large video files)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, type === 'video' ? 300000 : 60000); // 5 minutes for videos, 1 minute for images/audio
      
      try {
        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            // Don't set Content-Type for FormData - browser will set it with boundary
          },
          body: formData,
          signal: controller.signal, // Add abort signal for timeout
        });
        
        clearTimeout(timeoutId); // Clear timeout if request completes


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
      } catch (fetchError: any) {
        clearTimeout(timeoutId); // Ensure timeout is cleared
        if (fetchError.name === 'AbortError') {
          console.error('📤 Upload timeout:', type, uri);
          return {
            success: false,
            message: type === 'video' 
              ? 'Video upload timed out. The video may be too large or your connection is too slow. Please try a smaller video or check your internet connection.'
              : 'Upload timed out. Please check your connection and try again.',
          };
        }
        throw fetchError; // Re-throw to be caught by outer catch
      }
    } catch (error: any) {
      console.error('📤 Error uploading file:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Upload failed';
      if (error.message?.includes('Network request failed')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = type === 'video'
          ? 'Video upload timed out. The video may be too large. Please try a smaller video.'
          : 'Upload timed out. Please try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        message: errorMessage,
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
