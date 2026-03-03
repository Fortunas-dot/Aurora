import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, GlassButton, Avatar, LoadingSpinner } from '../../../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../../src/constants/theme';
import { groupService, Group } from '../../../src/services/group.service';
import { useAuthStore } from '../../../src/store/authStore';

export default function GroupMembersScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user: currentUser, isAuthenticated } = useAuthStore();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const response = await groupService.getGroup(id);
        if (response.success && response.data) {
          setGroup(response.data);
          setMembers(response.data.members || []);
        }
      } catch (error) {
        console.error('Error loading group members:', error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  const handleRemoveMember = async (member: any) => {
    if (!group || !member?._id) return;
    if (!isAuthenticated || !group.isAdmin) return;

    try {
      setRemovingMemberId(member._id);
      const response = await groupService.removeMember(group._id, member._id);
      if (response.success) {
        setMembers((prev) => prev.filter((m) => m._id !== member._id));
        setGroup({
          ...group,
          memberCount: response.data?.memberCount ?? Math.max(0, (group.memberCount || 0) - 1),
          members: (group.members || []).filter((m: any) => (m._id || m).toString() !== member._id),
        });
      }
    } catch (error) {
      console.error('Error removing member:', error);
    } finally {
      setRemovingMemberId(null);
    }
  };

  if (isLoading) {
    return (
      <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="lg" />
        </View>
      </LinearGradient>
    );
  }

  if (!group) {
    return (
      <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
          <Text style={styles.errorText}>Group not found</Text>
          <GlassButton title="Back" onPress={() => router.back()} variant="primary" />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Members</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={members}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <Text style={styles.membersSummary}>
            {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
          </Text>
        }
        renderItem={({ item: member }) => {
          const isCurrentUser = currentUser?._id === member._id;
          const isAdminOfGroup = (group.admins || []).some((a: any) => {
            const adminId = (a._id || a).toString();
            return adminId === member._id;
          });
          const canRemove =
            group.isAdmin &&
            isAuthenticated &&
            !isCurrentUser &&
            !isAdminOfGroup;

          return (
            <GlassCard style={styles.memberCard} padding="md">
              <View style={styles.memberRow}>
                <View style={styles.memberInfo}>
                  <Avatar
                    uri={member.avatar}
                    name={member.displayName || member.username}
                    userId={member._id}
                    avatarCharacter={member.avatarCharacter}
                    avatarBackgroundColor={member.avatarBackgroundColor}
                    size="md"
                  />
                  <View style={styles.memberTextContainer}>
                    <Text style={styles.memberName}>
                      {member.displayName || member.username}
                    </Text>
                    <View style={styles.memberMetaRow}>
                      {isCurrentUser && (
                        <Text style={styles.memberMetaText}>You</Text>
                      )}
                      {isAdminOfGroup && (
                        <Text style={styles.memberMetaText}>
                          {isCurrentUser ? ' • Admin' : 'Admin'}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
                {canRemove && (
                  <Pressable
                    style={styles.removeMemberButton}
                    onPress={() => handleRemoveMember(member)}
                    disabled={removingMemberId === member._id}
                  >
                    {removingMemberId === member._id ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Ionicons name="person-remove" size={20} color={COLORS.error} />
                    )}
                  </Pressable>
                )}
              </View>
            </GlassCard>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={40} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No members yet</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.error,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  membersSummary: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  memberCard: {
    marginBottom: SPACING.sm,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberTextContainer: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  memberName: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
  },
  memberMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  memberMetaText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontSize: 11,
  },
  removeMemberButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  emptyContainer: {
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },
});

