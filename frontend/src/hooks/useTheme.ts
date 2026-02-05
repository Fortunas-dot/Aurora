import { DARK_COLORS } from '../constants/theme';

export const useTheme = () => {
  // App only supports dark mode
  const activeTheme: 'dark' = 'dark';

  return {
    theme: activeTheme,
    colors: DARK_COLORS,
    isDark: true,
    isLight: false,
  };
};
