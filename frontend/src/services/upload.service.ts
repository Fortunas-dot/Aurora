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

      // Upload to server
      const baseUrl = apiService.getBaseUrl();
      const uploadUrl = `${baseUrl}/upload`;
      
      // For large video uploads on native devices, use FileSystem.uploadAsync
      // This is more reliable than fetch + FormData for big files on iOS/Android
      if (type === 'video' && Platform.OS !== 'web') {
        try {
          const uploadResult = await FileSystem.uploadAsync(uploadUrl, uri, {
            httpMethod: 'POST',
            uploadType: FileSystem.FileSystemUploadType.MULTIPART,
            fieldName: 'file',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (uploadResult.status < 200 || uploadResult.status >= 300) {
            const errorText = uploadResult.body || '';
            let errorMessage = `Upload failed: HTTP ${uploadResult.status}`;

            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.message || errorMessage;
            } catch {
              if (errorText.includes('<!DOCTYPE') || errorText.includes('<html>')) {
                const titleMatch = errorText.match(/<title>(.*?)<\/title>/i);
                const h1Match = errorText.match(/<h1>(.*?)<\/h1>/i);
                const pMatch = errorText.match(/<p>(.*?)<\/p>/i);

                if (uploadResult.status === 503) {
                  errorMessage =
                    'Server is temporarily unavailable. The video may be too large or the server is experiencing issues. Please try again later or use a smaller video.';
                } else if (titleMatch) {
                  errorMessage = titleMatch[1];
                } else if (h1Match) {
                  errorMessage = h1Match[1];
                } else if (pMatch) {
                  errorMessage = pMatch[1];
                } else {
                  errorMessage = errorText.substring(0, 200);
                }
              } else if (errorText) {
                errorMessage = errorText;
              }
            }

            if (uploadResult.status === 503) {
              errorMessage =
                'Server is temporarily unavailable. The video may be too large or the server is experiencing issues. Please try again later or use a smaller video.';
            } else if (uploadResult.status === 413) {
              errorMessage = 'File is too large. Maximum size is 50MB.';
            } else if (uploadResult.status === 500) {
              errorMessage = 'Server error occurred while uploading. Please try again.';
            }

            return {
              success: false,
              message: errorMessage,
            };
          }

          let result: any;
          try {
            result = JSON.parse(uploadResult.body);
          } catch {
            return {
              success: false,
              message: 'Upload failed: Invalid server response',
            };
          }

          if (result.success && result.data?.url) {
            // Always convert relative URL to absolute URL
            let absoluteUrl = result.data.url;
            if (!absoluteUrl.startsWith('http://') && !absoluteUrl.startsWith('https://')) {
              // Remove /api from baseUrl if present, then append the relative URL
              const baseUrlWithoutApi = baseUrl.replace('/api', '');
              // Ensure the relative URL starts with /
              const relativeUrl = absoluteUrl.startsWith('/') ? absoluteUrl : `/${absoluteUrl}`;
              absoluteUrl = `${baseUrlWithoutApi}${relativeUrl}`;
            }

            console.log(`📤 Upload successful: ${absoluteUrl}`);

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
        } catch (nativeError: any) {
          console.error('📤 Error uploading video with FileSystem.uploadAsync:', nativeError);
          let errorMessage = 'Upload failed';
          if (nativeError.message?.includes('Network request failed')) {
            errorMessage = 'Network error. Please check your internet connection and try again.';
          } else if (nativeError.message?.includes('timeout')) {
            errorMessage =
              'Video upload timed out. The video may be too large or your connection is too slow. Please try a smaller video or check your internet connection.';
          } else if (nativeError.message) {
            errorMessage = nativeError.message;
          }

          return {
            success: false,
            message: errorMessage,
          };
        }
      }

      // Create form data (used for images, audio, and web uploads)
      const formData = new FormData();
      
      // Handle iOS file URI format - React Native FormData needs the full file:// URI on iOS
      // On Android, we can use the URI as-is
      const fileUri = uri;
      
      formData.append('file', {
        uri: fileUri,
        type: mimeType,
        name: `${type}-${Date.now()}.${fileExtension}`,
      } as any);

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
          let errorMessage = `Upload failed: HTTP ${response.status}`;
          
          try {
            errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorMessage;
          } catch {
            // Handle HTML error responses (like 503 from Varnish)
            if (errorText.includes('<!DOCTYPE') || errorText.includes('<html>')) {
              // Extract error message from HTML if possible
              const titleMatch = errorText.match(/<title>(.*?)<\/title>/i);
              const h1Match = errorText.match(/<h1>(.*?)<\/h1>/i);
              const pMatch = errorText.match(/<p>(.*?)<\/p>/i);
              
              if (response.status === 503) {
                errorMessage = 'Server is temporarily unavailable. The video may be too large or the server is experiencing issues. Please try again later or use a smaller video.';
              } else if (titleMatch) {
                errorMessage = titleMatch[1];
              } else if (h1Match) {
                errorMessage = h1Match[1];
              } else if (pMatch) {
                errorMessage = pMatch[1];
              } else {
                errorMessage = errorText.substring(0, 200); // First 200 chars
              }
            } else {
              errorMessage = errorText || errorMessage;
            }
          }
          
          // Provide specific error messages for common status codes
          if (response.status === 503) {
            errorMessage = 'Server is temporarily unavailable. The video may be too large or the server is experiencing issues. Please try again later or use a smaller video.';
          } else if (response.status === 413) {
            errorMessage = 'File is too large. Maximum size is 50MB.';
          } else if (response.status === 500) {
            errorMessage = 'Server error occurred while uploading. Please try again.';
          }
          
          return {
            success: false,
            message: errorMessage,
          };
        }

        const result = await response.json();
        
      if (result.success && result.data?.url) {
        // Always convert relative URL to absolute URL
        let absoluteUrl = result.data.url;
        if (!absoluteUrl.startsWith('http://') && !absoluteUrl.startsWith('https://')) {
          // Remove /api from baseUrl if present, then append the relative URL
          const baseUrlWithoutApi = baseUrl.replace('/api', '');
          // Ensure the relative URL starts with /
          const relativeUrl = absoluteUrl.startsWith('/') ? absoluteUrl : `/${absoluteUrl}`;
          absoluteUrl = `${baseUrlWithoutApi}${relativeUrl}`;
        }
        
        console.log(`📤 Upload successful: ${absoluteUrl}`);
        
        return {
          success: true,
          data: {
            ...result.data,
            url: absoluteUrl, // Always return absolute URL
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
