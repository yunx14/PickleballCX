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

import { SessionCard } from '@/components/ui/SessionCard';
import { PrimaryButton } from '@/components/ui/Screen';
import { brand } from '@/constants/brand';
import { useUpcomingEvents } from '@/hooks/useEvents';
import { courtsRoute, newSessionRoute, sessionRoute } from '@/lib/routes';
import { useAuth } from '@/providers/AuthProvider';

export default function SessionsScreen() {
  const { profile } = useAuth();
  const isAppAdmin = profile?.is_app_admin ?? false;
  const { data: events, isLoading, isRefetching, refetch, error } = useUpcomingEvents();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={brand.green700} />
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      {error ? (
        <View style={styles.container}>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Could not load sessions</Text>
            <Text style={styles.emptyBody}>{error.message}</Text>
          </View>
        </View>
      ) : !events?.length ? (
        <View style={styles.container}>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No sessions yet</Text>
            <Text style={styles.emptyBody}>
              Schedule a public open session or post to one of your groups. Browse courts to see
              where people are playing.
            </Text>
          </View>
          {isAppAdmin ? (
            <Pressable onPress={() => router.push(courtsRoute)} style={styles.secondaryLink}>
              <Text style={styles.secondaryLinkText}>Manage courts</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <SessionCard event={item} onPress={() => router.push(sessionRoute(item.id))} />
          )}
        />
      )}
      <View style={styles.footer}>
        <PrimaryButton label="Schedule session" onPress={() => router.push(newSessionRoute())} />
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
  listContainer: {
    flex: 1,
    backgroundColor: brand.sand,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
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
