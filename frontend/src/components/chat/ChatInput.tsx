import React, { useState, useCallback, memo } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants/theme';

interface ChatInputProps {
  onSend: (message: string) => void;
  isDisabled?: boolean;
}

const ChatInputComponent: React.FC<ChatInputProps> = ({
  onSend,
  isDisabled = false
}) => {
  const [text, setText] = useState('');
  const insets = useSafeAreaInsets();

  const handleSend = useCallback(() => {
    if (text.trim() && !isDisabled) {
      onSend(text.trim());
      setText('');
    }
  }, [text, isDisabled, onSend]);

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, SPACING.md) }]}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type your message..."
          placeholderTextColor={COLORS.textMuted}
          multiline
          maxLength={2000}
          editable={!isDisabled}
          returnKeyType="send"
          blurOnSubmit={false}
          onSubmitEditing={handleSend}
        />

        <Pressable
          style={[
            styles.sendButton,
            (!text.trim() || isDisabled) && styles.sendButtonDisabled
          ]}
          onPress={handleSend}
          disabled={!text.trim() || isDisabled}
        >
          {isDisabled ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Ionicons
              name="send"
              size={20}
              color={COLORS.white}
            />
          )}
        </Pressable>
      </View>
    </View>
  );
};

export const ChatInput = memo(ChatInputComponent);

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.glass.border,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm + 4,
    zIndex: 6, // Above everything including Aurora
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.glass.backgroundDark,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    paddingTop: Platform.OS === 'ios' ? SPACING.sm + 2 : SPACING.sm,
    color: COLORS.text,
    ...TYPOGRAPHY.body,
    maxHeight: 100,
    minHeight: 44,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.primaryDark,
    opacity: 0.6,
  },
});
