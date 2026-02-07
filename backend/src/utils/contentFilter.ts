// Content filtering utility for objectionable content
// This is a basic implementation - in production, consider using a more sophisticated service

const objectionableWords: string[] = [
  // Add common objectionable words/phrases here
  // This is a basic list - expand as needed
];

/**
 * Check if content contains objectionable words
 * @param content - The content to check
 * @returns true if content is objectionable, false otherwise
 */
export const containsObjectionableContent = (content: string): boolean => {
  const lowerContent = content.toLowerCase();
  
  // Check against objectionable words list
  for (const word of objectionableWords) {
    if (lowerContent.includes(word.toLowerCase())) {
      return true;
    }
  }
  
  // Additional checks can be added here (spam patterns, etc.)
  
  return false;
};

/**
 * Filter content by replacing objectionable words
 * @param content - The content to filter
 * @returns Filtered content
 */
export const filterContent = (content: string): string => {
  let filtered = content;
  
  for (const word of objectionableWords) {
    const regex = new RegExp(word, 'gi');
    filtered = filtered.replace(regex, '*'.repeat(word.length));
  }
  
  return filtered;
};
