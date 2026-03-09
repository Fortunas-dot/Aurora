/**
 * Content Moderation Service
 *
 * Previously used OpenAI's moderation API. Now that the backend has migrated to
 * Claude, we rely primarily on our own riskDetection.service plus this
 * lightweight keyword-based check. This keeps a moderation hook in place
 * without requiring an external moderation API.
 */

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
    if (!content || !content.trim()) {
      return null;
    }

    const lower = content.toLowerCase();

    // Very lightweight heuristic flags, complementary to riskDetection.service
    const flags: Partial<ModerationResult['categories']> = {
      selfHarm: /\b(self\-?harm|hurt myself|cut myself|bleeding)\b/.test(lower),
      selfHarmIntent: /\b(want to die|want to kill myself|end my life|zelfmoord)\b/.test(lower),
      sexualMinors: /\b(minor|underage|child porn|cp)\b/.test(lower),
      violence: /\b(kill (him|her|them)|shoot|stab|murder)\b/.test(lower),
      hate: /\b(hate (you|them|him|her)|racist|nazi)\b/.test(lower),
    };

    const flagged = Object.values(flags).some(Boolean);
    if (!flagged) {
      return null;
    }

    return {
      flagged: true,
      categories: {
        hate: !!flags.hate,
        hateThreatening: false,
        harassment: false,
        harassmentThreatening: false,
        selfHarm: !!flags.selfHarm,
        selfHarmIntent: !!flags.selfHarmIntent,
        selfHarmInstructions: false,
        sexual: false,
        sexualMinors: !!flags.sexualMinors,
        violence: !!flags.violence,
        violenceGraphic: false,
      },
      categoryScores: {
        hate: flags.hate ? 0.6 : 0,
        hateThreatening: 0,
        harassment: 0,
        harassmentThreatening: 0,
        selfHarm: flags.selfHarm ? 0.7 : 0,
        selfHarmIntent: flags.selfHarmIntent ? 0.8 : 0,
        selfHarmInstructions: 0,
        sexual: 0,
        sexualMinors: flags.sexualMinors ? 0.9 : 0,
        violence: flags.violence ? 0.7 : 0,
        violenceGraphic: 0,
      },
    };
  } catch (error) {
    console.error('Content moderation error:', error);
    // Don't block messages if moderation fails - log and allow
    return null;
  }
};
