/**
 * Prompt Engine
 * Builds therapeutic system prompts with user context
 */

import type { ChatCompletionMessageParam } from 'openai/resources/chat';
import { UserProfile } from '../../types';

export class PromptEngine {
  /**
   * Build therapeutic system prompt with user context
   */
  static buildSystemPrompt(userProfile?: UserProfile): string {
    const basePrompt = `You are a warm, empathetic AI therapist providing emotional support and guidance.

CORE PRINCIPLES:
- Use reflective listening and validation
- Respond with warmth, care, and genuine empathy
- Ask thoughtful, open-ended questions
- Never diagnose mental health conditions or provide medical advice
- Maintain therapeutic boundaries
- Keep responses concise (2-4 sentences, optimized for voice)
- Use natural, conversational language

THERAPEUTIC APPROACH:
- Validate emotions before exploring solutions
- Match the user's emotional energy appropriately
- Use "you" statements to show understanding ("It sounds like you're feeling...")
- Gently guide without being prescriptive
- Celebrate small wins and progress
- Normalize difficult emotions

SAFETY PROTOCOL:
- If user mentions self-harm or suicide, respond with immediate care and provide crisis resources:
  * National Suicide Prevention Lifeline: 988 (US)
  * Crisis Text Line: Text HOME to 741741
- Encourage professional help for clinical issues

CONVERSATION STYLE:
- Speak as if in a warm, safe therapy room
- Be present and attentive
- Show curiosity about their experience
- Avoid jargon unless helpful
- Use metaphors when appropriate`;

    // Add user context if available
    if (userProfile) {
      const contextParts: string[] = [];

      if (userProfile.coreValues && userProfile.coreValues.length > 0) {
        contextParts.push(`Core Values: ${userProfile.coreValues.join(', ')}`);
      }

      if (userProfile.emotionalPatterns && userProfile.emotionalPatterns.length > 0) {
        const patterns = userProfile.emotionalPatterns
          .slice(-3) // Last 3 patterns
          .map((p: any) => `${p.pattern} (${p.frequency})`)
          .join(', ');
        contextParts.push(`Common Patterns: ${patterns}`);
      }

      if (userProfile.currentGoals && userProfile.currentGoals.length > 0) {
        const goals = userProfile.currentGoals
          .filter((g: any) => g.status === 'active' || g.status === 'progressing')
          .map((g: any) => g.goal)
          .join(', ');
        if (goals) {
          contextParts.push(`Current Goals: ${goals}`);
        }
      }

      if (userProfile.communicationPreferences) {
        const prefs = userProfile.communicationPreferences as any;
        if (prefs.directness) {
          contextParts.push(`Communication Style: ${prefs.directness}`);
        }
      }

      if (contextParts.length > 0) {
        return `${basePrompt}

USER CONTEXT:
${contextParts.join('\n')}

Use this context to provide more personalized support, but don't reference it directly unless relevant.`;
      }
    }

    return basePrompt;
  }

  /**
   * Build conversation messages array
   */
  static buildMessages(
    userProfile: UserProfile | undefined,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
    newUserMessage: string
  ): ChatCompletionMessageParam[] {
    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: this.buildSystemPrompt(userProfile),
      },
    ];

    // Add conversation history (limit to last 10 messages for context window)
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    // Add new user message
    messages.push({
      role: 'user',
      content: newUserMessage,
    });

    return messages;
  }

  /**
   * Build opening message for a new session
   */
  static buildOpeningMessage(userName?: string): string {
    const greetings = [
      "Hello! I'm here to listen and support you. How are you feeling today?",
      "Hi there. I'm glad you're here. What's on your mind today?",
      "Welcome. This is a safe space for you. What would you like to talk about?",
      "Hello. I'm here for you. How have you been?",
    ];

    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  /**
   * Build session closing message
   */
  static buildClosingMessage(): string {
    return "I want to thank you for sharing with me today. Before we end, let me summarize what we discussed...";
  }
}
