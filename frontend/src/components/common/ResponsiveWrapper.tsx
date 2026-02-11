import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { getScaleFactor, isTablet, isIPadPro } from '../../utils/responsive';

interface ResponsiveWrapperProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that applies responsive scaling to the entire app
 * This ensures proper scaling on iPad and large screens
 */
export const ResponsiveWrapper: React.FC<ResponsiveWrapperProps> = ({ children }) => {
  useEffect(() => {
    // Apply viewport meta tag for web
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      // Set viewport meta tag
      let viewport = document.querySelector('meta[name="viewport"]');
      if (!viewport) {
        viewport = document.createElement('meta');
        viewport.setAttribute('name', 'viewport');
        document.head.appendChild(viewport);
      }
      
      // For iPad Pro dimensions, set specific viewport
      const scale = getScaleFactor();
      if (window.innerWidth === 2064 || window.innerWidth === 2752) {
        viewport.setAttribute(
          'content',
          `width=2064, initial-scale=${scale}, maximum-scale=${scale}, user-scalable=no, viewport-fit=cover`
        );
      } else if (isTablet()) {
        viewport.setAttribute(
          'content',
          `width=device-width, initial-scale=${scale}, maximum-scale=${scale}, user-scalable=no, viewport-fit=cover`
        );
      } else {
        viewport.setAttribute(
          'content',
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
        );
      }
      
      // Apply CSS transform for scaling on web
      const rootElement = document.getElementById('root') || document.body;
      const appElement = rootElement?.querySelector('[data-reactroot]') || rootElement;
      
      if (appElement) {
        const scaleFactor = getScaleFactor();
        if (scaleFactor !== 1 && (isTablet() || isIPadPro())) {
          // Apply scaling via CSS
          (appElement as HTMLElement).style.transform = `scale(${scaleFactor})`;
          (appElement as HTMLElement).style.transformOrigin = 'top left';
          
          // Adjust container dimensions to prevent overflow
          if (isIPadPro() || (isTablet() && scaleFactor < 1)) {
            const originalWidth = window.innerWidth;
            const originalHeight = window.innerHeight;
            const scaledWidth = originalWidth / scaleFactor;
            const scaledHeight = originalHeight / scaleFactor;
            
            (appElement as HTMLElement).style.width = `${scaledWidth}px`;
            (appElement as HTMLElement).style.height = `${scaledHeight}px`;
            (appElement as HTMLElement).style.overflow = 'hidden';
          }
        } else {
          (appElement as HTMLElement).style.transform = '';
          (appElement as HTMLElement).style.width = '';
          (appElement as HTMLElement).style.height = '';
          (appElement as HTMLElement).style.overflow = '';
        }
      }
      
      // Also handle window resize
      const handleResize = () => {
        const scaleFactor = getScaleFactor();
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
          if (window.innerWidth === 2064 || window.innerWidth === 2752) {
            viewport.setAttribute(
              'content',
              `width=2064, initial-scale=${scaleFactor}, maximum-scale=${scaleFactor}, user-scalable=no, viewport-fit=cover`
            );
          } else if (isTablet()) {
            viewport.setAttribute(
              'content',
              `width=device-width, initial-scale=${scaleFactor}, maximum-scale=${scaleFactor}, user-scalable=no, viewport-fit=cover`
            );
          } else {
            viewport.setAttribute(
              'content',
              'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
            );
          }
        }
        
        // Reapply CSS transform on resize
        const rootElement = document.getElementById('root') || document.body;
        const appElement = rootElement?.querySelector('[data-reactroot]') || rootElement;
        if (appElement) {
          if (scaleFactor !== 1 && (isTablet() || isIPadPro())) {
            (appElement as HTMLElement).style.transform = `scale(${scaleFactor})`;
            (appElement as HTMLElement).style.transformOrigin = 'top left';
            if (isIPadPro() || (isTablet() && scaleFactor < 1)) {
              const scaledWidth = window.innerWidth / scaleFactor;
              const scaledHeight = window.innerHeight / scaleFactor;
              (appElement as HTMLElement).style.width = `${scaledWidth}px`;
              (appElement as HTMLElement).style.height = `${scaledHeight}px`;
            }
          } else {
            (appElement as HTMLElement).style.transform = '';
            (appElement as HTMLElement).style.width = '';
            (appElement as HTMLElement).style.height = '';
          }
        }
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // On native, we don't need to apply transforms - React Native handles it
  // But we can apply scaling through style props if needed
  const scaleFactor = Platform.OS === 'web' ? 1 : getScaleFactor();
  
  if (Platform.OS === 'web') {
    // Web scaling is handled via CSS transform in useEffect
    return <>{children}</>;
  }

  // For native, React Native handles scaling automatically through Dimensions
  // We don't need to apply manual transforms as it can cause layout issues
  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
