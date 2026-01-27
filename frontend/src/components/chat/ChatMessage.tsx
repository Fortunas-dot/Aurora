import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChatMessage as ChatMessageType } from '../../types/chat.types';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants/theme';

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  isStreaming = false 
}) => {
  const isUser = message.role === 'user';

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
        </View>
      )}
    </View>
  );
};

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
});
