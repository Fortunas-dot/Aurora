import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { GlassCard, Avatar, GlassInput } from '../../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';

interface Conversation {
  _id: string;
  user: {
    _id: string;
    username: string;
    displayName?: string;
    avatar?: string;
  };
  lastMessage: {
    content: string;
    createdAt: string;
    isOwn: boolean;
  };
  unreadCount: number;
}

// Mock data
const MOCK_CONVERSATIONS: Conversation[] = [
  {
    _id: '1',
    user: {
      _id: 'u1',
      username: 'sarah_wellness',
      displayName: 'Sarah',
    },
    lastMessage: {
      content: 'Dankjewel voor je steun! Het betekent veel voor me.',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      isOwn: false,
    },
    unreadCount: 2,
  },
  {
    _id: '2',
    user: {
      _id: 'u2',
      username: 'peaceful_mike',
      displayName: 'Mike',
    },
    lastMessage: {
      content: 'Natuurlijk! Laat maar weten als ik kan helpen.',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      isOwn: true,
    },
    unreadCount: 0,
  },
  {
    _id: '3',
    user: {
      _id: 'u3',
      username: 'emma_growth',
      displayName: 'Emma',
    },
    lastMessage: {
      content: 'Hoe gaat het met je meditatie oefeningen?',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      isOwn: false,
    },
    unreadCount: 0,
  },
];

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuthStore();
  
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredConversations = conversations.filter((conv) =>
    conv.user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const formattedDate = formatDistanceToNow(new Date(item.lastMessage.createdAt), {
      addSuffix: false,
      locale: nl,
    });

    return (
      <GlassCard
        style={styles.conversationCard}
        padding={0}
        onPress={() => {}}
      >
        <View style={styles.conversationContent}>
          <Avatar
            uri={item.user.avatar}
            name={item.user.displayName || item.user.username}
            size="lg"
          />
          
          <View style={styles.conversationInfo}>
            <View style={styles.conversationHeader}>
              <Text style={styles.userName} numberOfLines={1}>
                {item.user.displayName || item.user.username}
              </Text>
              <Text style={styles.timestamp}>{formattedDate}</Text>
            </View>
            
            <View style={styles.messageRow}>
              <Text
                style={[
                  styles.lastMessage,
                  item.unreadCount > 0 && styles.lastMessageUnread,
                ]}
                numberOfLines={1}
              >
                {item.lastMessage.isOwn && 'Jij: '}
                {item.lastMessage.content}
              </Text>
              
              {item.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadCount}>{item.unreadCount}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </GlassCard>
    );
  };

  if (!isAuthenticated) {
    return (
      <LinearGradient
        colors={COLORS.backgroundGradient}
        style={styles.container}
      >
        <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
          <Text style={styles.headerTitle}>Berichten</Text>
        </View>
        
        <View style={styles.authPrompt}>
          <Ionicons name="chatbubbles-outline" size={64} color={COLORS.textMuted} />
          <Text style={styles.authPromptTitle}>Log in om te chatten</Text>
          <Text style={styles.authPromptText}>
            Maak verbinding met andere community leden
          </Text>
          <Pressable
            style={styles.authButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.authButtonText}>Inloggen</Text>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      style={styles.container}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <Text style={styles.headerTitle}>Berichten</Text>
        <Pressable style={styles.headerButton}>
          <Ionicons name="create-outline" size={24} color={COLORS.text} />
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <GlassInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Zoek gesprekken..."
          icon="search"
          style={styles.searchInput}
        />
      </View>

      {/* Conversations */}
      <FlatList
        data={filteredConversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>Geen gesprekken</Text>
            <Text style={styles.emptySubtext}>
              Start een gesprek met iemand uit de community
            </Text>
          </View>
        }
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  searchInput: {
    marginBottom: 0,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  conversationCard: {
    marginBottom: SPACING.sm,
  },
  conversationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  conversationInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  userName: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    flex: 1,
  },
  timestamp: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginLeft: SPACING.sm,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastMessage: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    flex: 1,
  },
  lastMessageUnread: {
    color: COLORS.text,
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: SPACING.sm,
  },
  unreadCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: SPACING.xxl,
    alignItems: 'center',
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
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  authPromptTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginTop: SPACING.lg,
  },
  authPromptText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  authButton: {
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.4)',
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.lg,
  },
  authButtonText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.primary,
  },
});

