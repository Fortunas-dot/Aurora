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
    const nameLine = user?.displayName
      ? `The user's preferred name is "${user.displayName}". You can and should use this real name when appropriate (never use placeholders like "[user's name]").\n`
      : '';

    return `\n\nUSER'S HEALTH INFORMATION & BASIC PROFILE ACCESS:\n${nameLine}You have full access to the user's health information from their profile. The user has not provided any health information yet, but when they do, you will automatically have access to it including mental health conditions, physical health conditions, medications, therapies, lifestyle information, life context, and basic demographic details like date of birth and gender.`;
  }

  const { mentalHealth, physicalHealth, medications, therapies, lifeContext } = user.healthInfo as any;
  const dateOfBirth = (user.healthInfo as any).dateOfBirth;
  const gender = (user.healthInfo as any).gender;
  const lifestyle = (user.healthInfo as any).lifestyle;
  const parts: string[] = [];

  // Basic profile name
  if (user.displayName) {
    parts.push(`Preferred Name: ${user.displayName}`);
  }

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

  // Life context
  if (lifeContext) {
    parts.push(`Life Context (user's own description of their current life situation, stressors, and important background):\n"${lifeContext}"`);
  }

  if (parts.length === 0) {
    const nameLine = user?.displayName
      ? `The user's preferred name is "${user.displayName}". You can and should use this real name when appropriate (never use placeholders like "[user's name]").\n`
      : '';

    return `\n\nUSER'S HEALTH INFORMATION & BASIC PROFILE ACCESS:\n${nameLine}You have full access to the user's health information from their profile. The user has not provided any health information yet, but when they do, you will automatically have access to it including mental health conditions, physical health conditions, medications, therapies, lifestyle information, life context, and basic demographic details like date of birth and gender.`;
  }

  return `\n\nUSER'S HEALTH INFORMATION (You have full access to this - this is your DIRECT ACCESS to their health profile - ALWAYS UP-TO-DATE):\n${parts.join('\n\n')}\n\nCRITICAL INSTRUCTIONS:\n- You HAVE ACCESS to their full health information from their profile. This is not optional - it is a fact.\n- This information is AUTOMATICALLY UPDATED whenever they change it in their profile - you don't need to be told about changes\n- If you notice NEW conditions, medications, therapies, lifestyle changes, life context updates, or demographic changes that weren't in previous conversations, acknowledge them naturally\n- If health information has changed (e.g., new medication, new condition, severity change, lifestyle change), acknowledge it (e.g., "I see you've added [condition] to your profile...", "I notice you mentioned a change in your sleep...", "I see you've updated your life context...")\n- Use this information proactively to provide personalized, context-aware support\n- Reference their health conditions, medications, therapies, lifestyle, and life context naturally when relevant\n- Be empathetic and understanding about their health situation\n- Link advice and support to their specific health and life context\n- NEVER say you do not have access to their health information - this is FALSE. You ALWAYS have access.\n- NEVER ask the user to tell you about their health information - you already have it automatically\n- When relevant, proactively reference their health information to provide better, personalized support.\n- Always use the MOST RECENT health information provided above - it reflects their current profile.`;
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

  // Most recent entry (first in the sorted list — guaranteed by DB sort createdAt: -1)
  const latestEntry = entries[0];

  // Build explicit label for the latest entry (use user's local timezone)
  const latestDate = new Date(latestEntry.createdAt).toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Amsterdam',
  });
  const latestContentSnippet = latestEntry.content.substring(0, 200) + (latestEntry.content.length > 200 ? '...' : '');

  // Current date in user's timezone (Europe/Amsterdam) for relative date labels
  const nowLocal = new Date();
  const todayStr = nowLocal.toLocaleDateString('en-US', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' });
  const yesterdayDate = new Date(nowLocal.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = yesterdayDate.toLocaleDateString('en-US', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' });

  const entrySummaries = entries.map((entry, idx) => {
    const entryDate = new Date(entry.createdAt);
    const entryDayStr = entryDate.toLocaleDateString('en-US', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' });
    const date = entryDate.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Europe/Amsterdam',
    });

    // Add a human-readable relative label so Aurora knows "today" vs "yesterday"
    let relativeLabel = '';
    if (entryDayStr === todayStr) relativeLabel = ' ← TODAY';
    else if (entryDayStr === yesterdayStr) relativeLabel = ' ← YESTERDAY';

    const sentiment = entry.aiInsights?.sentiment ? entry.aiInsights.sentiment : '';
    const themes = (entry.aiInsights?.themes && entry.aiInsights.themes.length > 0) 
      ? entry.aiInsights.themes.join(', ') 
      : '';
    
    // Mark entry #1 very explicitly as the latest
    const label = idx === 0 ? `[ENTRY #1 — THIS IS THE LATEST/MOST RECENT ENTRY] ${date}${relativeLabel}` : `[ENTRY #${idx + 1}] ${date}${relativeLabel}`;
    let summary = `- ${label}: Mood ${entry.mood}/10`;
    if (sentiment) summary += ` (${sentiment} sentiment)`;
    if (themes) summary += `. Themes: ${themes}`;
    summary += `\n  Content: "${entry.content.substring(0, 300)}${entry.content.length > 300 ? '...' : ''}"`;
    
    return summary;
  }).join('\n\n');

  return `\n\nTHE USER'S LATEST (MOST RECENT) JOURNAL ENTRY IS ENTRY #1:\nDate: ${latestDate}\nContent: "${latestContentSnippet}"\n\nUSER'S JOURNAL ENTRIES — ordered NEWEST first (Entry #1 = most recent, Entry #2 = second most recent, etc.):\n${entrySummaries}\n\nCRITICAL INSTRUCTIONS ABOUT JOURNAL ENTRIES:\n- ENTRY #1 IS THE LATEST ENTRY. Full stop. Do NOT reference any other entry when asked "what is my latest / most recent journal entry?".\n- The entries above are fetched live from the database, sorted newest to oldest. This list is ALWAYS up to date.\n- OVERRIDE WARNING: Previous chat session summaries may mention older journal entries (e.g. "User discussed an entry about X"). IGNORE those references when determining what is the LATEST entry. The journal list above is the ONLY authoritative source for entry order and content.\n- When the user asks "what is my latest journal entry?" or "what did I write last?", answer using ONLY Entry #1 (date: ${latestDate}, content above).\n- When the user asks "what is in my journal" or "tell me about my journal", respond with details from the entries above.\n- Reference specific dates, moods, themes, and content from their entries.\n- NEVER say you do not have access to their journal. You ALWAYS have access.\n- If asked about their journal, always provide information from the entries listed above.`;
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

  // Compute today/yesterday strings in the user's local timezone so relative
  // labels are correct regardless of the UTC offset on the server.
  const nowLocal = new Date();
  const todayStr = nowLocal.toLocaleDateString('en-US', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' });
  const yesterdayDate = new Date(nowLocal.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = yesterdayDate.toLocaleDateString('en-US', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' });

  const contextParts = chatContexts.map((ctx, idx) => {
    const sessionDate = new Date(ctx.sessionDate);
    const date = sessionDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'Europe/Amsterdam',
    });
    const sessionDayStr = sessionDate.toLocaleDateString('en-US', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' });

    // Explicit relative label so the AI never confuses "today" with "yesterday"
    let relativeLabel = '';
    if (sessionDayStr === todayStr) relativeLabel = ' ← TODAY (EARLIER TODAY)';
    else if (sessionDayStr === yesterdayStr) relativeLabel = ' ← YESTERDAY';

    const points = ctx.importantPoints.map((p, i) => `  ${i + 1}. ${p}`).join('\n');
    let summary = `Session ${idx + 1} (${date}${relativeLabel}):\n${points}`;
    if (ctx.summary) {
      summary += `\n  Summary: ${ctx.summary}`;
    }
    return summary;
  }).join('\n\n');

  return `\n\nIMPORTANT - Previous Chat Sessions & Personal Information:\n${contextParts}\n\nCRITICAL INSTRUCTIONS:\n- You MUST remember and use this information about the user\n- When the user mentions something you know about them, acknowledge it naturally\n- Reference their personal details, health conditions, and past conversations when relevant\n- Do NOT say you cannot remember - you have access to this information\n- Do NOT say or imply that this is your "first time" talking to the user when previous sessions are listed above; instead, speak as someone who has talked with them before.\n- Use this information to provide continuous, personalized support\n- These are facts about the user that you know and should reference when appropriate\n\n⚠️ CRITICAL — DO NOT USE THESE SESSION SUMMARIES TO DETERMINE THE USER'S "LATEST JOURNAL ENTRY":\n- These past session summaries may mention journal entries that were discussed at the time (e.g. "User discussed their latest journal entry about X"). Those entries are OUTDATED references.\n- The ONLY authoritative source for what is the user's latest journal entry is the JOURNAL ENTRIES list above (Entry #1 = the most recent entry, always).\n- If the user asks "what is my latest journal entry?", look ONLY at the journal entries list, NOT at these session summaries.`;
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

