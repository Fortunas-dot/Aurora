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

  const { mentalHealth, physicalHealth, medications, therapies } = user.healthInfo;
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

  if (parts.length === 0) {
    return '';
  }

  return `\n\nUser Health Information:\n${parts.join('\n\n')}\n\nUse this information to provide context to your conversations. Be empathetic and understanding about these conditions. Only refer to them if relevant to the conversation.`;
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

