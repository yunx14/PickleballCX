import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { SessionCard } from '@/components/ui/SessionCard';
import { PrimaryButton } from '@/components/ui/Screen';
import { brand } from '@/constants/brand';
import { spacing } from '@/constants/theme';
import { useGroupEvents } from '@/hooks/useEvents';
import { mapTabRoute, sessionRoute } from '@/lib/routes';

export default function GroupSessionsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const groupId = id!;
  const { data: events, isLoading, isRefetching, refetch, error } = useGroupEvents(groupId);

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
        <Text style={styles.error}>{error.message}</Text>
        <PrimaryButton label="Try again" onPress={() => void refetch()} />
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            title="No upcoming sessions"
            body="Schedule your first pickleball session — pick a court, time, and session type so your group can RSVP."
          />
        }
        renderItem={({ item }) => (
          <SessionCard event={item} onPress={() => router.push(sessionRoute(item.id))} />
        )}
      />
      <View style={styles.footer}>
        <PrimaryButton
          label="Schedule session"
          onPress={() => router.push(mapTabRoute)}
        />
      </View>
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
  },
  listContainer: {
    flex: 1,
    backgroundColor: brand.background,
  },
  listContent: {
    padding: spacing.xl,
    paddingBottom: spacing.lg,
    flexGrow: 1,
  },
  footer: {
    padding: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: brand.border,
    backgroundColor: brand.surfaceElevated,
  },
  error: {
    fontSize: 15,
    color: brand.danger,
    marginBottom: spacing.lg,
  },
});
