import { ViewStyle, TextStyle, Platform } from 'react-native';

// Dark theme with glass effect colors
export const COLORS = {
  // Background - Deep dark with subtle gradient
  background: '#0A0E1A',
  backgroundGradient: ['#0A0E1A', '#151B2E', '#1A2238'] as readonly [string, string, string],
  surface: '#141824',
  surfaceLight: '#1E2536',

  // Glass effect colors
  glass: {
    background: 'rgba(255, 255, 255, 0.08)',
    backgroundLight: 'rgba(255, 255, 255, 0.12)',
    backgroundDark: 'rgba(255, 255, 255, 0.04)',
    border: 'rgba(255, 255, 255, 0.15)',
    borderLight: 'rgba(255, 255, 255, 0.25)',
    highlight: 'rgba(255, 255, 255, 0.1)',
  },

  // Text - High contrast for dark mode
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textMuted: 'rgba(255, 255, 255, 0.5)',
  textInverse: '#0A0E1A',

  // Primary - Soft blue accent
  primary: '#60A5FA',
  primaryLight: '#93C5FD',
  primaryDark: '#3B82F6',
  primaryGlow: 'rgba(96, 165, 250, 0.3)',

  // Secondary - Warm purple accent
  secondary: '#A78BFA',
  secondaryLight: '#C4B5FD',
  secondaryDark: '#8B5CF6',

  // Accent - Soft teal
  accent: '#5EEAD4',
  accentLight: '#99F6E4',
  accentDark: '#2DD4BF',

  // Message bubbles - Glass effect
  userBubble: 'rgba(96, 165, 250, 0.25)',
  userBubbleBorder: 'rgba(96, 165, 250, 0.4)',
  assistantBubble: 'rgba(255, 255, 255, 0.08)',
  assistantBubbleBorder: 'rgba(255, 255, 255, 0.15)',

  // UI
  border: 'rgba(255, 255, 255, 0.1)',
  borderLight: 'rgba(255, 255, 255, 0.2)',
  divider: 'rgba(255, 255, 255, 0.08)',
  white: '#FFFFFF',
  black: '#000000',

  // Status colors with glass effect
  error: '#F87171',
  errorGlass: 'rgba(248, 113, 113, 0.2)',
  success: '#34D399',
  successGlass: 'rgba(52, 211, 153, 0.2)',
  warning: '#FBBF24',
  warningGlass: 'rgba(251, 191, 36, 0.2)',
  info: '#60A5FA',
  infoGlass: 'rgba(96, 165, 250, 0.2)',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.6)',
  overlayLight: 'rgba(0, 0, 0, 0.4)',

  // Tab bar
  tabBar: 'rgba(20, 24, 36, 0.95)',
  tabBarBorder: 'rgba(255, 255, 255, 0.1)',
  tabInactive: 'rgba(255, 255, 255, 0.5)',
  tabActive: '#60A5FA',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// SF Pro font family - iOS uses SF Pro, Android uses Roboto as fallback
const FONT_FAMILY = Platform.select({
  ios: 'SF Pro Display', // For headings
  android: 'Roboto',
  default: 'System',
});

const FONT_FAMILY_TEXT = Platform.select({
  ios: 'SF Pro Text', // For body text
  android: 'Roboto',
  default: 'System',
});

export const TYPOGRAPHY = {
  h1: {
    fontFamily: FONT_FAMILY,
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: FONT_FAMILY,
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily: FONT_FAMILY,
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  body: {
    fontFamily: FONT_FAMILY_TEXT,
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: FONT_FAMILY_TEXT,
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 24,
  },
  caption: {
    fontFamily: FONT_FAMILY_TEXT,
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  captionMedium: {
    fontFamily: FONT_FAMILY_TEXT,
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
  },
  small: {
    fontFamily: FONT_FAMILY_TEXT,
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
};

export const BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
};

// Glass style presets
export const GLASS_STYLES: Record<string, ViewStyle> = {
  card: {
    backgroundColor: COLORS.glass.background,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    overflow: 'hidden',
  },
  cardLight: {
    backgroundColor: COLORS.glass.backgroundLight,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glass.borderLight,
    overflow: 'hidden',
  },
  cardDark: {
    backgroundColor: COLORS.glass.backgroundDark,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    overflow: 'hidden',
  },
  button: {
    backgroundColor: COLORS.glass.backgroundLight,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    overflow: 'hidden',
  },
  buttonPrimary: {
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.4)',
    overflow: 'hidden',
  },
  input: {
    backgroundColor: COLORS.glass.backgroundDark,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
  },
  inputFocused: {
    backgroundColor: COLORS.glass.background,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  modal: {
    backgroundColor: 'rgba(20, 24, 36, 0.95)',
    borderRadius: BORDER_RADIUS.xxl,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    overflow: 'hidden',
  },
  tabBar: {
    backgroundColor: COLORS.tabBar,
    borderTopWidth: 1,
    borderTopColor: COLORS.tabBarBorder,
  },
};

// Shadow presets (for iOS)
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
};
