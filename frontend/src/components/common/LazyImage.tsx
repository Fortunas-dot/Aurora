import React, { useState, useMemo, useEffect } from 'react';
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

    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        runId: 'initial',
        hypothesisId: 'H2',
        location: 'LazyImage.tsx:handleLoad',
        message: 'LazyImage loaded successfully',
        data: { uri, imageUrl },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  };

  const handleError = (error: any) => {
    const errorMessage = error?.message || error?.nativeEvent?.error || 'Unknown error';
    setIsLoading(false);
    setHasError(true);

    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        runId: 'initial',
        hypothesisId: 'H3',
        location: 'LazyImage.tsx:handleError',
        message: 'LazyImage failed to load image',
        data: { uri, imageUrl, errorMessage },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    if (__DEV__) {
      console.warn('LazyImage: failed to load image', { uri, imageUrl, errorMessage });
    }
  };

  // Normalize URL to always be absolute
  const imageUrl = useMemo(() => {
    if (!uri || uri.trim() === '') {
      if (__DEV__) {
        console.warn('LazyImage: Empty or invalid URI provided');
      }
      return null;
    }
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      return uri;
    }
    // If relative URL, make it absolute
    const baseUrl = 'https://aurora-production.up.railway.app';
    const relativeUrl = uri.startsWith('/') ? uri : `/${uri}`;
    const normalized = `${baseUrl}${relativeUrl}`;

    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        runId: 'initial',
        hypothesisId: 'H2',
        location: 'LazyImage.tsx:imageUrl',
        message: 'LazyImage normalized URL',
        data: { originalUri: uri, normalized },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    if (__DEV__) {
      console.log('LazyImage: Normalized URL:', normalized);
    }
    return normalized;
  }, [uri]);

  // When the image URL changes, start a new loading cycle.
  useEffect(() => {
    if (!imageUrl) return;
    setIsLoading(true);
    setHasError(false);
    if (__DEV__) {
      console.log('LazyImage: start loading for URL change', { uri, imageUrl });
    }
  }, [imageUrl, uri]);

  useEffect(() => {
    if (__DEV__) {
      console.log('LazyImage: render', { uri, imageUrl });
    }
  }, [uri, imageUrl]);

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
          onLoad={() => {
            if (__DEV__) {
              console.log('LazyImage: onLoad', { uri, imageUrl });
            }
            handleLoad();
          }}
          onError={(error) => {
            if (__DEV__) {
              console.log('LazyImage: onError', {
                uri,
                imageUrl,
                error: error?.nativeEvent?.error || error?.message || 'Unknown',
              });
            }
            handleError(error);
          }}
          onLoadStart={() => {
            if (__DEV__) {
              console.log('LazyImage: onLoadStart', { uri, imageUrl });
            }
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

