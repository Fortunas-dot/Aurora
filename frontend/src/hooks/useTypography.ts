import { useMemo } from 'react';
import { Platform } from 'react-native';
import { useSettingsStore } from '../store/settingsStore';
import { getFontFamily } from '../utils/fontHelper';

// SF Pro Display for titles and large UI elements
const getTitleFontFamily = () => {
  return Platform.select({
    ios: 'SF Pro Display',
    android: 'Roboto', // Android fallback
    default: 'System',
  }) || 'System';
};

export const useTypography = () => {
  const { fontFamily } = useSettingsStore();
  
  const selectedFont = getFontFamily(fontFamily);
  const titleFont = getTitleFontFamily(); // Always use SF Pro Display for headings
  
  return useMemo(() => ({
    h1: {
      fontFamily: titleFont,
      fontSize: 32,
      fontWeight: '700' as const,
      lineHeight: 40,
      letterSpacing: -0.5,
    },
    h2: {
      fontFamily: titleFont,
      fontSize: 24,
      fontWeight: '600' as const,
      lineHeight: 32,
      letterSpacing: -0.3,
    },
    h3: {
      fontFamily: titleFont,
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 28,
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
