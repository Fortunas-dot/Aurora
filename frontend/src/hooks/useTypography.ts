import { useMemo } from 'react';
import { Platform } from 'react-native';
import { useSettingsStore } from '../store/settingsStore';
import { getFontFamily } from '../utils/fontHelper';

// SF Pro Display for titles and large UI elements
const getTitleFontFamily = (): string => {
  if (Platform.OS === 'ios') {
    // On iOS, SF Pro Display is optimized for large text/headers
    return 'SF Pro Display';
  }
  // Android fallback - use Roboto for headings
  return Platform.OS === 'android' ? 'Roboto' : 'System';
};

// SF Pro Text for body text
const getBodyFontFamily = (): string => {
  if (Platform.OS === 'ios') {
    // On iOS, SF Pro Text is optimized for body text
    return 'SF Pro Text';
  }
  // Android fallback - use Roboto for body text
  return Platform.OS === 'android' ? 'Roboto' : 'System';
};

export const useTypography = () => {
  const { fontFamily } = useSettingsStore();
  
  // Use user's selected font, but fallback to SF Pro Text on iOS if system is selected
  const selectedFont = fontFamily && fontFamily !== 'system' 
    ? getFontFamily(fontFamily) 
    : getBodyFontFamily();
  
  const titleFont = getTitleFontFamily(); // Always use SF Pro Display for headings
  const bodyFont = getBodyFontFamily(); // Use SF Pro Text for body text (unless user selected different font)
  
  return useMemo(() => ({
    h1: {
      fontFamily: titleFont,
      fontSize: 32,
      fontWeight: '800' as const, // Bolder to accentuate letterforms (J curve, double-storey a, r shoulder)
      lineHeight: 40,
      letterSpacing: -0.8, // Tighter spacing to emphasize letter shapes
    },
    h2: {
      fontFamily: titleFont,
      fontSize: 24,
      fontWeight: '700' as const, // Bolder for better letterform definition
      lineHeight: 32,
      letterSpacing: -0.6, // Tighter spacing
    },
    h3: {
      fontFamily: titleFont,
      fontSize: 20,
      fontWeight: '700' as const, // Bolder for consistency
      lineHeight: 28,
      letterSpacing: -0.4, // Tighter spacing
    },
    body: {
      fontFamily: selectedFont,
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    bodyMedium: {
      fontFamily: selectedFont,
      fontSize: 16,
      fontWeight: '500' as const,
      lineHeight: 24,
    },
    caption: {
      fontFamily: selectedFont,
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16,
    },
    captionMedium: {
      fontFamily: selectedFont,
      fontSize: 12,
      fontWeight: '500' as const,
      lineHeight: 16,
    },
    small: {
      fontFamily: selectedFont,
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
  }), [selectedFont, titleFont]);
};
