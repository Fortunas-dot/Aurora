import { Dimensions, Platform, PixelRatio } from 'react-native';

// Base dimensions (iPhone 14 Pro - common mobile baseline)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

// iPad Pro 12.9" dimensions (2064 x 2752 logical points)
const IPAD_PRO_WIDTH = 1024;
const IPAD_PRO_HEIGHT = 1366;

// Get current window dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Check if device is a tablet/iPad
 */
export const isTablet = (): boolean => {
  if (Platform.OS === 'web') {
    // On web, check viewport width
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return SCREEN_WIDTH >= 768;
  }
  
  // On native, check if width is tablet-sized
  const aspectRatio = SCREEN_HEIGHT / SCREEN_WIDTH;
  return SCREEN_WIDTH >= 768 || (SCREEN_WIDTH >= 600 && aspectRatio < 1.6);
};

/**
 * Check if device is iPad Pro 12.9" (2064 x 2752)
 */
export const isIPadPro = (): boolean => {
  // iPad Pro 12.9" has logical dimensions of 1024 x 1366
  // Physical dimensions are 2064 x 2752 (2x scale)
  return (
    (SCREEN_WIDTH === 1024 && SCREEN_HEIGHT === 1366) ||
    (SCREEN_WIDTH === 1366 && SCREEN_HEIGHT === 1024) ||
    // Also check for web with these dimensions
    (Platform.OS === 'web' && typeof window !== 'undefined' && 
     (window.innerWidth === 2064 || window.innerWidth === 2752))
  );
};

/**
 * Calculate scale factor for responsive sizing
 * For tablets, scale down to prevent everything looking zoomed out
 */
export const getScaleFactor = (): number => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const webWidth = window.innerWidth;
    const webHeight = window.innerHeight;
    
    // For iPad Pro 12.9" dimensions (2064 x 2752) - physical pixels
    // Logical dimensions are 1024 x 1366, so we need to scale down
    if ((webWidth === 2064 && webHeight === 2752) || (webWidth === 2752 && webHeight === 2064)) {
      // Scale to match logical dimensions (1024/2064 ≈ 0.496)
      // But we want it to look like a normal tablet, so scale to ~390px base width
      // 390 / 1024 ≈ 0.38, but we'll use 0.5 for better readability
      return 0.5;
    }
    
    // For iPad logical dimensions (1024 x 1366)
    if ((webWidth === 1024 && webHeight === 1366) || (webWidth === 1366 && webHeight === 1024)) {
      // Scale to mobile-like size
      return BASE_WIDTH / 1024; // ≈ 0.38
    }
    
    // For other large screens, scale proportionally
    if (webWidth >= 1024) {
      // Scale down large screens to feel more like mobile
      const scale = BASE_WIDTH / webWidth;
      return Math.max(0.5, Math.min(1, scale * 1.3));
    }
    
    return 1;
  }
  
  if (isIPadPro()) {
    // iPad Pro 12.9" - logical dimensions are 1024 x 1366
    // Scale to feel more like mobile
    return BASE_WIDTH / IPAD_PRO_WIDTH; // ≈ 0.38
  }
  
  if (isTablet()) {
    // Other tablets - scale down moderately
    const scale = BASE_WIDTH / SCREEN_WIDTH;
    return Math.max(0.5, Math.min(1, scale * 1.2));
  }
  
  // Mobile devices - no scaling needed
  return 1;
};

/**
 * Scale a value based on screen size
 */
export const scale = (size: number): number => {
  const scaleFactor = getScaleFactor();
  return size * scaleFactor;
};

/**
 * Scale font size (with additional scaling for tablets)
 */
export const scaleFont = (size: number): number => {
  const scaleFactor = getScaleFactor();
  // Fonts scale slightly less aggressively
  return size * Math.max(0.6, scaleFactor);
};

/**
 * Get responsive dimensions
 */
export const getResponsiveDimensions = () => {
  const scaleFactor = getScaleFactor();
  const pixelRatio = PixelRatio.get();
  
  return {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    scaleFactor,
    pixelRatio,
    isTablet: isTablet(),
    isIPadPro: isIPadPro(),
    // Scaled dimensions
    scaledWidth: SCREEN_WIDTH * scaleFactor,
    scaledHeight: SCREEN_HEIGHT * scaleFactor,
  };
};

/**
 * Get responsive spacing (scaled)
 */
export const getResponsiveSpacing = () => {
  const scaleFactor = getScaleFactor();
  
  return {
    xs: scale(4),
    sm: scale(8),
    md: scale(16),
    lg: scale(24),
    xl: scale(32),
    xxl: scale(48),
  };
};

/**
 * Hook-like function to get responsive values
 * Can be used in components
 */
export const useResponsive = () => {
  return {
    ...getResponsiveDimensions(),
    scale,
    scaleFont,
    spacing: getResponsiveSpacing(),
  };
};
