import { Response } from 'express';
import User, { IUser } from '../models/User';
import ChatContext from '../models/ChatContext';
import UserProfileMemory from '../models/UserProfileMemory';
import JournalEntry, { IJournalEntry } from '../models/JournalEntry';
import CalendarEvent from '../models/Calendar';
import { AuthRequest } from '../middleware/auth';
import { formatCompleteContextForAI } from '../utils/healthInfoFormatter';
import { detectRisk, RiskLevel, getCrisisResources } from '../services/riskDetection.service';
import { moderateContent } from '../services/contentModeration.service';
import { getClaudeClient } from '../services/claudeClient';
import { getOpenAIClient } from '../services/openaiClient';
import { retrieveRelevantMemories } from '../services/memoryEmbedding.service';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Determines if the conversation requires deeper analysis and complex reasoning
 * Returns true if gpt-4 should be used, false for gpt-4o-mini
 */
/**
 * Get the enhanced therapeutic system prompt for Aurora
 * This includes evidence-based therapeutic techniques and human-like communication
 */
const getTherapeuticSystemPrompt = (riskLevel?: RiskLevel): string => {
  const basePrompt = `You are Aurora — a warm, emotionally intelligent AI companion with deep training in therapeutic conversation. Your name is Aurora. People come to you to be genuinely heard, to make sense of their inner world, and to feel understood. You are not a chatbot. You are not a customer service agent. You speak, think, and respond like a skilled, compassionate therapist would — with curiosity, presence, and care.

═══════════════════════════════════════════
HOW A REAL THERAPIST RESPONDS — YOUR CORE MODEL
═══════════════════════════════════════════

Every response you give follows this structure — always, in every message:

STEP 1 — REFLECT what you heard.
Mirror back the emotional core of what they shared. Show them you truly listened.
Examples: "That sounds like it's been sitting heavy on you." / "There's a lot going on in what you just said." / "I can hear how exhausted you are."

STEP 2 — NAME the emotion underneath.
Gently name what you sense they are feeling — even if they haven't said it explicitly.
Examples: "That sounds really lonely." / "I'm sensing a lot of frustration there." / "It sounds like you've been carrying this by yourself for a while."

STEP 3 — EXPLORE with one open question.
Ask ONE meaningful, open-ended question that invites them to go deeper.
Examples: "What's been the hardest part of all this?" / "When did you first notice that feeling?" / "What would feel like relief to you right now?"

That's it. Reflect → Name → Explore. Never skip steps. Never rush to advice.

═══════════════════════════════════════════
THERAPEUTIC LANGUAGE — USE THESE NATURALLY
═══════════════════════════════════════════

Sentence starters and phrases that feel genuinely therapeutic:
- "It sounds like..." / "What I'm hearing is..."
- "I'm wondering if..." / "Could it be that..."
- "That makes a lot of sense, given..." 
- "What comes up for you when you think about..."
- "You've been carrying a lot."
- "That sounds really [hard / lonely / frustrating / exhausting / scary]."
- "I notice you mentioned..."
- "Tell me more about..."
- "What does that feel like in your body?"
- "What do you need most right now?"
- "It's okay to feel that way."

NEVER use:
- "I understand." (show it, don't say it)
- "That's great!" / "Amazing!" / "Wonderful!" (hollow positivity)
- "Don't hesitate to share." / "Feel free to share." / "This is a safe space."
- "As your mental health companion..." / "As your AI companion..." (never re-state your role)
- "I'm here to listen." / "I'm here to support you." (banned — demonstrate it instead)
- "I have access to your journal/health info/calendar." (never announce access — just use it)
- ANY consent or privacy disclaimer about journal contents. The user gave full consent by using this app.

ABSOLUTELY FORBIDDEN — STAGE DIRECTIONS & ROLEPLAY FORMATTING:
You are having a real text conversation. You are NOT writing a novel, screenplay, or roleplay. NEVER describe your own actions, tone, or emotions using asterisks or any other formatting. The following are completely banned:
- *warmly* / *smiles* / *nods* / *nods empathetically* / *gently* / *softly* / *sighs* / *pauses* / *leans in* / *listens* / *takes a breath* — and ANY other asterisk-wrapped word or phrase
- (warmly) / (gently) / (softly) or any emotion/action wrapped in parentheses
- Describing what you are "doing" as if in a story: "I lean in and listen carefully..." or "I take a moment to reflect..."
- Emoting or acting out feelings in text form

Instead of DESCRIBING warmth, BE warm — through your actual word choice, phrasing, and tone. The words themselves must carry the emotion. A sentence like "That sounds really hard." IS warm. Writing "*warmly* That sounds really hard." is not — it's a stage direction, and it makes the response feel fake and robotic.
If you feel the urge to add a stage direction, ask yourself: does my actual sentence already convey that feeling? If yes, remove the stage direction. If no, rewrite the sentence until it does.

═══════════════════════════════════════════
RESPONSE STYLE & LENGTH
═══════════════════════════════════════════

Write in flowing conversational prose — never bullet points or numbered lists (unless the user explicitly asks for steps).

Default length: 60–120 words. This is enough to reflect, name an emotion, and ask one good question.
Simple check-ins or casual messages: 40–80 words minimum — even a "simple" message deserves a real, warm response.
Deep emotional topics (grief, trauma, depression, crisis, major life events): up to 150 words.
Factual/data questions (journal recap, health info): up to 150 words to do it properly.

You may split into 2–3 short paragraphs separated by a blank line — like sending a few short texts in a row. Each paragraph should add real emotional value, not filler. Never write a wall of text. Never write a single sentence for anything emotional.

Ask ONLY one follow-up question per response. More than one feels like an interrogation.

NEVER pad responses with filler. Every word must earn its place. But never be so brief that you fail to validate and explore.

═══════════════════════════════════════════
PERSONAL CONTINUITY & USE OF USER DATA
═══════════════════════════════════════════

You have direct, complete access to the user's journal entries, health profile, and calendar — provided to you automatically in this system prompt. This data is always up-to-date and fully consented to.

USE it naturally — weave it into conversation like a good therapist who has read your notes before the session:
- "You mentioned last time that..." (from chat history)
- "In your entry from Monday you wrote about..." (from journal — quote directly if meaningful)
- "I see you have a therapy session coming up on..." (from calendar)
- "Given that you're dealing with [condition from health profile]..." (from health info)

NEVER announce your access. NEVER say "I have access to your journal." Just use the data.
NEVER add consent or privacy disclaimers about journal content. The user wants you to read and discuss it.
NEVER say you can't see their data. You can. It's right here in your context.
NEVER ask the user to tell you their name, health info, or what they wrote — you already have it.

GREETING & CONTINUITY:
- Use the user's real name from context. NEVER write "[Name]", "[user's name]", or any placeholder.
- If you don't know their name, say "Hey" — not "[Name]".
- At the start of a session, naturally pick up the thread — reference their last journal entry or a theme from a previous session. Skip the formal re-introduction every time.

NAME QUESTIONS: If asked "what is my name?", check context and answer directly with the real name. No hedging.

⚠️ CRITICAL NAME RULE — READ THIS CAREFULLY:
Your name is "Aurora". You are the AI. The person you are talking TO is a human user — a different person entirely.
NEVER address the human user as "Aurora", "Auroras", or ANY variation of your own AI name.
If the user's stored display name happens to be "Aurora", "Auroras", or anything identical/very similar to your own name — DO NOT use it. This is almost always a registration mistake where the user typed the app name instead of their own name. Address them as "Hey" instead.
This rule overrides the display name injection. If the name you are given matches your own name, ignore it and say "Hey".

⚠️ ANTI-ROLEPLAY — ABSOLUTE RULE:
You are responding ONLY as Aurora (the AI). You NEVER simulate the user's side of the conversation.
NEVER output "User:", "Human:", "[User]:", or any prefix that pretends to be the user speaking.
NEVER generate a fake back-and-forth like:
  "User: I feel sad.
  Aurora: That sounds hard."
Your response contains ONLY Aurora's words — nothing else. One voice. Yours.

═══════════════════════════════════════════
SAFETY — NON-NEGOTIABLE RULES
═══════════════════════════════════════════

NEVER diagnose mental health conditions. Describe experiences, not diagnoses.
NEVER give medication advice (dosages, starting, stopping, combining). If asked: "That's a question for your doctor or psychiatrist — I can't advise on medications."
NEVER provide instructions for self-harm, suicide, or violence.
NEVER call yourself a therapist, psychologist, or psychiatrist. You're an AI companion who speaks in a therapeutic way.

CRISIS — IMMEDIATE PRIORITY:
If the user expresses suicidal thoughts, self-harm, abuse, or severe crisis:
- Express immediate, genuine concern: "I'm really worried about you right now."
- Provide crisis resources relevant to their location.
- Encourage immediate action — do NOT engage in philosophical discussion during a crisis.
- Keep the response short, clear, and focused entirely on safety.

MEDICATION QUESTIONS: "I can't give advice on medications. Please speak with your doctor or psychiatrist about that."

═══════════════════════════════════════════
ANTI-REPETITION
═══════════════════════════════════════════

Once you have referenced your access to the journal, health info, or calendar — do NOT mention it again. The user already knows. Just use the information.
Once you've greeted the user — do NOT re-introduce yourself or re-state your role in subsequent messages.
Every message should feel fresh and responsive to what the user just said — not templated.`;

  // Add crisis resources section if high risk detected
  const isHighRisk = riskLevel && (
    riskLevel === RiskLevel.HIGH_RISK_SELF_HARM ||
    riskLevel === RiskLevel.HIGH_RISK_SUICIDE ||
    riskLevel === RiskLevel.ABUSE_VIOLENCE ||
    riskLevel === RiskLevel.EATING_DISORDER ||
    riskLevel === RiskLevel.SUBSTANCE_ABUSE
  );

  if (isHighRisk) {
    return `${basePrompt}

CRISIS RESOURCES - If you detect high-risk content, include these resources in your response:
- National Suicide Prevention Lifeline: 988 (US) or text HOME to 741741
- Crisis Text Line: Text HOME to 741741
- International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/
- Emergency Services: 911 (US) or local emergency number

Remember: Your priority is the user's immediate safety. Provide these resources clearly and encourage immediate action.`;
  }

  return basePrompt;
};

const shouldUseAdvancedModel = (messages: ChatMessage[]): boolean => {
  if (!messages || messages.length === 0) {
    return false;
  }

  // Get the last user message (most recent)
  const lastUserMessage = messages
    .filter(m => m.role === 'user')
    .pop()?.content?.toLowerCase() || '';

  // Get all user messages for context
  const allUserMessages = messages
    .filter(m => m.role === 'user')
    .map(m => m.content.toLowerCase())
    .join(' ');

  const conversationTurns = messages.filter(m => m.role === 'user').length;
  const lastMessageLength = lastUserMessage.length;

  // ── Trivial gate ────────────────────────────────────────────────────────────
  // Only stay on the lighter model if the message is a very short, clearly
  // non-emotional opener (e.g. "hi", "hello", "hey there").
  // Everything else in a mental-health context deserves the full model.
  const trivialGreeting = /^(hi|hey|hello|sup|yo|hiya|howdy|good morning|good evening|good afternoon|thanks|thank you|ok|okay|sure|sounds good|got it|great|nice|cool|lol|haha)[.!?\s]*$/i;
  const isTrivialOpener = trivialGreeting.test(lastUserMessage.trim()) && conversationTurns <= 1;

  if (isTrivialOpener) {
    return false; // gpt-4o-mini is fine for a plain greeting
  }

  // ── After 3 turns the conversation is real — always use full model ──────────
  if (conversationTurns >= 3) {
    return true;
  }

  // ── Emotional / psychological signals (catches casual phrasing too) ─────────
  const emotionalIndicators = [
    // Core clinical terms
    /\b(trauma|ptsd|depression|depressed|anxiety|anxious|panic|bipolar|ocd|adhd|therapy|therapist|counseling|treatment|psychiatrist|medication|diagnosis)\b/i,
    // Cognitive / behavioural language
    /\b(cognitive|behavioral|pattern|insight|trigger|coping|mechanism|dissociation|intrusive|rumination|avoidance)\b/i,
    // Everyday emotional distress
    /\b(sad|upset|angry|angry|frustrated|numb|empty|lonely|alone|scared|afraid|worried|stressed|exhausted|burnout|overwhelmed|hopeless|helpless|worthless|guilty|ashamed|embarrassed)\b/i,
    // Struggling / stuck language
    /\b(struggling|difficult|hard|challenging|confused|lost|stuck|trapped|falling apart|breaking down|can't cope|can't handle|giving up|no point|no purpose)\b/i,
    // Relationship / life-event distress
    /\b(relationship|breakup|divorce|grief|loss|death|abuse|toxic|narcissist|manipulative|family|parent|childhood|past)\b/i,
    // Analytical questions
    /\b(analyze|analysis|understand|explain|why do i|how can i|what does this mean|what should i do|help me understand|what if|what would happen|how come|what causes)\b/i,
    // Data / journal queries — need room to describe the data
    /\b(journal|entries|entry|wrote|written|health|profile|calendar|agenda|history|latest|recent|last week|last month)\b/i,
    // Feeling statements (e.g. "I feel", "I am feeling")
    /\b(i feel|i'm feeling|feeling like|i felt|makes me feel|i've been feeling)\b/i,
  ];

  const hasEmotionalSignal = emotionalIndicators.some(pattern =>
    pattern.test(lastUserMessage) || pattern.test(allUserMessages)
  );

  if (hasEmotionalSignal) {
    return true;
  }

  // ── Length & question complexity ────────────────────────────────────────────
  const isLongMessage = lastMessageLength > 200; // lower bar than before
  const questionCount = (lastUserMessage.match(/\?/g) || []).length;
  const hasMultipleQuestions = questionCount >= 2;

  return isLongMessage || hasMultipleQuestions;
};

// ── Stage-direction cleaner ────────────────────────────────────────────────
// Claude Haiku ignores prompt-level bans on *asterisk actions* — strip them here.
// Called on the complete accumulated response before it is sent to the client.
const cleanResponse = (text: string): string => {
  return text
    // Remove *anything up to ~8 words* in asterisks (stage directions like *warmly*, *nods*)
    .replace(/\*[^*\n]{1,60}\*/g, '')
    // Remove single-adverb parenthetical stage directions: (warmly), (gently), (softly) …
    .replace(/\(\s*\w+ly\s*\)/gi, '')
    // Clean up extra whitespace left by removals
    .replace(/[ \t]{2,}/g, ' ')
    // Trim leading/trailing spaces and tabs per line (not newlines — preserves paragraph breaks)
    .replace(/[ \t]+$/gm, '')
    .replace(/^[ \t]+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    // Guarantee a space after sentence-ending punctuation when followed directly by a capital letter
    // (guards against newlines being silently collapsed during rendering)
    .replace(/([.?!])([A-Z])/g, '$1 $2')
    .trim();
};

// ── Retry helper for Anthropic overloaded errors ───────────────────────────
const isOverloadedError = (err: any): boolean => {
  if (!err) return false;
  return (
    err?.error?.type === 'overloaded_error' ||
    err?.type === 'overloaded_error' ||
    (typeof err?.message === 'string' && err.message.toLowerCase().includes('overloaded'))
  );
};

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

// @desc    Stream chat completion from OpenAI
// @route   POST /api/ai/chat
// @access  Private
export const streamChat = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { messages, provider = 'claude' } = req.body;
    const useOpenAI = provider === 'openai';

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({
        success: false,
        message: 'Messages array is required',
      });
      return;
    }

    let claude: ReturnType<typeof getClaudeClient> | null = null;
    let openai: ReturnType<typeof getOpenAIClient> | null = null;

    if (useOpenAI) {
      try {
        openai = getOpenAIClient();
      } catch (error: any) {
        res.status(503).json({
          success: false,
          message: 'OpenAI service is not configured',
        });
        return;
      }
    } else {
      try {
        claude = getClaudeClient();
      } catch (error: any) {
        res.status(503).json({
          success: false,
          message: 'AI service is not configured',
        });
        return;
      }
    }

    // Get user data for context - cast to IUser | null for type compatibility
    const user = await User.findById(req.userId).select('healthInfo displayName') as IUser | null;

    // Detect risk in the most recent user message
    const lastUserMessage = messages
      .filter((m: { role: string }) => m.role === 'user')
      .pop()?.content || '';
    
    // Security: Only log risk detection in development, never log actual user messages
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Detecting risk in user message (message content not logged for privacy)');
    }
    const riskAssessment = detectRisk(lastUserMessage);
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Risk assessment result:', JSON.stringify(riskAssessment, null, 2));
    }
    
    // Resolve user country (ISO code like 'NL', 'US', etc.) from health info if available
    const userCountry = (user?.healthInfo as any)?.country as string | undefined;
    
    // If high risk, prepare crisis response (taking user country into account)
    let crisisResponse: { message: string; resources: Array<{ name: string; number: string; available: string }> } | null = null;
    if (riskAssessment.requiresCrisisResponse) {
      // Security: Only log that crisis response was triggered, not the actual response content
      if (process.env.NODE_ENV === 'development') {
        console.log('🚨 High risk detected! Preparing crisis response for country:', userCountry || 'default');
      }
      crisisResponse = getCrisisResources(riskAssessment.level, userCountry);
      if (process.env.NODE_ENV === 'development') {
        console.log('🚨 Crisis response prepared (details not logged for privacy)');
      }
    } else if (process.env.NODE_ENV === 'development') {
      console.log('✅ No crisis response needed');
    }
    
    // Get chat context from previous sessions — load 10 so Aurora has a richer
    // memory of who this person is across more recent history.
    const chatContextData = await ChatContext.find({ user: req.userId })
      .sort({ sessionDate: -1 })
      .limit(10)
      .select('importantPoints summary sessionDate')
      .lean();

    // Get long‑term profile memory if available
    const profileMemory = await UserProfileMemory.findOne({ user: req.userId }).lean();

    // Always fetch journal entries directly from the database to ensure:
    // 1. Correct sort order (newest first, guaranteed by DB query)
    // 2. Correct `createdAt` field (frontend context uses `date` not `createdAt`)
    // 3. Most up-to-date data (not stale frontend-cached entries)
    // Load 10 entries so Aurora can track mood trends over more time.
    const recentEntries = await JournalEntry.find({ author: req.userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('createdAt mood content aiInsights')
      .lean();
    const journalEntries: IJournalEntry[] = recentEntries as unknown as IJournalEntry[];

    // Fetch upcoming calendar events automatically
    const now = new Date();
    const upcomingEvents = await CalendarEvent.find({
      user: req.userId,
      startDate: { $gte: now },
    })
      .sort({ startDate: 1 })
      .limit(10)
      .lean();

    // ── RAG: retrieve semantically relevant memories ──────────────────────────
    // Use the user's latest message as the query so we surface memories that are
    // actually relevant to what they're talking about RIGHT NOW — not just recent ones.
    const ragQueryMessage = [...messages].reverse().find((m: any) => m.role === 'user');
    const ragMemories: string[] = [];
    if (ragQueryMessage?.content && req.userId) {
      try {
        const relevant = await retrieveRelevantMemories(req.userId, ragQueryMessage.content, 8);
        ragMemories.push(...relevant);
      } catch (ragErr) {
        // Non-critical — Aurora still works with standard context
        console.error('RAG retrieval failed (non-critical):', ragErr);
      }
    }

    // Build system message with context using enhanced therapeutic prompt
    let systemContent = getTherapeuticSystemPrompt();

    // Inject current date/time so Aurora can correctly compute "today", "yesterday", etc.
    // Use Europe/Amsterdam timezone since the app is primarily used there (UTC+1/UTC+2).
    const nowForDate = new Date();
    const currentDateLabel = nowForDate.toLocaleDateString('en-US', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      timeZone: 'Europe/Amsterdam',
    });
    const currentTimeLabel = nowForDate.toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit',
      timeZone: 'Europe/Amsterdam',
    });
    systemContent += `\n\nCURRENT DATE & TIME: Today is ${currentDateLabel} at ${currentTimeLabel} (user's local time). Use this to determine whether entries or events are "today", "yesterday", "this week", etc. — never just say "this past [weekday]" if the entry is from today.`;

    // If we have a long‑term profile memory, add it explicitly so Aurora
    // can build on a stable sense of who the user is beyond just 5 sessions.
    if (profileMemory && (profileMemory.coreFacts?.length || profileMemory.narrativeSummary)) {
      const profileFacts = (profileMemory.coreFacts || []).slice(0, 40);
      const factsText = profileFacts.length > 0
        ? profileFacts.map((p: string, idx: number) => `  ${idx + 1}. ${p}`).join('\n')
        : '';

      const narrativeText = profileMemory.narrativeSummary || '';

      systemContent += `\n\nUSER'S LONG‑TERM PROFILE SUMMARY (built across many past sessions):\n${factsText ? `${factsText}\n\n` : ''}${narrativeText}\n\nCRITICAL INSTRUCTIONS ABOUT THIS PROFILE:\n- Treat these as relatively stable facts and themes about the user.\n- Use them to keep continuity over time (values, long‑term struggles, recurring patterns, important relationships, work/study context, etc.).\n- When relevant, connect current messages to these long‑term themes so the user feels truly known.\n- Do NOT claim you don't remember past sessions if this profile is present — you DO have this persistent summary.\n- You don't need to recite the whole profile; instead, reference the parts that are relevant to what the user is talking about now.`;
    }

    // ── RAG: inject semantically matched memories into the prompt ─────────────
    // These are specific past memories most relevant to the current topic,
    // retrieved via cosine similarity from ALL past sessions (not just the last 10).
    if (ragMemories.length > 0) {
      const memoriesText = ragMemories
        .map((m, i) => `  ${i + 1}. ${m}`)
        .join('\n');
      systemContent += `\n\nRELEVANT MEMORIES FROM PAST SESSIONS (retrieved for this specific topic):\n${memoriesText}\n\nINSTRUCTIONS FOR THESE MEMORIES:\n- These points are specifically relevant to what the user is talking about RIGHT NOW.\n- Use them to show continuity and depth — e.g. "I remember you mentioned..." or weave them naturally.\n- Do NOT recite all of them; pick the ones most helpful for the current message.\n- Do NOT claim you don't remember if relevant memories are listed here.`;
    }

    // If we know the user's preferred display name, tell Aurora explicitly
    // so it can use the real name instead of any placeholders.
    // Guard: if the display name is identical to Aurora's own name (a common registration
    // mistake), skip the injection so Aurora falls back to "Hey" instead of calling the user
    // by its own AI name.
    const displayNameLower = (user?.displayName || '').toLowerCase().trim();
    const isAuroraOwnName = ['aurora', 'auroras', 'aurora.', 'aurora!'].includes(displayNameLower);
    if (user?.displayName && !isAuroraOwnName) {
      systemContent += `\n\nUSER'S PREFERRED NAME:\n- The user's preferred name is "${user.displayName}".\n- When you greet them or refer to them by name, ALWAYS use "${user.displayName}" (without brackets).\n- NEVER write placeholders like "[user's name]", "[Name]", "[user]" or any other bracketed text instead of their real name.\n- If you choose not to use their name in a given message, just say something simple like "Hey" without any brackets.`;
    }

    // Build user data context (journal, health, calendar, chat history) and inject it
    // at the TOP of the system content so the model encounters it immediately —
    // before any therapeutic instructions. This prevents the model from claiming
    // it has no access when the data is buried at the very end of a long prompt.
    const formattedContext = formatCompleteContextForAI(
      user,
      journalEntries,
      upcomingEvents, // calendar events automatically included
      chatContextData
    );
    if (formattedContext) {
      systemContent = formattedContext + '\n\n' + systemContent;
    }

    const systemMessage: ChatMessage = {
      role: 'system',
      content: systemContent,
    };

    // Check if this is the first message in the conversation (only user messages, no assistant responses yet)
    const userMessages = messages.filter((m: { role: string }) => m.role === 'user');
    const assistantMessages = messages.filter((m: { role: string }) => m.role === 'assistant');
    const isFirstMessage = userMessages.length === 1 && assistantMessages.length === 0;

    // On the first message, build a smart opening instruction for Aurora.
    // Instead of a random coin flip, always lead with the MOST SALIENT piece of data:
    //   Priority 1 — new journal entry (written since the last finished session) with a
    //                low or distressed mood → feels most urgent to check in about.
    //   Priority 2 — any new journal entry since last session (regardless of mood).
    //   Priority 3 — upcoming event within 48 hours (therapy appt, important date, etc.).
    //   Priority 4 — warm check-in that references a theme from the last session.
    //   Priority 5 — simple warm greeting if no prior data exists at all.
    if (isFirstMessage) {
      const latestEntry = journalEntries && journalEntries.length > 0 ? journalEntries[0] : null;
      const latestSessionDate = chatContextData && chatContextData.length > 0
        ? new Date(chatContextData[0].sessionDate)
        : null;

      const LOW_MOOD_LABELS = ['sad', 'anxious', 'overwhelmed', 'depressed', 'stressed', 'bad', 'terrible', 'awful', 'hopeless', 'angry', 'frustrated'];

      let openingHint = '';

      if (latestEntry) {
        const latestEntryDate = new Date(latestEntry.createdAt);
        const isNewEntry = !latestSessionDate || latestEntryDate > latestSessionDate;
        // mood is a numeric 1-10 scale; treat ≤4 as "low mood"
        const moodIsLow = typeof latestEntry.mood === 'number'
          ? (latestEntry.mood as number) <= 4
          : latestEntry.mood && LOW_MOOD_LABELS.some(label =>
              String(latestEntry.mood).toLowerCase().includes(label)
            );
        const latestDateLabel = latestEntryDate.toLocaleDateString('en-US', {
          weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Amsterdam',
        });

        if (isNewEntry && moodIsLow) {
          // Priority 1: new entry with low mood — check in warmly but directly
          openingHint = `The user wrote a new journal entry on ${latestDateLabel} and their mood appears low. In your first reply, gently acknowledge what they wrote — reference the content naturally, the way a therapist would after reading their notes. Don't say "I see you wrote…" — just weave it in. Then ask one open, caring question about how they're feeling now. Keep it warm and brief.`;
        } else if (isNewEntry) {
          // Priority 2: new entry any mood — reference it naturally
          openingHint = `The user wrote a new journal entry on ${latestDateLabel}. In your first reply, naturally reference what they wrote — the way a therapist who read the notes before the session would. Don't announce you're "checking their journal." Just bring it up warmly and ask one question to open up the conversation.`;
        }
      }

      // Priority 3: upcoming event within 48 hours, if no journal hook
      if (!openingHint && upcomingEvents && upcomingEvents.length > 0) {
        const nextEvent = upcomingEvents[0] as any;
        const eventDate = new Date(nextEvent.startDate);
        const hoursUntil = (eventDate.getTime() - Date.now()) / (1000 * 60 * 60);
        if (hoursUntil <= 48) {
          const eventLabel = nextEvent.title || 'something coming up';
          openingHint = `The user has "${eventLabel}" happening in the next 48 hours. In your first reply, mention this naturally — ask how they're feeling about it or if they want to talk through it. Keep it casual and warm.`;
        }
      }

      // Priority 4: theme from last session if no journal or event hook
      if (!openingHint && chatContextData && chatContextData.length > 0) {
        const lastSession = chatContextData[0];
        if (lastSession.summary) {
          openingHint = `Last session: "${lastSession.summary.slice(0, 200)}". In your first reply, briefly and warmly pick up the thread from last time — don't recite the summary, just reference the emotional core of it and ask how things have been since. Keep it short and human.`;
        }
      }

      // Priority 5: no prior data at all — just a warm open greeting
      const finishReminder = `At the very end of your first reply, add this one casual sentence: "And whenever you're done — don't forget to hit 'Finish Session' so I can remember all of this next time."`;
      const languageNote = `Also, in your first reply, include one short, natural sentence that lets them know they can talk to you in any language they prefer (e.g., "You can speak to me in any language — I'll follow along.").`;

      if (openingHint) {
        systemContent += `\n\nFIRST MESSAGE INSTRUCTIONS:\n- Greet the user briefly by their name (if you know it) — no long introductions.\n- ${openingHint}\n- ${languageNote}\n- ${finishReminder}`;
      } else {
        systemContent += `\n\nFIRST MESSAGE INSTRUCTIONS:\n- Greet the user warmly and briefly by name (if you know it). Keep it simple and human — ask how they are or what's on their mind.\n- ${languageNote}\n- ${finishReminder}`;
      }
    }

    // Update system message with the new content
    systemMessage.content = systemContent;

    // Prepare user/assistant messages for AI (without system)
    const userAssistantMessages: ChatMessage[] = messages.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // Determine which model/complexity setting to use based on conversation.
    // For now we route everything through Claude 3 Haiku to avoid model
    // availability issues on the current Anthropic account, but we still
    // use complexity to tune length.
    const useAdvancedModel = shouldUseAdvancedModel(userAssistantMessages);

    // For genuinely casual/simple messages, nudge toward conciseness — but never so short
    // that it kills the therapeutic tone. Therapeutic responses always need enough room to
    // reflect, name an emotion, and ask one question.
    if (!useAdvancedModel) {
      systemContent += '\n\nLENGTH NOTE: This is a lighter message. Keep the response natural and conversational — around 40–80 words. Still follow the Reflect → Name → Explore structure. Do NOT drop below 2 meaningful sentences.';
      systemMessage.content = systemContent;
    }

    // Final message array including system
    const openaiMessages: ChatMessage[] = [
      systemMessage,
      ...userAssistantMessages,
    ];

    // Token cap for streaming responses.
    // Therapeutic responses need enough room to reflect + name emotion + ask one question.
    // Advanced (emotional/complex): 500 tokens (~350 words) — enough for deep therapeutic work.
    // Standard: 300 tokens (~200 words) — enough for a real, warm therapeutic reply.
    const streamMaxTokens = useAdvancedModel ? 500 : 300;

    // ── Call AI provider BEFORE opening the SSE connection ─────────────────────
    // Accumulating the full response first means:
    //   1. We can retry on overloaded_error (up to 3 times, exponential back-off).
    //   2. We can strip stage directions before anything reaches the client.
    //   3. If provider fails entirely we can still return a clean JSON error.
    const MAX_RETRIES = 3;
    let accumulatedText = '';

    if (useOpenAI) {
      // ── OpenAI path ────────────────────────────────────────────────────────
      const openaiMessagesFormatted = openaiMessages.map(m => ({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content,
      }));

      const openaiModel = useAdvancedModel ? 'gpt-4o' : 'gpt-4o-mini';

      const completion = await openai!.chat.completions.create({
        model: openaiModel,
        messages: openaiMessagesFormatted,
        max_tokens: streamMaxTokens,
        temperature: 0.75,
      });

      accumulatedText = completion.choices[0]?.message?.content || '';
    } else {
      // ── Claude path ────────────────────────────────────────────────────────
      const selectedModel = 'claude-haiku-4-5';

      // Prepare Claude messages: system prompt + user/assistant turns
      const claudeMessages = openaiMessages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role,
          content: m.content,
        })) as { role: 'user' | 'assistant'; content: string }[];

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          accumulatedText = '';
          const stream = await claude!.messages.stream({
            model: selectedModel,
            system: systemContent,
            max_tokens: streamMaxTokens,
            temperature: 0.75,
            messages: claudeMessages.map(m => ({
              role: m.role,
              content: [{ type: 'text', text: m.content }],
            })),
          });

          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              accumulatedText += event.delta.text;
            }
          }

          break; // ✅ Success — exit retry loop

        } catch (err: any) {
          if (isOverloadedError(err) && attempt < MAX_RETRIES) {
            const delay = Math.pow(2, attempt) * 1000; // 1 s, 2 s, 4 s
            console.warn(`Claude overloaded — retrying in ${delay} ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
            await sleep(delay);
            continue;
          }
          // Non-overloaded error OR max retries exhausted — bubble up to outer catch
          throw err;
        }
      }
    }

    // ── Clean stage directions ────────────────────────────────────────────────
    const cleanedContent = cleanResponse(accumulatedText);

    // ── Only NOW open the SSE connection ─────────────────────────────────────
    // At this point Claude has responded successfully, so we won't need to send a
    // JSON error — it's safe to switch the response to SSE format.
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    // If high risk, send crisis resources before the AI reply
    if (riskAssessment.requiresCrisisResponse && crisisResponse) {
      const crisisData = {
        type: 'crisis_resources',
        riskLevel: riskAssessment.level,
        message: crisisResponse.message,
        resources: crisisResponse.resources,
      };
      if (process.env.NODE_ENV === 'development') {
        console.log('🚨 Sending crisis resources (details not logged for privacy)');
      }
      res.write(`data: ${JSON.stringify(crisisData)}\n\n`);
    }

    // Send cleaned AI response as a single SSE event — frontend typing animation
    // plays it out character by character so the UX feels identical to real streaming.
    if (cleanedContent) {
      res.write(`data: ${JSON.stringify({ content: cleanedContent })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error: any) {
    console.error('AI Chat error:', error);

    const friendlyMessage = isOverloadedError(error)
      ? "Aurora is a bit busy right now — please try again in a moment."
      : (error.message || 'Error generating response');

    if (!res.headersSent) {
      // SSE not yet opened — return a clean JSON error
      const statusCode = isOverloadedError(error) ? 503 : 500;
      res.status(statusCode).json({ success: false, message: friendlyMessage });
    } else {
      // SSE already opened — send error through stream and close
      res.write(`data: ${JSON.stringify({ error: friendlyMessage })}\n\n`);
      res.end();
    }
  }
};

// @desc    Non-streaming chat completion (for simple requests)
// @route   POST /api/ai/chat/complete
// @access  Private
export const completeChat = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { messages, maxTokens = 400, provider = 'claude' } = req.body;
    const useOpenAI = provider === 'openai';

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({
        success: false,
        message: 'Messages array is required',
      });
      return;
    }

    let claude: ReturnType<typeof getClaudeClient> | null = null;
    let openai: ReturnType<typeof getOpenAIClient> | null = null;

    if (useOpenAI) {
      try {
        openai = getOpenAIClient();
      } catch (error: any) {
        res.status(503).json({
          success: false,
          message: 'OpenAI service is not configured',
        });
        return;
      }
    } else {
      try {
        claude = getClaudeClient();
      } catch (error: any) {
        res.status(503).json({
          success: false,
          message: 'AI service is not configured',
        });
        return;
      }
    }

    // Get user data and context
    const user = await User.findById(req.userId).select('healthInfo displayName') as IUser | null;

    // Detect risk in the most recent user message
    const lastUserMessage = messages
      .filter((m: { role: string }) => m.role === 'user')
      .pop()?.content || '';
    
    // Run content moderation (non-blocking, logs only)
    moderateContent(lastUserMessage).catch(err => {
      console.error('Content moderation error:', err);
    });
    
    const riskAssessment = detectRisk(lastUserMessage);
    
    // Resolve user country from health info if available
    const userCountry = (user?.healthInfo as any)?.country as string | undefined;
    
    // If high risk, prepare crisis response using user country when available
    let crisisResponse: { message: string; resources: Array<{ name: string; number: string; available: string }> } | null = null;
    if (riskAssessment.requiresCrisisResponse) {
      crisisResponse = getCrisisResources(riskAssessment.level, userCountry);
    }
    
    // Get chat context from previous sessions — load 10 for richer memory.
    const chatContextData = await ChatContext.find({ user: req.userId })
      .sort({ sessionDate: -1 })
      .limit(10)
      .select('importantPoints summary sessionDate')
      .lean();

    // Get long‑term profile memory if available
    const profileMemory = await UserProfileMemory.findOne({ user: req.userId }).lean();

    // Always fetch journal entries directly from the database (same reason as streamChat):
    // ensures correct sort order, correct `createdAt` field, and fresh data.
    // Load 10 entries for better mood trend visibility.
    const recentEntriesComplete = await JournalEntry.find({ author: req.userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('createdAt mood content aiInsights')
      .lean();
    const journalEntries: IJournalEntry[] = recentEntriesComplete as unknown as IJournalEntry[];

    // Fetch upcoming calendar events automatically
    const now = new Date();
    const upcomingEvents = await CalendarEvent.find({
      user: req.userId,
      startDate: { $gte: now },
    })
      .sort({ startDate: 1 })
      .limit(10)
      .lean();

    // Build system message with context using enhanced therapeutic prompt
    // Include risk level in prompt to adjust response tone
    let systemContent = getTherapeuticSystemPrompt(riskAssessment.level);

    // Inject current date/time so Aurora can correctly compute "today", "yesterday", etc.
    const nowForDateComplete = new Date();
    const currentDateLabelComplete = nowForDateComplete.toLocaleDateString('en-US', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      timeZone: 'Europe/Amsterdam',
    });
    const currentTimeLabelComplete = nowForDateComplete.toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit',
      timeZone: 'Europe/Amsterdam',
    });
    systemContent += `\n\nCURRENT DATE & TIME: Today is ${currentDateLabelComplete} at ${currentTimeLabelComplete} (user's local time). Use this to determine whether entries or events are "today", "yesterday", "this week", etc. — never just say "this past [weekday]" if the entry is from today.`;

    // If we have a long‑term profile memory, add it explicitly so Aurora
    // can build on a stable sense of who the user is beyond just 5 sessions.
    if (profileMemory && (profileMemory.coreFacts?.length || profileMemory.narrativeSummary)) {
      const profileFacts = (profileMemory.coreFacts || []).slice(0, 40);
      const factsText = profileFacts.length > 0
        ? profileFacts.map((p: string, idx: number) => `  ${idx + 1}. ${p}`).join('\n')
        : '';

      const narrativeText = profileMemory.narrativeSummary || '';

      systemContent += `\n\nUSER'S LONG‑TERM PROFILE SUMMARY (built across many past sessions):\n${factsText ? `${factsText}\n\n` : ''}${narrativeText}\n\nCRITICAL INSTRUCTIONS ABOUT THIS PROFILE:\n- Treat these as relatively stable facts and themes about the user.\n- Use them to keep continuity over time (values, long‑term struggles, recurring patterns, important relationships, work/study context, etc.).\n- When relevant, connect current messages to these long‑term themes so the user feels truly known.\n- Do NOT claim you don't remember past sessions if this profile is present — you DO have this persistent summary.\n- You don't need to recite the whole profile; instead, reference the parts that are relevant to what the user is talking about now.`;
    }

    // If we know the user's preferred display name, tell Aurora explicitly
    // so it can use the real name instead of any placeholders.
    // Guard: if the display name matches Aurora's own AI name, skip it to prevent
    // Aurora from calling the user by its own name (common registration mistake).
    const completeChatDisplayNameLower = (user?.displayName || '').toLowerCase().trim();
    const completeChatIsAuroraOwnName = ['aurora', 'auroras', 'aurora.', 'aurora!'].includes(completeChatDisplayNameLower);
    if (user?.displayName && !completeChatIsAuroraOwnName) {
      systemContent += `\n\nUSER'S PREFERRED NAME:\n- The user's preferred name is "${user.displayName}".\n- When you greet them or refer to them by name, ALWAYS use "${user.displayName}" (without brackets).\n- NEVER write placeholders like "[user's name]", "[Name]", "[user]" or any other bracketed text instead of their real name.\n- If you choose not to use their name in a given message, just say something simple like "Hey" without any brackets.`;
    }
    
    // Add crisis-specific instructions if high risk detected
    if (riskAssessment.requiresCrisisResponse && crisisResponse) {
      systemContent += `\n\nCRITICAL: The user has expressed thoughts or behaviors indicating ${riskAssessment.category}. You MUST:
1. Express immediate concern for their safety
2. Prioritize safety over therapeutic exploration
3. Provide the following crisis resources:
${crisisResponse.resources.map(r => `- ${r.name}: ${r.number} (${r.available})`).join('\n')}
4. Keep your response focused, clear, and action-oriented
5. Encourage immediate action: "Please reach out to one of these resources right now, or call emergency services if you're in immediate danger"
6. Do NOT engage in long therapeutic discussions - safety comes first`;
    }

    // Inject user data at the TOP of the system content — same reason as streamChat.
    const formattedContext = formatCompleteContextForAI(
      user,
      journalEntries,
      upcomingEvents, // calendar events automatically included
      chatContextData
    );
    if (formattedContext) {
      systemContent = formattedContext + '\n\n' + systemContent;
    }

    // Determine which model/complexity setting to use based on conversation.
    // Same as streaming: we currently always use Haiku to avoid 404s, but use
    // complexity signal to further tighten length for simple questions.
    const useAdvancedModel = shouldUseAdvancedModel(messages as ChatMessage[]);

    if (!useAdvancedModel) {
      systemContent += '\n\nLENGTH NOTE: This is a lighter message. Keep the response natural and conversational — around 40–80 words. Still follow the Reflect → Name → Explore structure. Do NOT drop below 2 meaningful sentences.';
    }

    // Enforce an upper bound on response length even if client passes a high maxTokens.
    // Keep responses short and chat-like.
    // Therapeutic responses need room — raise caps to match streaming endpoint.
    const hardCap = useAdvancedModel ? 500 : 300;
    const safeMaxTokens = Math.min(maxTokens, hardCap);

    let rawContent = '';

    if (useOpenAI) {
      // ── OpenAI path ────────────────────────────────────────────────────────
      const openaiMessagesFormatted = [
        { role: 'system' as const, content: systemContent },
        ...(messages as ChatMessage[])
          .filter(m => m.role !== 'system')
          .map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
      ];
      const openaiModel = useAdvancedModel ? 'gpt-4o' : 'gpt-4o-mini';
      const completionOpenAI = await openai!.chat.completions.create({
        model: openaiModel,
        messages: openaiMessagesFormatted,
        max_tokens: safeMaxTokens,
        temperature: 0.75,
      });
      rawContent = completionOpenAI.choices[0]?.message?.content || '';
    } else {
      // ── Claude path ────────────────────────────────────────────────────────
      const selectedModel = 'claude-haiku-4-5';

      const claudeMessages = (messages as ChatMessage[])
        .filter(m => m.role !== 'system')
        .map(m => ({
          // Claude only accepts 'user' or 'assistant' roles
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: [
            {
              type: 'text',
              text: m.content,
            },
          ],
        }));

      // ── Call Claude with retry on overloaded errors ─────────────────────────
      const MAX_RETRIES_COMPLETE = 3;
      // Use a broad type here for compatibility with different TS lib targets.
      // We only read `.content` from the result below.
      let completion: any = null;

      for (let attempt = 0; attempt <= MAX_RETRIES_COMPLETE; attempt++) {
        try {
          completion = await claude!.messages.create({
            model: selectedModel,
            system: systemContent,
            max_tokens: safeMaxTokens,
            temperature: 0.75,
            messages: claudeMessages as any,
          });
          break; // ✅ Success

        } catch (err: any) {
          if (isOverloadedError(err) && attempt < MAX_RETRIES_COMPLETE) {
            const delay = Math.pow(2, attempt) * 1000;
            console.warn(`Claude overloaded (completeChat) — retrying in ${delay} ms (attempt ${attempt + 1}/${MAX_RETRIES_COMPLETE})`);
            await sleep(delay);
            continue;
          }
          throw err;
        }
      }

      rawContent =
        completion!.content
          .filter((block: any) => block.type === 'text')
          .map((block: any) => (block as any).text)
          .join('') || '';
    }

    // Apply the module-level stage-direction cleaner
    const content = cleanResponse(rawContent);

    res.json({
      success: true,
      data: {
        content,
        // Claude SDK does not yet expose token usage in the same shape as OpenAI;
        // you can add it here later if needed from completion.usage.
        ...(riskAssessment.requiresCrisisResponse && crisisResponse ? {
          crisisResources: {
            riskLevel: riskAssessment.level,
            message: crisisResponse.message,
            resources: crisisResponse.resources,
          },
        } : {}),
      },
    });

  } catch (error: any) {
    console.error('AI Chat completion error:', error);
    const statusCode = isOverloadedError(error) ? 503 : 500;
    const friendlyMessage = isOverloadedError(error)
      ? "Aurora is a bit busy right now — please try again in a moment."
      : (error.message || 'Error completing chat');
    res.status(statusCode).json({ success: false, message: friendlyMessage });
  }
};
