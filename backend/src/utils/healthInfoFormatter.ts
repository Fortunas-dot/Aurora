import { IUser } from '../models/User';
import JournalEntry, { IJournalEntry } from '../models/JournalEntry';
import ChatContext from '../models/ChatContext';

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
    return '\n\nUSER\'S JOURNAL ACCESS:\nYou have full access to the user\'s journal. The user has not written any journal entries yet, but when they do, you will have access to all their entries, including dates, moods, themes, and content. If the user asks about their journal, you can acknowledge that you have access but they haven\'t written any entries yet.';
  }

  const sentimentLabels: Record<string, string> = {
    positive: 'positief',
    neutral: 'neutraal',
    negative: 'negatief',
    mixed: 'gemengd',
  };

  const entrySummaries = entries.map((entry) => {
    const date = new Date(entry.createdAt).toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const sentiment = entry.aiInsights?.sentiment ? entry.aiInsights.sentiment : '';
    const themes = (entry.aiInsights?.themes && entry.aiInsights.themes.length > 0) 
      ? entry.aiInsights.themes.join(', ') 
      : '';
    
    let summary = `- ${date}: Mood ${entry.mood}/10`;
    if (sentiment) summary += ` (${sentiment} sentiment)`;
    if (themes) summary += `. Themes: ${themes}`;
    summary += `\n  Content: "${entry.content.substring(0, 300)}${entry.content.length > 300 ? '...' : ''}"`;
    
    return summary;
  }).join('\n\n');

  return `\n\nUSER'S JOURNAL ENTRIES (You have full access to these - this is your DIRECT ACCESS to their journal):\n${entrySummaries}\n\nCRITICAL INSTRUCTIONS:\n- You HAVE ACCESS to their journal. This is not optional - it is a fact.\n- When the user asks "what is in my journal" or "tell me about my journal", you MUST respond with details from the entries above.\n- Reference specific dates, moods, themes, and content from their entries.\n- Use phrases like: "I see in your journal that you wrote on [date] about [topic]..." or "Looking at your recent entries, I notice..." or "In your journal entry from [date], you mentioned..."\n- Be empathetic and supportive when referencing their personal reflections.\n- NEVER say you do not have access to their journal - this is FALSE. You ALWAYS have access.\n- If asked about their journal, always provide information from the entries listed above.`;
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
 * Format chat context (important points from past sessions) for AI
 */
export const formatChatContextForAI = (chatContexts: Array<{
  importantPoints: string[];
  summary?: string;
  sessionDate: Date | string;
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

  return `\n\nIMPORTANT - Previous Chat Sessions & Personal Information:\n${contextParts}\n\nCRITICAL INSTRUCTIONS:\n- You MUST remember and use this information about the user\n- When the user mentions something you know about them, acknowledge it naturally\n- Reference their personal details, health conditions, and past conversations when relevant\n- Do NOT say you cannot remember - you have access to this information\n- Use this information to provide continuous, personalized support\n- These are facts about the user that you know and should reference when appropriate`;
};

/**
 * Combine health info, journal context, calendar context, and chat context for complete AI context
 */
export const formatCompleteContextForAI = (
  user: IUser | null,
  journalEntries?: IJournalEntry[],
  calendarEvents?: any[],
  chatContexts?: Array<{
    importantPoints: string[];
    summary?: string;
    sessionDate: Date | string;
  }>
): string => {
  const healthContext = formatHealthInfoForAI(user);
  const journalContext = journalEntries ? formatJournalContextForAI(journalEntries) : '';
  const calendarContext = calendarEvents ? formatCalendarContextForAI(calendarEvents) : '';
  const chatContext = chatContexts ? formatChatContextForAI(chatContexts) : '';
  
  return healthContext + journalContext + calendarContext + chatContext;
};

