import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SessionCard } from '@/components/ui/SessionCard';
import { PrimaryButton } from '@/components/ui/Screen';
import { brand } from '@/constants/brand';
import { useGroupEvents } from '@/hooks/useEvents';
import { newSessionRoute, sessionRoute } from '@/lib/routes';

export default function GroupSessionsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const groupId = id!;
  const { data: events, isLoading, isRefetching, refetch, error } = useGroupEvents(groupId);

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
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No upcoming sessions</Text>
            <Text style={styles.emptyBody}>
              Schedule your first pickleball session — pick a court, time, and session type so your
              group can RSVP.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <SessionCard event={item} onPress={() => router.push(sessionRoute(item.id))} />
        )}
      />
      <View style={styles.footer}>
        <PrimaryButton
          label="Schedule session"
          onPress={() => router.push(newSessionRoute(groupId))}
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
    paddingBottom: 16,
    flexGrow: 1,
  },
  footer: {
    padding: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    backgroundColor: brand.sand,
  },
  emptyCard: {
    backgroundColor: brand.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginTop: 8,
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
  error: {
    fontSize: 15,
    color: brand.danger,
    marginBottom: 16,
  },
});
