/**
 * OpenAI Service
 * Wrapper for OpenAI GPT-4 API with streaming support
 */

import OpenAI from 'openai';
import type { ChatCompletionMessageParam, ChatCompletionChunk } from 'openai/resources/chat';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface StreamChunk {
  content: string;
  isComplete: boolean;
}

export class OpenAIService {
  /**
   * Generate a streaming response from GPT-4
   */
  static async *streamCompletion(
    messages: ChatCompletionMessageParam[],
    temperature: number = 0.7
  ): AsyncGenerator<StreamChunk> {
    try {
      const stream = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages,
        temperature,
        stream: true,
        max_tokens: 500, // Keep responses concise for voice
      });

      let fullContent = '';

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';

        if (content) {
          fullContent += content;

          yield {
            content,
            isComplete: false,
          };
        }
      }

      // Signal completion
      yield {
        content: '',
        isComplete: true,
      };
    } catch (error) {
      console.error('OpenAI streaming error:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  /**
   * Generate a complete (non-streaming) response
   */
  static async generateCompletion(
    messages: ChatCompletionMessageParam[],
    temperature: number = 0.7
  ): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages,
        temperature,
        max_tokens: 500,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('OpenAI completion error:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  /**
   * Extract structured insights from conversation
   * Used for session memory
   */
  static async extractInsights(conversationText: string): Promise<any> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert therapist analyzing a therapy session.

Extract key insights from this session focusing on:
1. Emotional breakthroughs
2. Behavioral patterns
3. Cognitive shifts
4. Core values expressed
5. Goals set or discussed
6. Strengths demonstrated

Return a JSON array of insights with this structure:
{
  "insights": [
    {
      "type": "breakthrough|pattern|goal|value",
      "category": "emotional|behavioral|cognitive",
      "content": "Brief description",
      "emotionalContext": {
        "primaryEmotion": "anxiety|joy|sadness|etc",
        "intensity": 1-10,
        "triggers": ["trigger1", "trigger2"]
      },
      "importanceScore": 1-10,
      "tags": ["tag1", "tag2"]
    }
  ]
}`,
          },
          {
            role: 'user',
            content: conversationText,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const result = response.choices[0]?.message?.content;
      return result ? JSON.parse(result) : { insights: [] };
    } catch (error) {
      console.error('Insight extraction error:', error);
      return { insights: [] };
    }
  }

  /**
   * Generate session summary
   */
  static async generateSessionSummary(conversationText: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a therapist writing a brief session summary.

Summarize this therapy session in 2-3 sentences, focusing on:
- Main topics discussed
- Emotional themes
- Key insights or progress

Keep it concise, warm, and encouraging.`,
          },
          {
            role: 'user',
            content: conversationText,
          },
        ],
        temperature: 0.5,
        max_tokens: 150,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Summary generation error:', error);
      return 'Unable to generate summary.';
    }
  }
}
