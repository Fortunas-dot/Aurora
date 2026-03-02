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
    const errorMessage = error?.message || error?.nativeEvent?.error || 'Unknown error';
    setIsLoading(false);
    setHasError(true);

    // #region agent log
    // CRITICAL: When image fails, do a HEAD request to see what HTTP status the URL returns
    if (imageUrl) {
      fetch(imageUrl, { method: 'HEAD' })
        .then(resp => {
          fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LazyImage.tsx:handleError',message:'LazyImage FAILED - HTTP probe result',data:{imageUrl,httpStatus:resp.status,httpStatusText:resp.statusText,contentType:resp.headers.get('content-type'),contentLength:resp.headers.get('content-length'),errorMessage},timestamp:Date.now(),runId:'run2',hypothesisId:'H1'})}).catch(()=>{});
        })
        .catch(fetchErr => {
          fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LazyImage.tsx:handleError',message:'LazyImage FAILED - HTTP probe ALSO failed',data:{imageUrl,fetchError:String(fetchErr),errorMessage},timestamp:Date.now(),runId:'run2',hypothesisId:'H1'})}).catch(()=>{});
        });
    } else {
      fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LazyImage.tsx:handleError',message:'LazyImage FAILED - no imageUrl',data:{uri,imageUrl,errorMessage},timestamp:Date.now(),runId:'run2',hypothesisId:'H3'})}).catch(()=>{});
    }
    // #endregion
  };

  // Normalize URL to always be absolute
  const imageUrl = useMemo(() => {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LazyImage.tsx:37',message:'LazyImage - Input URI',data:{uri,uriLength:uri?.length,isAbsolute:uri?.startsWith('http')},timestamp:Date.now(),runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    if (!uri || uri.trim() === '') {
      if (__DEV__) {
        console.warn('LazyImage: Empty or invalid URI provided');
      }
      return null;
    }
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LazyImage.tsx:45',message:'LazyImage - URI already absolute',data:{uri},timestamp:Date.now(),runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      return uri;
    }
    // If relative URL, make it absolute
    const baseUrl = 'https://aurora-production.up.railway.app';
    const relativeUrl = uri.startsWith('/') ? uri : `/${uri}`;
    const normalized = `${baseUrl}${relativeUrl}`;
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LazyImage.tsx:52',message:'LazyImage - Normalized relative URI',data:{originalUri:uri,normalized},timestamp:Date.now(),runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
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

