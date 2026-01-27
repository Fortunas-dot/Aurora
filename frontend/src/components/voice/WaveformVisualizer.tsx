import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { COLORS } from '../../constants/theme';

interface WaveformVisualizerProps {
  audioLevel: number;
  isActive: boolean;
}

const NUM_BARS = 5;
const BAR_WIDTH = 4;
const BAR_SPACING = 8;
const MAX_BAR_HEIGHT = 60;
const MIN_BAR_HEIGHT = 10;

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  audioLevel,
  isActive,
}) => {
  const bars = Array.from({ length: NUM_BARS }, (_, i) => i);

  return (
    <View style={styles.container}>
      {bars.map((index) => (
        <WaveformBar
          key={index}
          index={index}
          audioLevel={audioLevel}
          isActive={isActive}
        />
      ))}
    </View>
  );
};

interface WaveformBarProps {
  index: number;
  audioLevel: number;
  isActive: boolean;
}

const WaveformBar: React.FC<WaveformBarProps> = ({ index, audioLevel, isActive }) => {
  const height = useRef(new Animated.Value(MIN_BAR_HEIGHT)).current;

  useEffect(() => {
    if (isActive) {
      // Calculate target height based on audio level and bar position
      // Middle bars are taller, creating a wave effect
      const positionFactor = 1 - Math.abs(index - (NUM_BARS - 1) / 2) / ((NUM_BARS - 1) / 2);
      const targetHeight = MIN_BAR_HEIGHT + (MAX_BAR_HEIGHT - MIN_BAR_HEIGHT) * audioLevel * positionFactor;

      Animated.timing(height, {
        toValue: targetHeight,
        duration: 100,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start();
    } else {
      // Idle animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(height, {
            toValue: MIN_BAR_HEIGHT + (MAX_BAR_HEIGHT - MIN_BAR_HEIGHT) * 0.3,
            duration: 800 + index * 100,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(height, {
            toValue: MIN_BAR_HEIGHT,
            duration: 800 + index * 100,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      ).start();
    }
  }, [isActive, audioLevel, index]);

  return <Animated.View style={[styles.bar, { height }]} />;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: BAR_SPACING,
    height: MAX_BAR_HEIGHT + 20,
  },
  bar: {
    width: BAR_WIDTH,
    backgroundColor: COLORS.primary,
    borderRadius: BAR_WIDTH / 2,
  },
});
