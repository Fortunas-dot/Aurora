import 'react-native-url-polyfill/auto';
import EventSource from 'react-native-sse';
import Constants from 'expo-constants';
import { OpenAIMessage, StreamingOptions } from '../types/chat.types';

const OPENAI_API_KEY = Constants.expoConfig?.extra?.OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export class OpenAIService {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || OPENAI_API_KEY;

    if (!this.apiKey) {
      console.warn('OpenAI API key not found. Please set OPENAI_API_KEY in .env file');
    }
  }

  /**
   * Stream chat completion from OpenAI
   */
  async streamChatCompletion(
    messages: OpenAIMessage[],
    onChunk: (text: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void,
    options: Partial<StreamingOptions> = {}
  ): Promise<() => void> {
    const {
      model = 'gpt-4o-mini',
      temperature = 0.7,
      maxTokens,
    } = options;

    const requestBody = {
      model,
      messages,
      stream: true,
      temperature,
      ...(maxTokens && { max_tokens: maxTokens }),
    };

    const eventSource = new EventSource(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(requestBody),
      pollingInterval: 0, // Disable automatic reconnections
    });

    eventSource.addEventListener('open', () => {
      console.log('OpenAI stream opened');
    });

    eventSource.addEventListener('message', (event: any) => {
      if (event.data === '[DONE]') {
        console.log('OpenAI stream completed');
        eventSource.close();
        onComplete();
        return;
      }

      try {
        const parsed = JSON.parse(event.data);
        const content = parsed.choices[0]?.delta?.content;

        if (content) {
          onChunk(content);
        }
      } catch (err) {
        console.error('Error parsing OpenAI response:', err);
      }
    });

    eventSource.addEventListener('error', (event: any) => {
      console.error('OpenAI stream error:', event);
      eventSource.close();

      // Try to extract error message
      let errorMessage = 'Failed to stream response from OpenAI';

      if (event.message) {
        errorMessage = event.message;
      } else if (event.data) {
        try {
          const errorData = JSON.parse(event.data);
          errorMessage = errorData.error?.message || errorMessage;
        } catch {
          // Ignore parse errors
        }
      }

      onError(new Error(errorMessage));
    });

    // Return cleanup function
    return () => {
      console.log('Closing OpenAI stream');
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
      model = 'gpt-4o-mini',
      temperature = 0.7,
      maxTokens,
    } = options;

    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          ...(maxTokens && { max_tokens: maxTokens }),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to get response from OpenAI');
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Error sending message to OpenAI:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const openAIService = new OpenAIService();
