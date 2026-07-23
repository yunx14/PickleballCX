import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { PrimaryButton } from '@/components/ui/Screen';
import { brand } from '@/constants/brand';
import { useGroupEvents } from '@/hooks/useEvents';
import { useGroupMembers } from '@/hooks/useGroupMembers';
import { useGroup, useGroups } from '@/hooks/useGroups';
import { groupMembersRoute, groupSessionsRoute, newSessionRoute } from '@/lib/routes';

export default function GroupHomeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const groupId = id!;
  const { data: group, isLoading, error } = useGroup(groupId);
  const { data: groups } = useGroups();
  const { data: members } = useGroupMembers(groupId);
  const { data: sessions } = useGroupEvents(groupId);

  const membership = groups?.find((item) => item.id === groupId);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={brand.green700} />
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
      <View style={styles.headerCard}>
        <Text style={styles.groupName}>{group.name}</Text>
        <Text style={styles.roleLabel}>{membership?.role === 'admin' ? 'You are an admin' : 'Member'}</Text>

        <View style={styles.inviteBlock}>
          <Text style={styles.inviteLabel}>Invite code</Text>
          <Text style={styles.inviteCode}>{group.invite_code}</Text>
          <Text style={styles.inviteHint}>Share this code so others can join your group.</Text>
        </View>
      </View>

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

      <Pressable
        onPress={() => router.push(groupSessionsRoute(groupId))}
        style={({ pressed }) => [styles.linkCard, pressed && styles.linkCardPressed]}>
        <Text style={styles.linkTitle}>Sessions</Text>
        <Text style={styles.linkBody}>Upcoming pickleball sessions for this group</Text>
      </Pressable>

      <Pressable
        onPress={() => router.push(groupMembersRoute(groupId))}
        style={({ pressed }) => [styles.linkCard, pressed && styles.linkCardPressed]}>
        <Text style={styles.linkTitle}>Members</Text>
        <Text style={styles.linkBody}>See who is in this group and their skill levels</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.sand,
  },
  container: {
    flex: 1,
    backgroundColor: brand.sand,
    padding: 20,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 12,
  },
  headerCard: {
    backgroundColor: brand.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginBottom: 16,
  },
  groupName: {
    fontSize: 28,
    fontWeight: '700',
    color: brand.green900,
    marginBottom: 4,
  },
  roleLabel: {
    fontSize: 14,
    color: brand.muted,
    marginBottom: 20,
  },
  inviteBlock: {
    backgroundColor: brand.green100,
    borderRadius: 12,
    padding: 16,
  },
  inviteLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: brand.green900,
    marginBottom: 4,
  },
  inviteCode: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 2,
    color: brand.green900,
    marginBottom: 8,
  },
  inviteHint: {
    fontSize: 14,
    lineHeight: 20,
    color: brand.green700,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: brand.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: brand.text,
  },
  statLabel: {
    fontSize: 13,
    color: brand.muted,
    marginTop: 4,
  },
  linkCard: {
    backgroundColor: brand.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginBottom: 12,
  },
  linkCardPressed: {
    opacity: 0.85,
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
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: brand.text,
    marginBottom: 8,
  },
  errorBody: {
    fontSize: 15,
    color: brand.muted,
    marginBottom: 20,
  },
});
