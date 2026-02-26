/**
 * Content Moderation Service
 * Uses OpenAI's moderation API to detect harmful content
 */

import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

const getOpenAI = (): OpenAI => {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
};

export interface ModerationResult {
  flagged: boolean;
  categories: {
    hate: boolean;
    hateThreatening: boolean;
    harassment: boolean;
    harassmentThreatening: boolean;
    selfHarm: boolean;
    selfHarmIntent: boolean;
    selfHarmInstructions: boolean;
    sexual: boolean;
    sexualMinors: boolean;
    violence: boolean;
    violenceGraphic: boolean;
  };
  categoryScores: {
    hate: number;
    hateThreatening: number;
    harassment: number;
    harassmentThreatening: number;
    selfHarm: number;
    selfHarmIntent: number;
    selfHarmInstructions: number;
    sexual: number;
    sexualMinors: number;
    violence: number;
    violenceGraphic: number;
  };
}

/**
 * Moderate user message content
 * Returns moderation result if content is flagged
 */
export const moderateContent = async (content: string): Promise<ModerationResult | null> => {
  try {
    const openai = getOpenAI();
    
    const moderation = await openai.moderations.create({
      input: content,
    });

    const result = moderation.results[0];
    
    if (!result.flagged) {
      return null;
    }

    return {
      flagged: true,
      categories: {
        hate: result.categories.hate || false,
        hateThreatening: result.categories['hate/threatening'] || false,
        harassment: result.categories.harassment || false,
        harassmentThreatening: result.categories['harassment/threatening'] || false,
        selfHarm: result.categories['self-harm'] || false,
        selfHarmIntent: result.categories['self-harm/intent'] || false,
        selfHarmInstructions: result.categories['self-harm/instructions'] || false,
        sexual: result.categories.sexual || false,
        sexualMinors: result.categories['sexual/minors'] || false,
        violence: result.categories.violence || false,
        violenceGraphic: result.categories['violence/graphic'] || false,
      },
      categoryScores: {
        hate: result.categoryScores.hate || 0,
        hateThreatening: result.categoryScores['hate/threatening'] || 0,
        harassment: result.categoryScores.harassment || 0,
        harassmentThreatening: result.categoryScores['harassment/threatening'] || 0,
        selfHarm: result.categoryScores['self-harm'] || 0,
        selfHarmIntent: result.categoryScores['self-harm/intent'] || 0,
        selfHarmInstructions: result.categoryScores['self-harm/instructions'] || 0,
        sexual: result.categoryScores.sexual || 0,
        sexualMinors: result.categoryScores['sexual/minors'] || 0,
        violence: result.categoryScores.violence || 0,
        violenceGraphic: result.categoryScores['violence/graphic'] || 0,
      },
    };
  } catch (error) {
    console.error('Content moderation error:', error);
    // Don't block messages if moderation fails - log and allow
    return null;
  }
};
