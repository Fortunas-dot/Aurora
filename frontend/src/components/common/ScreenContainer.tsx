import React from 'react';
import { View, StyleSheet, ViewStyle, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../../constants/theme';

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: boolean;
  gradient?: boolean;
  safeArea?: boolean;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  style,
  padding = true,
  gradient = true,
  safeArea = true,
}) => {
  const insets = useSafeAreaInsets();

  const containerStyle: ViewStyle = {
    flex: 1,
    paddingTop: safeArea ? insets.top : 0,
    paddingBottom: safeArea ? insets.bottom : 0,
    paddingHorizontal: padding ? SPACING.md : 0,
  };

  if (gradient) {
    return (
      <>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={COLORS.backgroundGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradient}
        >
          <View style={[containerStyle, style]}>
            {children}
          </View>
        </LinearGradient>
      </>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" />
      <View style={[styles.container, containerStyle, style]}>
        {children}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  gradient: {
    flex: 1,
  },
});

