import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, GlassInput, Avatar, LoadingSpinner } from '../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../src/constants/theme';
import { userService, UserProfile } from '../src/services/user.service';
import { useAuthStore } from '../src/store/authStore';

// Simple debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function SearchUsersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user: currentUser } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(searchQuery, 500);

  const searchUsers = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setUsers([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await userService.searchUsers(query);
      if (response.success && response.data) {
        // Filter out current user
        setUsers(response.data.filter((u) => u._id !== currentUser?._id));
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  React.useEffect(() => {
    searchUsers(debouncedQuery);
  }, [debouncedQuery, searchUsers]);

  const handleUserPress = (userId: string) => {
    router.push(`/user/${userId}`);
  };

  const renderUser = ({ item }: { item: UserProfile }) => (
    <GlassCard
      style={styles.userCard}
      padding="md"
      onPress={() => handleUserPress(item._id)}
    >
      <View style={styles.userContent}>
        <Avatar
          uri={item.avatar}
          name={item.displayName || item.username}
          userId={item._id}
          avatarCharacter={item.avatarCharacter}
          avatarBackgroundColor={item.avatarBackgroundColor}
          size="md"
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {item.displayName || item.username}
          </Text>
          <Text style={styles.userUsername}>@{item.username}</Text>
          {item.bio && (
            <Text style={styles.userBio} numberOfLines={2}>
              {item.bio}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
      </View>
    </GlassCard>
  );

  return (
    <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={insets.top}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Zoek gebruikers</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <GlassInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Zoek op gebruikersnaam..."
            autoFocus
            style={styles.searchInput}
          />
        </View>

        {/* Results */}
        {searchQuery.length < 2 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>Begin met typen om te zoeken</Text>
            <Text style={styles.emptySubtext}>
              Zoek minimaal 2 karakters
            </Text>
          </View>
        ) : isLoading ? (
          <View style={styles.loadingContainer}>
            <LoadingSpinner size="lg" />
          </View>
        ) : users.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No users found</Text>
            <Text style={styles.emptySubtext}>
              Try a different search term
            </Text>
          </View>
        ) : (
          <FlatList
            data={users}
            renderItem={renderUser}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glass.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  headerSpacer: {
    width: 40,
  },
  searchContainer: {
    padding: SPACING.md,
  },
  searchInput: {
    marginBottom: 0,
  },
  listContent: {
    padding: SPACING.md,
    paddingTop: 0,
  },
  userCard: {
    marginBottom: SPACING.sm,
  },
  userContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  userName: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
  },
  userUsername: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  userBio: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  emptyText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
});

