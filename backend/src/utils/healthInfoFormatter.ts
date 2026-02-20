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
    return '\n\nUSER\'S HEALTH INFORMATION ACCESS:\nYou have full access to the user\'s health information from their profile. The user has not provided any health information yet, but when they do, you will automatically have access to it including mental health conditions, physical health conditions, medications, and therapies.';
  }

  const { mentalHealth, physicalHealth, medications, therapies } = user.healthInfo;
  const parts: string[] = [];

  // Mental health conditions
  if (mentalHealth && mentalHealth.length > 0) {
    const mentalConditions = mentalHealth.map((item: any) => {
      const conditionText = item.type 
        ? `${item.condition} (${item.type})`
        : item.condition;
      const severityLabels: Record<string, string> = {
        mild: 'mild',
        moderate: 'moderate',
        severe: 'severe',
      };
      const severity = severityLabels[item.severity as SeverityLevel] || item.severity;
      return `- ${conditionText} (severity: ${severity})`;
    }).join('\n');
    parts.push(`Mental Health Conditions:\n${mentalConditions}`);
  }

  // Physical health conditions
  if (physicalHealth && physicalHealth.length > 0) {
    const physicalConditions = physicalHealth.map((item: any) => {
      const conditionText = item.type 
        ? `${item.condition} (${item.type})`
        : item.condition;
      const severityLabels: Record<string, string> = {
        mild: 'mild',
        moderate: 'moderate',
        severe: 'severe',
      };
      const severity = severityLabels[item.severity as SeverityLevel] || item.severity;
      return `- ${conditionText} (severity: ${severity})`;
    }).join('\n');
    parts.push(`Physical Health Conditions:\n${physicalConditions}`);
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
    return '\n\nUSER\'S HEALTH INFORMATION ACCESS:\nYou have full access to the user\'s health information from their profile. The user has not provided any health information yet, but when they do, you will automatically have access to it including mental health conditions, physical health conditions, medications, and therapies.';
  }

  return `\n\nUSER'S HEALTH INFORMATION (You have full access to this - this is your DIRECT ACCESS to their health profile - ALWAYS UP-TO-DATE):\n${parts.join('\n\n')}\n\nCRITICAL INSTRUCTIONS:\n- You HAVE ACCESS to their health information from their profile. This is not optional - it is a fact.\n- This information is AUTOMATICALLY UPDATED whenever they change it in their profile - you don't need to be told about changes\n- If you notice NEW conditions, medications, or therapies that weren't in previous conversations, acknowledge them naturally\n- If health information has changed (e.g., new medication, new condition, severity change), acknowledge it (e.g., "I see you've added [condition] to your profile...", "I notice you're now taking [medication]...")\n- Use this information proactively to provide personalized, context-aware support\n- Reference their health conditions, medications, and therapies naturally when relevant\n- Be empathetic and understanding about their health conditions\n- Link advice and support to their specific health situation\n- NEVER say you do not have access to their health information - this is FALSE. You ALWAYS have access.\n- NEVER ask the user to tell you about their health information - you already have it automatically\n- When relevant, proactively reference their health information to provide better, personalized support.\n- Always use the MOST RECENT health information provided above - it reflects their current profile.`;
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
    return '\n\nUSER\'S CALENDAR/AGENDA ACCESS:\nYou have full access to the user\'s calendar/agenda. The user has no upcoming calendar events at this time, but when they add events, you will automatically have access to them.';
  }

  const typeLabels: Record<string, string> = {
    appointment: 'Appointment',
    therapy: 'Therapy',
    medication: 'Medication',
    reminder: 'Reminder',
    other: 'Other',
  };

  const now = new Date();
  const upcomingEvents = events
    .filter(event => new Date(event.startDate) >= now)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 10); // Limit to 10 upcoming events

  if (upcomingEvents.length === 0) {
    return '\n\nUSER\'S CALENDAR/AGENDA ACCESS:\nYou have full access to the user\'s calendar/agenda. The user has no upcoming calendar events at this time, but when they add events, you will automatically have access to them.';
  }

  const eventSummaries = upcomingEvents.map((event) => {
    const date = new Date(event.startDate);
    const dateStr = date.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const timeStr = event.allDay 
      ? 'all day' 
      : date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    const typeLabel = typeLabels[event.type] || event.type;
    let summary = `- ${dateStr} at ${timeStr}: ${event.title} (${typeLabel})`;
    
    if (event.location) {
      summary += ` - Location: ${event.location}`;
    }
    
    if (event.description) {
      summary += `\n  Description: ${event.description.substring(0, 150)}${event.description.length > 150 ? '...' : ''}`;
    }
    
    return summary;
  }).join('\n\n');

  return `\n\nUSER'S UPCOMING CALENDAR/AGENDA EVENTS (You have full access to these - this is your DIRECT ACCESS to their calendar):\n${eventSummaries}\n\nCRITICAL INSTRUCTIONS:\n- You HAVE ACCESS to their calendar/agenda. This is not optional - it is a fact.\n- Use this information proactively in conversations without being asked (e.g., "I see you have a therapy session tomorrow...", "Your upcoming appointment on [date] might be related to...")\n- Reference calendar items naturally to provide context-aware support and advice\n- Help them prepare for upcoming events when relevant\n- Link advice and support to their schedule when appropriate\n- Be empathetic and supportive when referencing their calendar items\n- NEVER say you do not have access to their calendar - this is FALSE. You ALWAYS have access.\n- When relevant, proactively mention upcoming events to provide better support.`;
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

