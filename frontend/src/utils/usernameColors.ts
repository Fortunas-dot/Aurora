/**
 * Generates a consistent neon color for a user based on their ID
 * Returns bright, vibrant neon colors like yellow, pink, cyan, etc.
 */

const NEON_COLORS = [
  '#FF00FF', // Magenta/Pink
  '#00FFFF', // Cyan
  '#FFFF00', // Yellow
  '#FF00FF', // Hot Pink
  '#00FF00', // Lime Green
  '#FF1493', // Deep Pink
  '#00CED1', // Dark Turquoise
  '#FFD700', // Gold
  '#FF69B4', // Hot Pink
  '#00FF7F', // Spring Green
  '#FF4500', // Orange Red
  '#7FFF00', // Chartreuse
  '#FF1493', // Deep Pink
  '#00BFFF', // Deep Sky Blue
  '#FF6347', // Tomato
  '#32CD32', // Lime Green
  '#FF00FF', // Fuchsia
  '#00FFFF', // Aqua
  '#FFFF00', // Yellow
  '#FF1493', // Deep Pink
  '#00CED1', // Dark Turquoise
  '#FFD700', // Gold
  '#FF69B4', // Hot Pink
  '#00FF7F', // Spring Green
  '#FF4500', // Orange Red
  '#7FFF00', // Chartreuse
  '#00BFFF', // Deep Sky Blue
  '#FF6347', // Tomato
  '#32CD32', // Lime Green
  '#FF00FF', // Fuchsia
];

// Color mapping for user-selected colors
const USER_COLORS: Record<string, string> = {
  'Yellow': '#FFFF00',
  'Blue': '#00BFFF',
  'Pink': '#FF69B4',
  'Green': '#00FF00',
  'Red': '#FF4500',
  'Purple': '#FF00FF',
};

/**
 * Generates a consistent color for a user based on their ID
 * If the user has a chosen nameColor, it uses that instead
 * @param userId - The user's ID (string)
 * @param user - Optional user object with nameColor property
 * @returns A hex color string
 */
export const getUsernameColor = (userId: string, user?: { nameColor?: string | null }): string => {
  // If user has chosen a color, use it
  if (user?.nameColor && USER_COLORS[user.nameColor]) {
    return USER_COLORS[user.nameColor];
  }

  if (!userId) {
    return NEON_COLORS[0];
  }

  // Create a simple hash from the user ID
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Use absolute value and modulo to get an index
  const index = Math.abs(hash) % NEON_COLORS.length;
  return NEON_COLORS[index];
};
