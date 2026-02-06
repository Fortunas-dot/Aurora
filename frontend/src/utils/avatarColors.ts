// Available background colors for avatar characters
export const AVATAR_BACKGROUND_COLORS = [
  // Blues
  { name: 'Blue', value: '#3B82F6', gradient: ['#60A5FA', '#3B82F6'] },
  { name: 'Sky Blue', value: '#0EA5E9', gradient: ['#38BDF8', '#0EA5E9'] },
  { name: 'Navy', value: '#1E40AF', gradient: ['#3B82F6', '#1E40AF'] },
  
  // Purples
  { name: 'Purple', value: '#8B5CF6', gradient: ['#A78BFA', '#8B5CF6'] },
  { name: 'Violet', value: '#7C3AED', gradient: ['#A78BFA', '#7C3AED'] },
  { name: 'Lavender', value: '#A855F7', gradient: ['#C084FC', '#A855F7'] },
  
  // Teals & Cyans
  { name: 'Teal', value: '#14B8A6', gradient: ['#5EEAD4', '#14B8A6'] },
  { name: 'Cyan', value: '#06B6D4', gradient: ['#22D3EE', '#06B6D4'] },
  { name: 'Turquoise', value: '#0891B2', gradient: ['#67E8F9', '#0891B2'] },
  
  // Pinks & Roses
  { name: 'Pink', value: '#EC4899', gradient: ['#F472B6', '#EC4899'] },
  { name: 'Rose', value: '#F43F5E', gradient: ['#FB7185', '#F43F5E'] },
  { name: 'Fuchsia', value: '#D946EF', gradient: ['#F0ABFC', '#D946EF'] },
  
  // Yellows & Oranges
  { name: 'Yellow', value: '#F59E0B', gradient: ['#FBBF24', '#F59E0B'] },
  { name: 'Orange', value: '#F97316', gradient: ['#FB923C', '#F97316'] },
  { name: 'Amber', value: '#D97706', gradient: ['#FCD34D', '#D97706'] },
  
  // Greens
  { name: 'Green', value: '#10B981', gradient: ['#34D399', '#10B981'] },
  { name: 'Emerald', value: '#059669', gradient: ['#34D399', '#059669'] },
  { name: 'Lime', value: '#84CC16', gradient: ['#A3E635', '#84CC16'] },
  
  // Reds
  { name: 'Red', value: '#EF4444', gradient: ['#F87171', '#EF4444'] },
  { name: 'Crimson', value: '#DC2626', gradient: ['#F87171', '#DC2626'] },
  
  // Grays
  { name: 'Gray', value: '#6B7280', gradient: ['#9CA3AF', '#6B7280'] },
  { name: 'Slate', value: '#475569', gradient: ['#64748B', '#475569'] },
  { name: 'Zinc', value: '#52525B', gradient: ['#71717A', '#52525B'] },
];

// Get default gradient colors based on name (fallback)
export const getDefaultGradientColors = (name?: string): string[] => {
  if (!name) return AVATAR_BACKGROUND_COLORS[0].gradient;
  
  const hash = name.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  const gradients = AVATAR_BACKGROUND_COLORS.map(c => c.gradient);
  return gradients[Math.abs(hash) % gradients.length];
};

// Get color by value
export const getColorByValue = (value: string | null | undefined): { name: string; value: string; gradient: string[] } | null => {
  if (!value) return null;
  return AVATAR_BACKGROUND_COLORS.find(c => c.value === value) || null;
};
