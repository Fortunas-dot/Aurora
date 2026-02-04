import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../src/constants/theme';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) {
      return; // Still loading, wait
    }

    // Check if we're already in a route
    if (segments.length > 0) {
      return; // Already navigated
    }

    // Navigate based on auth status
    if (isAuthenticated) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading, segments, router]);

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <LinearGradient
        colors={COLORS.backgroundGradient}
        style={styles.container}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
      </LinearGradient>
    );
  }

  // Return empty view while navigating
  return (
    <View style={styles.container} />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
