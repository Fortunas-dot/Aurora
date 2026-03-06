/**
 * Pagination utility functions
 * Provides safe parsing and validation of pagination parameters
 */

/**
 * Safely parse and validate page number
 * @param pageStr - Page string from query params
 * @param defaultPage - Default page if invalid (default: 1)
 * @returns Valid page number (minimum 1)
 */
export const parsePage = (pageStr: string | undefined, defaultPage: number = 1): number => {
  if (!pageStr) return defaultPage;
  const parsed = Number.parseInt(pageStr, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return defaultPage;
  }
  return parsed;
};

/**
 * Safely parse and validate limit with maximum cap
 * @param limitStr - Limit string from query params
 * @param defaultLimit - Default limit if invalid (default: 20)
 * @param maxLimit - Maximum allowed limit (default: 100)
 * @returns Valid limit number (between 1 and maxLimit)
 */
export const parseLimit = (
  limitStr: string | undefined,
  defaultLimit: number = 20,
  maxLimit: number = 100
): number => {
  if (!limitStr) return defaultLimit;
  const parsed = Number.parseInt(limitStr, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return defaultLimit;
  }
  // Cap at maximum to prevent DoS
  return Math.min(parsed, maxLimit);
};

/**
 * Calculate skip value for pagination
 * @param page - Page number (1-indexed)
 * @param limit - Items per page
 * @returns Skip value for database query
 */
export const calculateSkip = (page: number, limit: number): number => {
  return Math.max(0, (page - 1) * limit);
};
