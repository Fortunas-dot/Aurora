import { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../src/constants/theme';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait a bit to ensure router is ready
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isReady || isLoading) {
      return; // Router not ready yet or still loading
    }

    // Check if we're already in a route
    const currentPath = segments.join('/');
    if (currentPath && currentPath !== 'index') {
      // Already navigated to a specific route, don't interfere
      // But if authenticated and on login, redirect to tabs
      if (isAuthenticated && (currentPath === '(auth)/login' || currentPath === '(auth)/register')) {
        router.replace('/(tabs)');
      }
      return;
    }

    // Navigate based on auth status
    if (isAuthenticated) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading, segments, router, isReady]);

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
