import type { LoginShellRenderProps } from './types';

export type ThemeColors = {
  backgroundGradient: readonly [string, string, string];
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  error: string;
  glass: { border: string; background: string; backgroundLight: string };
};

export type ShellProps = LoginShellRenderProps & { colors: ThemeColors };
