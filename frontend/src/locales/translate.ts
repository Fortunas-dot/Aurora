import { EN, type TranslationKey } from './en';
import { AR } from './ar';
import { ES } from './es';
import { JA } from './ja';

export type { TranslationKey };

type AppLanguage = 'en' | 'ar' | 'es' | 'ja';

/**
 * Resolve UI string for the active language. Missing ar/es/ja strings fall back to English.
 */
export function translate(
  lang: AppLanguage,
  key: TranslationKey,
  vars?: Record<string, string | number>
): string {
  let base: string | undefined;
  if (lang === 'ja') {
    base = JA[key] !== undefined && JA[key] !== '' ? (JA[key] as string) : EN[key];
  } else if (lang === 'es') {
    base = ES[key] !== undefined && ES[key] !== '' ? (ES[key] as string) : EN[key];
  } else if (lang === 'ar') {
    base = AR[key] !== undefined && AR[key] !== '' ? (AR[key] as string) : EN[key];
  } else {
    base = EN[key];
  }
  return interpolate(base ?? String(key), vars);
}

function interpolate(template: string | undefined, vars?: Record<string, string | number>): string {
  if (!template) return '';
  if (!vars) return template;
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{{${k}}}`).join(String(v));
  }
  return out;
}
