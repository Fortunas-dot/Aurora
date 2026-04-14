import type { TranslationKey } from '../locales/translate';

export const LOGIN_SCREEN_VARIANTS = [
  'coral_wave',
  'aurora_glass',
  'prism_split',
  'nocturne_bloom',
  'horizon_sweep',
  'cipher_frame',
  'summit_line',
] as const;

export type LoginScreenVariant = (typeof LOGIN_SCREEN_VARIANTS)[number];

export const LOGIN_VARIANT_TITLE_KEY: Record<LoginScreenVariant, TranslationKey> = {
  aurora_glass: 'login_style_variant_aurora_glass',
  prism_split: 'login_style_variant_prism_split',
  nocturne_bloom: 'login_style_variant_nocturne_bloom',
  horizon_sweep: 'login_style_variant_horizon_sweep',
  cipher_frame: 'login_style_variant_cipher_frame',
  summit_line: 'login_style_variant_summit_line',
  coral_wave: 'login_style_variant_coral_wave',
};

export const LOGIN_VARIANT_DESC_KEY: Record<LoginScreenVariant, TranslationKey> = {
  aurora_glass: 'login_style_desc_aurora_glass',
  prism_split: 'login_style_desc_prism_split',
  nocturne_bloom: 'login_style_desc_nocturne_bloom',
  horizon_sweep: 'login_style_desc_horizon_sweep',
  cipher_frame: 'login_style_desc_cipher_frame',
  summit_line: 'login_style_desc_summit_line',
  coral_wave: 'login_style_desc_coral_wave',
};

export function isLoginScreenVariant(value: string | undefined): value is LoginScreenVariant {
  return (
    value !== undefined &&
    (LOGIN_SCREEN_VARIANTS as readonly string[]).includes(value)
  );
}

export const DEFAULT_LOGIN_SCREEN_VARIANT: LoginScreenVariant = 'coral_wave';

export const LOGIN_SCREEN_VARIANT_STORAGE_KEY = 'app_login_screen_variant';
