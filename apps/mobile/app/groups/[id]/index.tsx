import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Card } from '@/components/ui/Card';
import { PrimaryButton } from '@/components/ui/Screen';
import { brand } from '@/constants/brand';
import { spacing } from '@/constants/theme';
import { useGroupEvents } from '@/hooks/useEvents';
import { useGroupAnnouncements } from '@/hooks/useGroupAnnouncements';
import { useGroupMembers } from '@/hooks/useGroupMembers';
import { useGroup, useGroups } from '@/hooks/useGroups';
import { formatRelativeTime } from '@/lib/format';
import {
  groupAnnouncementsRoute,
  groupMembersRoute,
  groupSessionsRoute,
  newSessionRoute,
} from '@/lib/routes';

export default function GroupHomeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const groupId = id!;
  const { data: group, isLoading, error } = useGroup(groupId);
  const { data: groups } = useGroups();
  const { data: members } = useGroupMembers(groupId);
  const { data: sessions } = useGroupEvents(groupId);
  const { data: announcements } = useGroupAnnouncements(groupId);

  const membership = groups?.find((item) => item.id === groupId);
  const isAdmin = membership?.role === 'admin';
  const pinnedAnnouncements = (announcements ?? []).filter((item) => item.pinned).slice(0, 2);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={brand.accent} />
      </View>
    );
  }

  if (error || !group) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorTitle}>Group not found</Text>
        <Text style={styles.errorBody}>{error?.message ?? 'This group may have been removed.'}</Text>
        <PrimaryButton label="Back to groups" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Card accent>
        <Text style={styles.groupName}>{group.name}</Text>
        <Text style={styles.roleLabel}>
          {membership?.role === 'admin' ? 'You are an admin' : 'Member'}
        </Text>
        <View style={styles.inviteBlock}>
          <Text style={styles.inviteLabel}>Invite code</Text>
          <Text style={styles.inviteCode}>{group.invite_code}</Text>
          <Text style={styles.inviteHint}>Share this code so others can join your group.</Text>
        </View>
      </Card>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{members?.length ?? 0}</Text>
          <Text style={styles.statLabel}>Members</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{sessions?.length ?? 0}</Text>
          <Text style={styles.statLabel}>Sessions</Text>
        </View>
      </View>

      <PrimaryButton
        label="Schedule session"
        onPress={() => router.push(newSessionRoute(groupId))}
      />

      {pinnedAnnouncements.length > 0 ? (
        <View style={styles.announcementsBlock}>
          <Text style={styles.announcementsHeading}>Announcements</Text>
          {pinnedAnnouncements.map((item) => (
            <Card key={item.id}>
              <Text style={styles.announcementTitle}>{item.title}</Text>
              <Text style={styles.announcementMeta}>
                {item.author_name} · {formatRelativeTime(item.created_at)}
              </Text>
              <Text style={styles.announcementBody} numberOfLines={3}>
                {item.body}
              </Text>
            </Card>
          ))}
        </View>
      ) : null}

      <Card onPress={() => router.push(groupAnnouncementsRoute(groupId))}>
        <Text style={styles.linkTitle}>Announcements</Text>
        <Text style={styles.linkBody}>
          {isAdmin
            ? 'Post updates and pin important messages for your group'
            : 'Group news and schedule updates from admins'}
        </Text>
        <Text style={styles.linkArrow}>View →</Text>
      </Card>

      <Card onPress={() => router.push(groupSessionsRoute(groupId))}>
        <Text style={styles.linkTitle}>Sessions</Text>
        <Text style={styles.linkBody}>Upcoming pickleball sessions for this group</Text>
        <Text style={styles.linkArrow}>View →</Text>
      </Card>

      <Card onPress={() => router.push(groupMembersRoute(groupId))}>
        <Text style={styles.linkTitle}>Members</Text>
        <Text style={styles.linkBody}>See who is in this group and their skill levels</Text>
        <Text style={styles.linkArrow}>View →</Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.background,
  },
  container: {
    flex: 1,
    backgroundColor: brand.background,
    padding: spacing.xl,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  groupName: {
    fontSize: 28,
    fontWeight: '800',
    color: brand.text,
    marginBottom: 4,
  },
  roleLabel: {
    fontSize: 14,
    color: brand.muted,
    marginBottom: spacing.lg,
  },
  inviteBlock: {
    backgroundColor: brand.accentSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: brand.accent,
    padding: spacing.lg,
  },
  inviteLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: brand.accent,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  inviteCode: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 2,
    color: brand.accent,
    marginBottom: spacing.sm,
  },
  inviteHint: {
    fontSize: 14,
    lineHeight: 20,
    color: brand.muted,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: brand.surface,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: brand.border,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: brand.accent,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: brand.muted,
    marginTop: 4,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  announcementsBlock: {
    gap: spacing.sm,
  },
  announcementsHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: brand.text,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: brand.text,
    marginBottom: 4,
  },
  announcementMeta: {
    fontSize: 12,
    color: brand.muted,
    marginBottom: 4,
  },
  announcementBody: {
    fontSize: 14,
    lineHeight: 20,
    color: brand.text,
  },
  linkTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: brand.text,
    marginBottom: 4,
  },
  linkBody: {
    fontSize: 14,
    lineHeight: 20,
    color: brand.muted,
  },
  linkArrow: {
    marginTop: spacing.md,
    fontSize: 14,
    fontWeight: '700',
    color: brand.accent,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: brand.text,
    marginBottom: spacing.sm,
  },
  errorBody: {
    fontSize: 15,
    color: brand.muted,
    marginBottom: spacing.xl,
  },
});
