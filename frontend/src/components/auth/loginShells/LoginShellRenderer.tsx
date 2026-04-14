import React from 'react';
import { useTheme } from '../../../hooks/useTheme';
import type { LoginScreenVariant } from '../../../constants/loginScreenVariant';
import type { LoginShellRenderProps } from './types';
import { renderLoginShell } from './shells';

export type LoginShellRendererProps = LoginShellRenderProps & {
  variant: LoginScreenVariant;
};

export function LoginShellRenderer({ variant, ...rest }: LoginShellRendererProps) {
  const { colors } = useTheme();
  return renderLoginShell(variant, { ...rest, colors });
}
