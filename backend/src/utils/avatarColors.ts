const AVATAR_BACKGROUND_COLORS = [
  '#3B82F6',
  '#0EA5E9',
  '#1E40AF',
  '#8B5CF6',
  '#7C3AED',
  '#A855F7',
  '#14B8A6',
  '#06B6D4',
  '#0891B2',
  '#EC4899',
  '#F43F5E',
  '#D946EF',
  '#F59E0B',
  '#F97316',
  '#D97706',
  '#10B981',
  '#059669',
  '#84CC16',
  '#EF4444',
  '#DC2626',
  '#6B7280',
  '#475569',
  '#52525B',
] as const;

export function getRandomAvatarBackgroundColor(): string {
  const idx = Math.floor(Math.random() * AVATAR_BACKGROUND_COLORS.length);
  return AVATAR_BACKGROUND_COLORS[idx];
}

