import { IUser } from '../models/User';
import JournalEntry, { IJournalEntry } from '../models/JournalEntry';

type SeverityLevel = 'mild' | 'moderate' | 'severe';

const SEVERITY_LABELS: Record<SeverityLevel, string> = {
  mild: 'licht',
  moderate: 'matig',
  severe: 'ernstig',
};

/**
 * Format health information into a readable string for AI context
 */
export const formatHealthInfoForAI = (user: IUser | null): string => {
  if (!user?.healthInfo) {
    return '';
  }

  const { mentalHealth, physicalHealth, medications, therapies } = user.healthInfo;
  const parts: string[] = [];

  // Mental health conditions
  if (mentalHealth && mentalHealth.length > 0) {
    const mentalConditions = mentalHealth.map((item: any) => {
      const conditionText = item.type 
        ? `${item.condition} (${item.type})`
        : item.condition;
      const severity = SEVERITY_LABELS[item.severity as SeverityLevel] || item.severity;
      return `- ${conditionText} (ernst: ${severity})`;
    }).join('\n');
    parts.push(`Mentale gezondheid:\n${mentalConditions}`);
  }

  // Physical health conditions
  if (physicalHealth && physicalHealth.length > 0) {
    const physicalConditions = physicalHealth.map((item: any) => {
      const conditionText = item.type 
        ? `${item.condition} (${item.type})`
        : item.condition;
      const severity = SEVERITY_LABELS[item.severity as SeverityLevel] || item.severity;
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
export const formatJournalContextForAI = (entries: IJournalEntry[]): string => {
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
    const date = new Date(entry.createdAt).toLocaleDateString('nl-NL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    const sentiment = entry.aiInsights?.sentiment ? sentimentLabels[entry.aiInsights.sentiment] : '';
    const themes = (entry.aiInsights?.themes && entry.aiInsights.themes.length > 0) 
      ? entry.aiInsights.themes.join(', ') 
      : '';
    
    let summary = `- ${date}: Stemming ${entry.mood}/10`;
    if (sentiment) summary += ` (${sentiment})`;
    if (themes) summary += `. Thema's: ${themes}`;
    summary += `\n  "${entry.content.substring(0, 200)}${entry.content.length > 200 ? '...' : ''}"`;
    
    return summary;
  }).join('\n\n');

  return `\n\nRecente dagboekentries van de gebruiker:\n${entrySummaries}\n\nJe kunt naar deze entries verwijzen als dat relevant is voor het gesprek. Bijvoorbeeld: "Ik zag in je dagboek dat je vorige week schreef over..." Wees subtiel en empathisch wanneer je verwijst naar persoonlijke reflecties.`;
};

/**
 * Format calendar events into a readable string for AI context
 */
export const formatCalendarContextForAI = (events: any[]): string => {
  if (!events || events.length === 0) {
    return '';
  }

  const typeLabels: Record<string, string> = {
    appointment: 'Afspraak',
    therapy: 'Therapie',
    medication: 'Medicatie',
    reminder: 'Herinnering',
    other: 'Overig',
  };

  const now = new Date();
  const upcomingEvents = events
    .filter(event => new Date(event.startDate) >= now)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 10); // Limit to 10 upcoming events

  if (upcomingEvents.length === 0) {
    return '';
  }

  const eventSummaries = upcomingEvents.map((event) => {
    const date = new Date(event.startDate);
    const dateStr = date.toLocaleDateString('nl-NL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const timeStr = event.allDay 
      ? 'hele dag' 
      : date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
    
    const typeLabel = typeLabels[event.type] || event.type;
    let summary = `- ${dateStr} om ${timeStr}: ${event.title} (${typeLabel})`;
    
    if (event.location) {
      summary += ` - Locatie: ${event.location}`;
    }
    
    if (event.description) {
      summary += `\n  ${event.description.substring(0, 100)}${event.description.length > 100 ? '...' : ''}`;
    }
    
    return summary;
  }).join('\n\n');

  return `\n\nAankomende agenda items van de gebruiker:\n${eventSummaries}\n\nJe kunt naar deze agenda items verwijzen als dat relevant is voor het gesprek. Bijvoorbeeld: "Ik zie dat je morgen een therapie sessie hebt..." of "Je hebt volgende week een afspraak met..." Wees subtiel en empathisch wanneer je verwijst naar agenda items.`;
};

/**
 * Combine health info, journal context, and calendar context for complete AI context
 */
export const formatCompleteContextForAI = (
  user: IUser | null,
  journalEntries?: IJournalEntry[],
  calendarEvents?: any[]
): string => {
  const healthContext = formatHealthInfoForAI(user);
  const journalContext = journalEntries ? formatJournalContextForAI(journalEntries) : '';
  const calendarContext = calendarEvents ? formatCalendarContextForAI(calendarEvents) : '';
  
  return healthContext + journalContext + calendarContext;
};

