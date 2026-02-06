// Available avatar characters (stars/space themed emojis only)
export const AVATAR_CHARACTERS = [
  '🌙', // Moon
  '⭐', // Star
  '🌟', // Glowing star
  '💫', // Dizzy star
  '✨', // Sparkles
  '🌠', // Shooting star
  '☄️', // Comet
  '🚀', // Rocket
  '🛸', // UFO
  '👽', // Alien
  '🌌', // Milky Way
  '🔭', // Telescope
  '🌍', // Earth globe
  '🌎', // Earth globe Americas
  '🌏', // Earth globe Asia-Australia
  '🪐', // Ringed planet
  '🌑', // New moon
  '🌒', // Waxing crescent moon
  '🌓', // First quarter moon
  '🌔', // Waxing gibbous moon
  '🌕', // Full moon
  '🌖', // Waning gibbous moon
  '🌗', // Last quarter moon
  '🌘', // Waning crescent moon
];

// Get random character
export const getRandomCharacter = (): string => {
  return AVATAR_CHARACTERS[Math.floor(Math.random() * AVATAR_CHARACTERS.length)];
};
