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

import { PrimaryButton } from '@/components/ui/Screen';
import { brand } from '@/constants/brand';
import { useGroups } from '@/hooks/useGroups';
import {
  createGroupRoute,
  groupRoute,
  joinGroupRoute,
} from '@/lib/routes';

export default function GroupsScreen() {
  const { data: groups, isLoading, isRefetching, refetch, error } = useGroups();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={brand.green700} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Could not load groups</Text>
          <Text style={styles.emptyBody}>{error.message}</Text>
          <PrimaryButton label="Try again" onPress={() => void refetch()} />
        </View>
      </View>
    );
  }

  if (!groups?.length) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No groups yet</Text>
          <Text style={styles.emptyBody}>
            Create a group for your regular pickleball crew or join with an invite code. Groups keep
            courts, sessions, and members in one place.
          </Text>
        </View>
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
          <View style={styles.actions}>
            <PrimaryButton label="Create group" onPress={() => router.push(createGroupRoute)} />
            <Pressable onPress={() => router.push(joinGroupRoute)} style={styles.secondaryLink}>
              <Text style={styles.secondaryLinkText}>Join with invite code</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(groupRoute(item.id))}
            style={({ pressed }) => [styles.groupCard, pressed && styles.groupCardPressed]}>
            <Text style={styles.groupName}>{item.name}</Text>
            <Text style={styles.groupMeta}>
              {item.role === 'admin' ? 'Admin' : 'Member'} · Invite {item.invite_code}
            </Text>
          </Pressable>
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
    backgroundColor: brand.sand,
  },
  container: {
    flex: 1,
    backgroundColor: brand.sand,
    padding: 20,
  },
  listContainer: {
    flex: 1,
    backgroundColor: brand.sand,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  actions: {
    marginBottom: 16,
  },
  emptyCard: {
    backgroundColor: brand.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: brand.text,
    marginBottom: 8,
  },
  emptyBody: {
    fontSize: 15,
    lineHeight: 22,
    color: brand.muted,
  },
  groupCard: {
    backgroundColor: brand.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginBottom: 12,
  },
  groupCardPressed: {
    opacity: 0.85,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '700',
    color: brand.text,
    marginBottom: 4,
  },
  groupMeta: {
    fontSize: 14,
    color: brand.muted,
  },
  secondaryLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  secondaryLinkText: {
    color: brand.green700,
    fontSize: 15,
    fontWeight: '600',
  },
});
