import 'react-native-url-polyfill/auto';
import EventSource from 'react-native-sse';
import { OpenAIMessage, StreamingOptions } from '../types/chat.types';
import { apiService } from './api.service';

/**
 * OpenAI Service that routes through the backend
 * This keeps the API key secure on the server side
 */
export class OpenAIService {
  private baseUrl: string;

  constructor() {
    // Get API URL from the apiService
    this.baseUrl = apiService.getBaseUrl();
  }

  /**
   * Stream chat completion through backend
   */
  async streamChatCompletion(
    messages: OpenAIMessage[],
    onChunk: (text: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void,
    options: Partial<StreamingOptions> = {}
  ): Promise<() => void> {
    // Get auth token
    const token = await apiService.getAuthToken();
    
    if (!token) {
      onError(new Error('Authentication required'));
      return () => {};
    }

    const streamUrl = `${this.baseUrl}/ai/chat`;

    const eventSource = new EventSource(streamUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        messages: messages.filter(m => m.role !== 'system'), // System message is built on backend
        context: {
          // Context will be fetched on backend from user data
        },
      }),
      pollingInterval: 0, // Disable automatic reconnections
    });

    let streamOpened = false;
    const openTimeout = setTimeout(() => {
      if (!streamOpened) {
        console.error('Chat stream failed to open within 15 seconds');
        eventSource.close();
        onError(new Error('Connection timeout. Please check your internet connection and try again.'));
      }
    }, 15000); // 15 second timeout for stream to open

    eventSource.addEventListener('open', () => {
      streamOpened = true;
      clearTimeout(openTimeout);
      console.log('Chat stream opened');
    });

    eventSource.addEventListener('message', (event: any) => {
      if (event.data === '[DONE]') {
        console.log('Chat stream completed');
        eventSource.close();
        onComplete();
        return;
      }

      try {
        const parsed = JSON.parse(event.data);
        
        // Check for error in stream
        if (parsed.error) {
          console.error('Stream error:', parsed.error);
          eventSource.close();
          onError(new Error(parsed.error));
          return;
        }

        const content = parsed.content;
        if (content) {
          onChunk(content);
        }
      } catch (err) {
        console.error('Error parsing chat response:', err);
      }
    });

    eventSource.addEventListener('error', (event: any) => {
      clearTimeout(openTimeout);
      console.error('Chat stream error:', event);
      eventSource.close();

      // Try to extract error message
      let errorMessage = 'Failed to stream response';

      if (event.message) {
        errorMessage = event.message;
      } else if (event.data) {
        try {
          const errorData = JSON.parse(event.data);
          errorMessage = errorData.message || errorData.error?.message || errorMessage;
        } catch {
          // Ignore parse errors
        }
      }

      onError(new Error(errorMessage));
    });

    // Return cleanup function
    return () => {
      clearTimeout(openTimeout);
      console.log('Closing chat stream');
      eventSource.close();
    };
  }

  /**
   * Send a single message and get a complete response (non-streaming)
   */
  async sendMessage(
    messages: OpenAIMessage[],
    options: Partial<StreamingOptions> = {}
  ): Promise<string> {
    const {
      maxTokens,
    } = options;

    try {
      const response = await apiService.post<{ content: string; usage?: any }>('/ai/chat/complete', {
          messages,
        maxTokens,
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to get response');
      }

      return response.data?.content || '';
    } catch (error: any) {
      console.error('Error sending message:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const openAIService = new OpenAIService();
