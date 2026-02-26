/**
 * Risk Detection Service
 * Analyzes user messages to detect high-risk content related to:
 * - Suicide and self-harm
 * - Abuse and violence
 * - Eating disorders
 * - Substance abuse
 * - Other mental health crises
 */

export enum RiskLevel {
  NONE = 'none',
  MILD_DISTRESS = 'mild_distress',
  MODERATE = 'moderate',
  HIGH_RISK_SELF_HARM = 'high_risk_self_harm',
  HIGH_RISK_SUICIDE = 'high_risk_suicide',
  ABUSE_VIOLENCE = 'abuse_violence',
  EATING_DISORDER = 'eating_disorder',
  SUBSTANCE_ABUSE = 'substance_abuse',
}

export interface RiskAssessment {
  level: RiskLevel;
  category: string;
  confidence: number; // 0-1
  keywords: string[];
  requiresCrisisResponse: boolean;
}

/**
 * Detect risk level in user message
 */
export const detectRisk = (message: string): RiskAssessment => {
  const lowerMessage = message.toLowerCase();
  const words = lowerMessage.split(/\s+/);

  // High-risk suicide indicators
  const suicideKeywords = [
    'kill myself', 'end my life', 'suicide', 'kill myself', 'end it all',
    'not want to live', 'better off dead', 'no reason to live', 'want to die',
    'planning suicide', 'suicide plan', 'going to kill myself', 'ending my life',
    'suicidal', 'take my life', 'end myself', 'die by suicide',
  ];

  // High-risk self-harm indicators
  const selfHarmKeywords = [
    'cut myself', 'hurt myself', 'self harm', 'self-harm', 'cutting',
    'burning myself', 'scratching myself', 'hurting myself', 'bleeding',
    'cut my', 'harm myself', 'injure myself',
  ];

  // Abuse and violence indicators
  const abuseKeywords = [
    'being abused', 'abuse me', 'hit me', 'beat me', 'hurt me',
    'threaten me', 'threatening', 'stalk', 'stalking', 'harass',
    'domestic violence', 'physical abuse', 'emotional abuse', 'sexual abuse',
    'rape', 'assault', 'attacked', 'violence',
  ];

  // Eating disorder indicators
  const eatingDisorderKeywords = [
    'not eating', 'starving myself', 'purging', 'binge eating', 'anorexia',
    'bulimia', 'throwing up', 'making myself throw up', 'laxatives',
    'not eating enough', 'restricting food', 'food restriction',
  ];

  // Substance abuse indicators
  const substanceAbuseKeywords = [
    'overdose', 'too many pills', 'too much alcohol', 'drinking too much',
    'taking too many', 'mixing drugs', 'drug overdose', 'alcohol poisoning',
  ];

  // Moderate distress indicators
  const moderateDistressKeywords = [
    'hopeless', 'helpless', 'worthless', 'no point', 'nothing matters',
    'can\'t go on', 'can\'t cope', 'overwhelmed', 'drowning', 'trapped',
    'no way out', 'stuck', 'desperate', 'despair',
  ];

  // Mild distress indicators
  const mildDistressKeywords = [
    'sad', 'down', 'upset', 'worried', 'anxious', 'stressed',
    'difficult', 'hard time', 'struggling', 'tough',
  ];

  // Check for high-risk suicide
  const suicideMatches = suicideKeywords.filter(keyword => 
    lowerMessage.includes(keyword)
  );
  if (suicideMatches.length > 0) {
    return {
      level: RiskLevel.HIGH_RISK_SUICIDE,
      category: 'suicide',
      confidence: Math.min(0.9, 0.5 + (suicideMatches.length * 0.1)),
      keywords: suicideMatches,
      requiresCrisisResponse: true,
    };
  }

  // Check for high-risk self-harm
  const selfHarmMatches = selfHarmKeywords.filter(keyword => 
    lowerMessage.includes(keyword)
  );
  if (selfHarmMatches.length > 0) {
    return {
      level: RiskLevel.HIGH_RISK_SELF_HARM,
      category: 'self_harm',
      confidence: Math.min(0.85, 0.5 + (selfHarmMatches.length * 0.1)),
      keywords: selfHarmMatches,
      requiresCrisisResponse: true,
    };
  }

  // Check for abuse/violence
  const abuseMatches = abuseKeywords.filter(keyword => 
    lowerMessage.includes(keyword)
  );
  if (abuseMatches.length > 0) {
    return {
      level: RiskLevel.ABUSE_VIOLENCE,
      category: 'abuse',
      confidence: Math.min(0.8, 0.4 + (abuseMatches.length * 0.15)),
      keywords: abuseMatches,
      requiresCrisisResponse: true,
    };
  }

  // Check for eating disorders
  const eatingDisorderMatches = eatingDisorderKeywords.filter(keyword => 
    lowerMessage.includes(keyword)
  );
  if (eatingDisorderMatches.length > 0) {
    return {
      level: RiskLevel.EATING_DISORDER,
      category: 'eating_disorder',
      confidence: Math.min(0.75, 0.4 + (eatingDisorderMatches.length * 0.15)),
      keywords: eatingDisorderMatches,
      requiresCrisisResponse: false, // Still serious but may not need immediate crisis response
    };
  }

  // Check for substance abuse
  const substanceMatches = substanceAbuseKeywords.filter(keyword => 
    lowerMessage.includes(keyword)
  );
  if (substanceMatches.length > 0) {
    return {
      level: RiskLevel.SUBSTANCE_ABUSE,
      category: 'substance_abuse',
      confidence: Math.min(0.8, 0.4 + (substanceMatches.length * 0.15)),
      keywords: substanceMatches,
      requiresCrisisResponse: true, // Overdose risk
    };
  }

  // Check for moderate distress
  const moderateMatches = moderateDistressKeywords.filter(keyword => 
    lowerMessage.includes(keyword)
  );
  if (moderateMatches.length > 0) {
    return {
      level: RiskLevel.MODERATE,
      category: 'distress',
      confidence: Math.min(0.6, 0.3 + (moderateMatches.length * 0.1)),
      keywords: moderateMatches,
      requiresCrisisResponse: false,
    };
  }

  // Check for mild distress
  const mildMatches = mildDistressKeywords.filter(keyword => 
    lowerMessage.includes(keyword)
  );
  if (mildMatches.length > 0) {
    return {
      level: RiskLevel.MILD_DISTRESS,
      category: 'distress',
      confidence: Math.min(0.4, 0.2 + (mildMatches.length * 0.05)),
      keywords: mildMatches,
      requiresCrisisResponse: false,
    };
  }

  // No risk detected
  return {
    level: RiskLevel.NONE,
    category: 'none',
    confidence: 0,
    keywords: [],
    requiresCrisisResponse: false,
  };
};

/**
 * Get crisis response resources based on risk level
 */
export const getCrisisResources = (riskLevel: RiskLevel): {
  message: string;
  resources: Array<{ name: string; number: string; available: string }>;
} => {
  const resources: Array<{ name: string; number: string; available: string }> = [];

  // International crisis resources
  resources.push(
    {
      name: 'International Suicide Prevention',
      number: 'https://www.iasp.info/resources/Crisis_Centres/',
      available: '24/7',
    }
  );

  // US resources
  resources.push(
    {
      name: '988 Suicide & Crisis Lifeline (US)',
      number: '988',
      available: '24/7',
    },
    {
      name: 'Crisis Text Line (US)',
      number: 'Text HOME to 741741',
      available: '24/7',
    }
  );

  // UK resources
  resources.push(
    {
      name: 'Samaritans (UK)',
      number: '116 123',
      available: '24/7',
    }
  );

  // Netherlands resources
  resources.push(
    {
      name: '113 Zelfmoordpreventie (NL)',
      number: '113',
      available: '24/7',
    },
    {
      name: 'De Luisterlijn (NL)',
      number: '0900-0767',
      available: '24/7',
    }
  );

  let message = '';
  if (riskLevel === RiskLevel.HIGH_RISK_SUICIDE) {
    message = 'I\'m deeply concerned about your safety. Your life has value, and there are people who want to help you right now.';
  } else if (riskLevel === RiskLevel.HIGH_RISK_SELF_HARM) {
    message = 'I\'m worried about you. Self-harm can be dangerous, and there are safer ways to cope with difficult feelings.';
  } else if (riskLevel === RiskLevel.ABUSE_VIOLENCE) {
    message = 'I\'m concerned about your safety. No one deserves to be hurt or threatened.';
  } else {
    message = 'I want to make sure you have the support you need.';
  }

  return { message, resources };
};
