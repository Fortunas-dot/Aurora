import OpenAI from 'openai';

// Centralized OpenAI client for the backend.
// Reads API key from process.env.OPENAI_API_KEY (set in Railway + local .env).

let openaiClient: OpenAI | null = null;

export const getOpenAIClient = (): OpenAI => {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }
    openaiClient = new OpenAI({ apiKey });
  }

  return openaiClient;
};
