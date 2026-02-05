import { Platform } from 'react-native';

// Font mapping for different font IDs
const FONT_MAP: Record<string, string> = {
  system: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }) || 'System',
  sfpro: Platform.select({ ios: 'SF Pro Display', android: 'Roboto', default: 'SF Pro Display' }) || 'SF Pro Display',
  roboto: 'Roboto',
  arial: 'Arial',
  helvetica: 'Helvetica',
  georgia: 'Georgia',
  times: 'Times New Roman',
  courier: 'Courier New',
  verdana: 'Verdana',
  trebuchet: 'Trebuchet MS',
  comic: 'Comic Sans MS',
  impact: 'Impact',
  palatino: 'Palatino',
  // Vintage/Classic fonts
  baskerville: 'Baskerville',
  garamond: 'Garamond',
  bookantiqua: 'Book Antiqua',
  didot: 'Didot',
  bodoni: 'Bodoni',
  caslon: 'Caslon',
  minion: 'Minion Pro',
  baskervilleoldface: 'Baskerville Old Face',
};

export const getFontFamily = (fontId: string | undefined): string => {
  if (!fontId || fontId === 'system') {
    return Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }) || 'System';
  }
  return FONT_MAP[fontId] || Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }) || 'System';
};
