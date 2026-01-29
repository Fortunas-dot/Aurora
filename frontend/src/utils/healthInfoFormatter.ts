import { User } from '../services/auth.service';
import { AuroraJournalContext } from '../services/journal.service';

type SeverityLevel = 'mild' | 'moderate' | 'severe';

const SEVERITY_LABELS: Record<SeverityLevel, string> = {
  mild: 'licht',
  moderate: 'matig',
  severe: 'ernstig',
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
      return `- ${conditionText} (ernst: ${severity})`;
    }).join('\n');
    parts.push(`Mentale gezondheid:\n${mentalConditions}`);
  }

  // Physical health conditions
  if (physicalHealth && physicalHealth.length > 0) {
    const physicalConditions = physicalHealth.map((item) => {
      const conditionText = item.type 
        ? `${item.condition} (${item.type})`
        : item.condition;
      const severity = SEVERITY_LABELS[item.severity];
      return `- ${conditionText} (ernst: ${severity})`;
    }).join('\n');
    parts.push(`Fysieke gezondheid:\n${physicalConditions}`);
  }

  // Medications
  if (medications && medications.length > 0) {
    parts.push(`Medicatie: ${medications.join(', ')}`);
  }

  // Therapies
  if (therapies && therapies.length > 0) {
    parts.push(`Therapieën: ${therapies.join(', ')}`);
  }

  if (parts.length === 0) {
    return '';
  }

  return `\n\nGezondheidsinformatie van de gebruiker:\n${parts.join('\n\n')}\n\nGebruik deze informatie om context te geven aan je gesprekken. Wees empathisch en begripvol over deze condities. Verwijs er alleen naar als het relevant is voor het gesprek.`;
};

/**
 * Format journal entries into a readable string for AI context
 */
export const formatJournalContextForAI = (entries: AuroraJournalContext[]): string => {
  if (!entries || entries.length === 0) {
    return '';
  }

  const sentimentLabels: Record<string, string> = {
    positive: 'positief',
    neutral: 'neutraal',
    negative: 'negatief',
    mixed: 'gemengd',
  };

  const entrySummaries = entries.map((entry) => {
    const date = new Date(entry.date).toLocaleDateString('nl-NL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    const sentiment = entry.sentiment ? sentimentLabels[entry.sentiment] : '';
    const themes = entry.themes.length > 0 ? entry.themes.join(', ') : '';
    
    let summary = `- ${date}: Stemming ${entry.mood}/10`;
    if (sentiment) summary += ` (${sentiment})`;
    if (themes) summary += `. Thema's: ${themes}`;
    summary += `\n  "${entry.summary}"`;
    
    return summary;
  }).join('\n\n');

  return `\n\nRecente dagboekentries van de gebruiker:\n${entrySummaries}\n\nJe kunt naar deze entries verwijzen als dat relevant is voor het gesprek. Bijvoorbeeld: "Ik zag in je dagboek dat je vorige week schreef over..." Wees subtiel en empathisch wanneer je verwijst naar persoonlijke reflecties.`;
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

