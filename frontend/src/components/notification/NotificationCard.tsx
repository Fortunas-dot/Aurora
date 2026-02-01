import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { GlassCard, Avatar } from '../common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants/theme';
import { Notification, NotificationType } from '../../services/notification.service';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

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
  const isUnread = !notification.read;
  const icon = getNotificationIcon(notification.type);
  const iconColor = getNotificationColor(notification.type);

  const handlePress = () => {
    if (onMarkAsRead && isUnread) {
      onMarkAsRead(notification._id);
    }

    // Navigate based on notification type
    if (notification.relatedPost) {
      router.push(`/post/${notification.relatedPost._id}`);
    } else if (notification.relatedGroup) {
      router.push(`/group/${notification.relatedGroup._id}`);
    } else if (notification.relatedUser) {
      router.push(`/conversation/${notification.relatedUser._id}`);
    }

    onPress?.();
  };

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: nl,
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
              {notification.message}
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

