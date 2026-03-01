import React, { useState, useMemo } from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from '../../constants/theme';

interface LazyImageProps {
  uri: string;
  style?: any;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  placeholder?: React.ReactNode;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  uri,
  style,
  resizeMode = 'cover',
  placeholder,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = (error: any) => {
    // React Native Image onError may receive a native event, not always an error object
    // Only log in development to avoid console noise
    if (__DEV__) {
      const errorMessage = error?.message || error?.nativeEvent?.error || 'Unknown error';
      console.warn('LazyImage: Failed to load image:', imageUrl, errorMessage);
    }
    setIsLoading(false);
    setHasError(true);
  };

  // Normalize URL to always be absolute
  const imageUrl = useMemo(() => {
    if (!uri || uri.trim() === '') {
      console.warn('LazyImage: Empty or invalid URI provided');
      return null;
    }
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      return uri;
    }
    // If relative URL, make it absolute
    const baseUrl = 'https://aurora-production.up.railway.app';
    const relativeUrl = uri.startsWith('/') ? uri : `/${uri}`;
    const normalized = `${baseUrl}${relativeUrl}`;
    if (__DEV__) {
      console.log('LazyImage: Normalized URL:', normalized);
    }
    return normalized;
  }, [uri]);

  // Don't render if no valid URL
  if (!imageUrl) {
    return (
      <View style={[styles.container, style]}>
        <View style={[styles.errorContainer, style]}>
          {placeholder || <ActivityIndicator size="small" color={COLORS.textMuted} />}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {isLoading && (
        <View style={[styles.placeholder, style]}>
          {placeholder || <ActivityIndicator size="small" color={COLORS.primary} />}
        </View>
      )}
      {!hasError && imageUrl && (
        <Image
          source={{ uri: imageUrl }}
          style={[styles.image, style, isLoading && { opacity: 0 }]}
          resizeMode={resizeMode}
          onLoad={handleLoad}
          onError={handleError}
          onLoadStart={() => {
            setIsLoading(true);
            setHasError(false);
          }}
        />
      )}
      {hasError && (
        <View style={[styles.errorContainer, style]}>
          {placeholder || <ActivityIndicator size="small" color={COLORS.textMuted} />}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.glass.background,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.glass.background,
  },
});

