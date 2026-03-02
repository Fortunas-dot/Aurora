import React, { useMemo } from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, BORDER_RADIUS } from '../../constants/theme';
import { getCharacterForUser } from '../../utils/characters';
import { getColorByValue, getDefaultGradientColors } from '../../utils/avatarColors';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  userId?: string;
  avatarCharacter?: string | null;
  avatarBackgroundColor?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: ViewStyle;
  showBorder?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name,
  userId,
  avatarCharacter,
  avatarBackgroundColor,
  size = 'md',
  style,
  showBorder = true,
}) => {
  const getSize = (): number => {
    switch (size) {
      case 'sm': return 32;
      case 'lg': return 56;
      case 'xl': return 80;
      default: return 44;
    }
  };

  const getFontSize = (): number => {
    switch (size) {
      case 'sm': return 12;
      case 'lg': return 22;
      case 'xl': return 32;
      default: return 16;
    }
  };

  const sizeValue = getSize();
  const fontSize = getFontSize();

  // Normalize avatar URL to ensure it's always absolute
  // Keep local file URIs (file://) as-is for immediate preview
  const normalizedUri = useMemo(() => {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Avatar.tsx:51',message:'Avatar - Input URI',data:{uri,uriLength:uri?.length,isAbsolute:uri?.startsWith('http'),isFile:uri?.startsWith('file://')},timestamp:Date.now(),runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    if (!uri) return null;
    // Keep local file URIs as-is (for image picker previews)
    if (uri.startsWith('file://')) {
      return uri;
    }
    // Keep absolute HTTP/HTTPS URLs as-is
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Avatar.tsx:58',message:'Avatar - URI already absolute',data:{uri},timestamp:Date.now(),runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      return uri;
    }
    // If relative URL, make it absolute
    const baseUrl = 'https://aurora-production.up.railway.app';
    const relativeUrl = uri.startsWith('/') ? uri : `/${uri}`;
    const normalized = `${baseUrl}${relativeUrl}`;
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Avatar.tsx:65',message:'Avatar - Normalized relative URI',data:{originalUri:uri,normalized},timestamp:Date.now(),runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    return normalized;
  }, [uri]);

  // Get character to display (prefer avatarCharacter, fallback to user-based character, then initials)
  const getDisplayCharacter = (): string => {
    if (avatarCharacter) {
      return avatarCharacter;
    }
    if (userId) {
      return getCharacterForUser(userId);
    }
    // Fallback to initials if no userId or character
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Get gradient colors - use custom background color if provided, otherwise use default
  const getGradientColors = (): string[] => {
    if (avatarBackgroundColor) {
      const colorInfo = getColorByValue(avatarBackgroundColor);
      if (colorInfo) {
        return colorInfo.gradient;
      }
      // If color value exists but not in our palette, create a gradient from it
      return [avatarBackgroundColor, avatarBackgroundColor];
    }
    // Fallback to default gradient based on name
    return getDefaultGradientColors(name);
  };

  return (
    <View
      style={[
        styles.container,
        {
          width: sizeValue,
          height: sizeValue,
          borderRadius: sizeValue / 2,
        },
        showBorder && styles.border,
        style,
      ]}
    >
      {normalizedUri ? (
        <Image
          source={{ uri: normalizedUri }}
          style={[
            styles.image,
            {
              width: sizeValue - (showBorder ? 4 : 0),
              height: sizeValue - (showBorder ? 4 : 0),
              borderRadius: (sizeValue - (showBorder ? 4 : 0)) / 2,
            },
          ]}
          onError={(e) => {
            // #region agent log
            const errMsg = e?.nativeEvent?.error || 'Unknown';
            if (normalizedUri) {
              fetch(normalizedUri, { method: 'HEAD' })
                .then(resp => {
                  fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Avatar.tsx:onError',message:'Avatar image FAILED - HTTP probe',data:{normalizedUri,httpStatus:resp.status,httpStatusText:resp.statusText,contentType:resp.headers.get('content-type'),errorMessage:errMsg},timestamp:Date.now(),runId:'run2',hypothesisId:'H1'})}).catch(()=>{});
                })
                .catch(fetchErr => {
                  fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Avatar.tsx:onError',message:'Avatar image FAILED - HTTP probe ALSO failed',data:{normalizedUri,fetchError:String(fetchErr),errorMessage:errMsg},timestamp:Date.now(),runId:'run2',hypothesisId:'H1'})}).catch(()=>{});
                });
            }
            // #endregion
          }}
        />
      ) : (
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.placeholder,
            {
              width: sizeValue - (showBorder ? 4 : 0),
              height: sizeValue - (showBorder ? 4 : 0),
              borderRadius: (sizeValue - (showBorder ? 4 : 0)) / 2,
            },
          ]}
        >
          <Text style={[styles.character, { fontSize: sizeValue * 0.5 }]}>
            {getDisplayCharacter()}
          </Text>
        </LinearGradient>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  border: {
    borderWidth: 2,
    borderColor: COLORS.glass.border,
  },
  image: {
    resizeMode: 'cover',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  character: {
    color: COLORS.white,
    fontWeight: '600',
    textAlign: 'center',
  },
});

