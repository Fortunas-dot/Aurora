import Anthropic from '@anthropic-ai/sdk';

// Centralized Claude client for the backend.
// Reads API key from process.env.ANTHROPIC_API_KEY (set in Railway + local .env).

let claudeClient: Anthropic | null = null;

export const getClaudeClient = (): Anthropic => {
  if (!claudeClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }
    claudeClient = new Anthropic({
      apiKey,
    });
  }

  return claudeClient;
};

