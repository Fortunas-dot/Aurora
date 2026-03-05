import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { GlassCard, Avatar } from '../common';
import { useRequirePremium } from '../../hooks/usePremium';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants/theme';
import { Notification, NotificationType } from '../../services/notification.service';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';

interface NotificationCardProps {
  notification: Notification;
  onPress?: () => void;
  onMarkAsRead?: (id: string) => void;
}

const getNotificationIcon = (type: NotificationType): keyof typeof Ionicons.glyphMap => {
  switch (type) {
    case 'like':
      return 'heart';
    case 'comment':
      return 'chatbubble';
    case 'message':
      return 'mail';
    case 'follow':
      return 'person-add';
    case 'group_invite':
      return 'people';
    case 'group_join':
      return 'person-add';
    case 'journal_entry':
      return 'book';
    case 'journal_streak':
      return 'flame';
    default:
      return 'notifications';
  }
};

const getNotificationColor = (type: NotificationType): string => {
  switch (type) {
    case 'like':
      return COLORS.error;
    case 'comment':
      return COLORS.primary;
    case 'message':
      return COLORS.secondary;
    case 'follow':
      return COLORS.accent;
    case 'group_invite':
    case 'group_join':
      return COLORS.info;
    case 'journal_entry':
      return COLORS.secondary;
    case 'journal_streak':
      return COLORS.accent;
    default:
      return COLORS.textMuted;
  }
};

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onPress,
  onMarkAsRead,
}) => {
  const router = useRouter();
  const { requirePremium } = useRequirePremium();
  const isUnread = !notification.read;
  const icon = getNotificationIcon(notification.type);
  const iconColor = getNotificationColor(notification.type);

  // Get sender name - handle both populated object and potential missing data
  const senderName =
    notification.relatedUser?.displayName || 
    notification.relatedUser?.username;

  const prependNameTypes: NotificationType[] = ['like', 'comment', 'message', 'follow', 'group_join', 'group_invite', 'journal_entry'];

  // Always show name for these notification types if relatedUser exists
  // If relatedUser exists but name is missing, show "Someone"
  const displayMessage =
    prependNameTypes.includes(notification.type)
      ? notification.relatedUser
        ? senderName
          ? `${senderName} ${notification.message}`
          : `Someone ${notification.message}`
        : notification.message // Fallback if relatedUser is missing
      : notification.message;

  const handlePress = () => {
    if (onMarkAsRead && isUnread) {
      onMarkAsRead(notification._id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'like':
      case 'comment':
        if (notification.relatedPost) {
          if (requirePremium()) {
            router.push(`/post/${notification.relatedPost._id}`);
          }
        }
        break;
      case 'follow':
        if (notification.relatedUser) {
          router.push(`/user/${notification.relatedUser._id}`);
        }
        break;
      case 'message':
        if (notification.relatedUser) {
          if (requirePremium()) {
            router.push(`/conversation/${notification.relatedUser._id}`);
          }
        }
        break;
      case 'group_invite':
      case 'group_join':
        if (notification.relatedGroup) {
          if (requirePremium()) {
            router.push(`/group/${notification.relatedGroup._id}`);
          }
        }
        break;
      case 'journal_entry':
        if (notification.relatedEntry) {
          router.push(`/journal/${notification.relatedEntry._id}`);
        } else if (notification.relatedJournal) {
          router.push(`/journal/view/${notification.relatedJournal._id}`);
        }
        break;
      case 'journal_streak':
        // Take user to journal insights to see their progress
        router.push('/journal/insights');
        break;
      default:
        // Default navigation
        if (notification.relatedPost) {
          if (requirePremium()) {
            router.push(`/post/${notification.relatedPost._id}`);
          }
        } else if (notification.relatedUser) {
          router.push(`/user/${notification.relatedUser._id}`);
        }
    }

    onPress?.();
  };

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: enUS,
  });

  return (
    <Pressable onPress={handlePress}>
      <GlassCard
        style={[styles.card, isUnread && styles.unreadCard]}
        padding="md"
      >
        <View style={styles.content}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {notification.relatedUser ? (
              <Avatar
                uri={notification.relatedUser.avatar}
                name={notification.relatedUser.displayName || notification.relatedUser.username}
                userId={notification.relatedUser._id}
                avatarCharacter={notification.relatedUser.avatarCharacter}
                avatarBackgroundColor={notification.relatedUser.avatarBackgroundColor}
                size="md"
              />
            ) : (
              <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
                <Ionicons name={icon} size={20} color={iconColor} />
              </View>
            )}
            {isUnread && <View style={styles.unreadDot} />}
          </View>

          {/* Content */}
          <View style={styles.textContainer}>
            <Text style={[styles.message, isUnread && styles.unreadMessage]}>
              {displayMessage}
            </Text>
            <Text style={styles.time}>{timeAgo}</Text>
          </View>

          {/* Action Icon */}
          <Ionicons
            name="chevron-forward"
            size={20}
            color={COLORS.textMuted}
            style={styles.chevron}
          />
        </View>
      </GlassCard>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.sm,
  },
  unreadCard: {
    borderColor: COLORS.primary + '40',
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  textContainer: {
    flex: 1,
  },
  message: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  unreadMessage: {
    color: COLORS.text,
    fontWeight: '600',
  },
  time: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  chevron: {
    marginLeft: SPACING.sm,
  },
});

export default NotificationCard;

