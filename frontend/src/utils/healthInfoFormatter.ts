import { User } from '../services/auth.service';
import { AuroraJournalContext } from '../services/journal.service';

type SeverityLevel = 'mild' | 'moderate' | 'severe';

const SEVERITY_LABELS: Record<SeverityLevel, string> = {
  mild: 'mild',
  moderate: 'moderate',
  severe: 'severe',
};

/**
 * Format health information into a readable string for AI context
 */
export const formatHealthInfoForAI = (user: User | null): string => {
  if (!user?.healthInfo) {
    return '';
  }

  const { mentalHealth, physicalHealth, medications, therapies, lifeContext } = user.healthInfo as any;
  const dateOfBirth = (user.healthInfo as any).dateOfBirth;
  const gender = (user.healthInfo as any).gender;
  const lifestyle = (user.healthInfo as any).lifestyle;
  const parts: string[] = [];

  // Mental health conditions
  if (mentalHealth && Array.isArray(mentalHealth) && mentalHealth.length > 0) {
    const mentalConditions = mentalHealth.map((item) => {
      const conditionText = item.type 
        ? `${item.condition} (${item.type})`
        : item.condition;
      const severity = SEVERITY_LABELS[item.severity];
      return `- ${conditionText} (severity: ${severity})`;
    }).join('\n');
    parts.push(`Mental Health:\n${mentalConditions}`);
  }

  // Physical health conditions
  if (physicalHealth && Array.isArray(physicalHealth) && physicalHealth.length > 0) {
    const physicalConditions = physicalHealth.map((item) => {
      const conditionText = item.type 
        ? `${item.condition} (${item.type})`
        : item.condition;
      const severity = SEVERITY_LABELS[item.severity];
      return `- ${conditionText} (severity: ${severity})`;
    }).join('\n');
    parts.push(`Physical Health:\n${physicalConditions}`);
  }

  // Medications
  if (medications && Array.isArray(medications) && medications.length > 0) {
    parts.push(`Medications: ${medications.join(', ')}`);
  }

  // Therapies
  if (therapies && Array.isArray(therapies) && therapies.length > 0) {
    parts.push(`Therapies: ${therapies.join(', ')}`);
  }

  // Basic demographic info
  if (dateOfBirth || gender) {
    const demoParts: string[] = [];
    if (dateOfBirth) {
      demoParts.push(`Date of birth: ${dateOfBirth} (format DD-MM-YYYY)`);
    }
    if (gender) {
      demoParts.push(`Gender: ${gender}`);
    }
    parts.push(`Basic Health Profile:\n- ${demoParts.join('\n- ')}`);
  }

  // Lifestyle information
  if (lifestyle) {
    const lifestyleLines: string[] = [];
    if (lifestyle.smoking) {
      lifestyleLines.push(`- Smoking: ${lifestyle.smoking}`);
    }
    if (lifestyle.alcohol) {
      lifestyleLines.push(`- Alcohol: ${lifestyle.alcohol}`);
    }
    if (lifestyle.drugs) {
      lifestyleLines.push(`- Drugs: ${lifestyle.drugs}`);
    }
    if (lifestyle.physicalActivity) {
      lifestyleLines.push(`- Physical activity: ${lifestyle.physicalActivity}`);
    }
    if (lifestyle.diet) {
      lifestyleLines.push(`- Diet: ${lifestyle.diet}`);
    }
    if (lifestyle.sleep) {
      lifestyleLines.push(`- Sleep: ${lifestyle.sleep}`);
    }
    if (lifestyleLines.length > 0) {
      parts.push(`Lifestyle Information:\n${lifestyleLines.join('\n')}`);
    }
  }

  // Life context (long free-text field)
  if (lifeContext) {
    parts.push(`Life Context (user's own description of their current life situation, stressors, and important background):\n"${lifeContext}"`);
  }

  if (parts.length === 0) {
    return '';
  }

  return `\n\nUser Health Information (always up-to-date from their profile):\n${parts.join('\n\n')}\n\nUse this information to provide context to your conversations. Be empathetic and understanding about these conditions and life circumstances. Only refer to them when it is genuinely helpful and relevant to the conversation. Do not give medical advice or medication instructions.`;
};

/**
 * Format journal entries into a readable string for AI context
 */
export const formatJournalContextForAI = (entries?: AuroraJournalContext[] | null): string => {
  if (!entries || !Array.isArray(entries) || entries.length === 0) {
    return '';
  }

  const sentimentLabels: Record<string, string> = {
    positive: 'positive',
    neutral: 'neutral',
    negative: 'negative',
    mixed: 'mixed',
  };

  const entrySummaries = entries.map((entry) => {
    const date = new Date(entry.date).toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    const sentiment = entry.sentiment ? sentimentLabels[entry.sentiment] : '';
    const themes = entry.themes.length > 0 ? entry.themes.join(', ') : '';
    
    let summary = `- ${date}: Mood ${entry.mood}/10`;
    if (sentiment) summary += ` (${sentiment})`;
    if (themes) summary += `. Themes: ${themes}`;
    summary += `\n  "${entry.summary}"`;
    
    return summary;
  }).join('\n\n');

  return `\n\nRecent journal entries from the user:\n${entrySummaries}\n\nYou can refer to these entries if relevant to the conversation. For example: "I saw in your journal that you wrote last week about..." Be subtle and empathetic when referring to personal reflections.`;
};

/**
 * Format chat context (important points from past sessions) for AI
 */
export const formatChatContextForAI = (chatContexts?: Array<{
  importantPoints: string[];
  summary?: string;
  sessionDate: string;
}>): string => {
  if (!chatContexts || chatContexts.length === 0) {
    return '';
  }

  const contextParts = chatContexts.map((ctx, idx) => {
    const date = new Date(ctx.sessionDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const points = ctx.importantPoints.map((p, i) => `  ${i + 1}. ${p}`).join('\n');
    let summary = `Session ${idx + 1} (${date}):\n${points}`;
    if (ctx.summary) {
      summary += `\n  Summary: ${ctx.summary}`;
    }
    return summary;
  }).join('\n\n');

  return `\n\nImportant points from previous chat sessions:\n${contextParts}\n\nUse these points to provide continuity and personalized support. Reference them naturally when relevant to the conversation.`;
};

/**
 * Combine health info, journal context, and chat context for complete AI context
 */
export const formatCompleteContextForAI = (
  user: User | null,
  journalEntries?: AuroraJournalContext[],
  chatContexts?: Array<{
    importantPoints: string[];
    summary?: string;
    sessionDate: string;
  }>
): string => {
  const healthContext = formatHealthInfoForAI(user);
  const journalContext = journalEntries ? formatJournalContextForAI(journalEntries) : '';
  const chatContext = chatContexts ? formatChatContextForAI(chatContexts) : '';
  
  return healthContext + journalContext + chatContext;
};

