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
  if (mentalHealth && mentalHealth.length > 0) {
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
  if (physicalHealth && physicalHealth.length > 0) {
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
  if (medications && medications.length > 0) {
    parts.push(`Medications: ${medications.join(', ')}`);
  }

  // Therapies
  if (therapies && therapies.length > 0) {
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
export const formatJournalContextForAI = (entries: AuroraJournalContext[]): string => {
  if (!entries || entries.length === 0) {
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
 * Combine health info and journal context for complete AI context
 */
export const formatCompleteContextForAI = (
  user: User | null,
  journalEntries?: AuroraJournalContext[]
): string => {
  const healthContext = formatHealthInfoForAI(user);
  const journalContext = journalEntries ? formatJournalContextForAI(journalEntries) : '';
  
  return healthContext + journalContext;
};

