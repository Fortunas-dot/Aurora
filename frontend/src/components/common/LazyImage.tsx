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
    console.error('LazyImage: Error loading image:', uri, error);
    setIsLoading(false);
    setHasError(true);
  };

  // Normalize URL to always be absolute
  const imageUrl = useMemo(() => {
    if (!uri) return '';
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      return uri;
    }
    // If relative URL, make it absolute
    const baseUrl = 'https://aurora-production.up.railway.app';
    const relativeUrl = uri.startsWith('/') ? uri : `/${uri}`;
    return `${baseUrl}${relativeUrl}`;
  }, [uri]);

  return (
    <View style={[styles.container, style]}>
      {isLoading && (
        <View style={[styles.placeholder, style]}>
          {placeholder || <ActivityIndicator size="small" color={COLORS.primary} />}
        </View>
      )}
      {!hasError && (
        <Image
          source={{ uri: imageUrl }}
          style={[styles.image, style]}
          resizeMode={resizeMode}
          onLoad={handleLoad}
          onError={handleError}
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

