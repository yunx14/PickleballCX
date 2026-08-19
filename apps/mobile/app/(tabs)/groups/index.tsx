import { router } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PrimaryButton } from '@/components/ui/Screen';
import { brand } from '@/constants/brand';
import { spacing } from '@/constants/theme';
import { useGroups } from '@/hooks/useGroups';
import { createGroupRoute, groupRoute, joinGroupRoute } from '@/lib/routes';

export default function GroupsScreen() {
  const { data: groups, isLoading, isRefetching, refetch, error } = useGroups();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={brand.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <EmptyState
          title="Could not load groups"
          body={error.message}
          action={<PrimaryButton label="Try again" onPress={() => void refetch()} />}
        />
      </View>
    );
  }

  if (!groups?.length) {
    return (
      <View style={styles.container}>
        <EmptyState
          title="No groups yet"
          body="Create a group for your regular pickleball crew or join with an invite code. Groups keep courts, sessions, and members in one place."
        />
        <PrimaryButton label="Create a group" onPress={() => router.push(createGroupRoute)} />
        <Pressable onPress={() => router.push(joinGroupRoute)} style={styles.secondaryLink}>
          <Text style={styles.secondaryLinkText}>Have an invite code? Join a group</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <PrimaryButton label="Create group" onPress={() => router.push(createGroupRoute)} />
            <Pressable onPress={() => router.push(joinGroupRoute)} style={styles.secondaryLink}>
              <Text style={styles.secondaryLinkText}>Join with invite code</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <Card onPress={() => router.push(groupRoute(item.id))}>
            <Text style={styles.groupName}>{item.name}</Text>
            <Text style={styles.groupMeta}>
              {item.role === 'admin' ? 'Admin' : 'Member'} · Invite {item.invite_code}
            </Text>
          </Card>
        )}
      />
    </View>
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
    gap: spacing.md,
  },
  listContainer: {
    flex: 1,
    backgroundColor: brand.background,
  },
  listContent: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  headerBlock: {
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '700',
    color: brand.text,
    marginBottom: spacing.xs,
  },
  groupMeta: {
    fontSize: 14,
    color: brand.muted,
  },
  secondaryLink: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  secondaryLinkText: {
    color: brand.accent,
    fontSize: 15,
    fontWeight: '600',
  },
});
