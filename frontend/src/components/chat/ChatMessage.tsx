import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ChatMessage as ChatMessageType } from '../../types/chat.types';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useChatStore } from '../../store/chatStore';

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
}

const ChatMessageComponent: React.FC<ChatMessageProps> = ({ 
  message, 
  isStreaming = false 
}) => {
  const { colors } = useTheme();
  const { availableContext, messages } = useChatStore();
  const isUser = message.role === 'user';
  // Show badge only on the last assistant message if context was available
  const isLastAssistantMessage = !isUser && !isStreaming && 
    messages.length > 0 && 
    messages[messages.length - 1]?.id === message.id;
  const showContextBadge = isLastAssistantMessage && availableContext && 
    (availableContext.hasHealthInfo || availableContext.hasJournalEntries);

  return (
    <View style={[
      styles.container,
      isUser ? styles.userContainer : styles.assistantContainer
    ]}>
      {isUser ? (
        <LinearGradient
          colors={['rgba(96, 165, 250, 0.3)', 'rgba(96, 165, 250, 0.15)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.bubble, styles.userBubble]}
        >
          <Text style={[styles.messageText, styles.userText]}>
            {message.content}
          </Text>
        </LinearGradient>
      ) : (
        <View style={[styles.bubble, styles.assistantBubble]}>
          <Text style={[styles.messageText, styles.assistantText]}>
            {message.content}
            {isStreaming && <Text style={styles.cursor}>▌</Text>}
          </Text>
          {showContextBadge && (
            <View style={[styles.contextBadge, { backgroundColor: colors.glass.backgroundLight, borderColor: colors.glass.border }]}>
              <Ionicons name="analytics" size={10} color={colors.accent} />
              <Text style={[styles.contextBadgeText, { color: colors.textMuted }]}>
                Using your data
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export const ChatMessage = memo(ChatMessageComponent);

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.xs,
    maxWidth: '85%',
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  assistantContainer: {
    alignSelf: 'flex-start',
  },
  bubble: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.lg,
  },
  userBubble: {
    borderWidth: 1,
    borderColor: COLORS.userBubbleBorder,
    borderTopRightRadius: BORDER_RADIUS.xs,
  },
  assistantBubble: {
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    borderTopLeftRadius: BORDER_RADIUS.xs,
  },
  messageText: {
    ...TYPOGRAPHY.body,
    lineHeight: 22,
  },
  userText: {
    color: COLORS.text,
  },
  assistantText: {
    color: COLORS.text,
  },
  cursor: {
    color: COLORS.primary,
    opacity: 0.8,
  },
  contextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
  },
  contextBadgeText: {
    ...TYPOGRAPHY.caption,
    fontSize: 9,
    marginLeft: 4,
  },
});
