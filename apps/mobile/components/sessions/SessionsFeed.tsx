import { router } from 'expo-router';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { PrimaryButton } from '@/components/ui/Screen';
import { SessionCard } from '@/components/ui/SessionCard';
import { brand } from '@/constants/brand';
import { spacing } from '@/constants/theme';
import { useMyEventRsvps, useUpcomingEvents } from '@/hooks/useEvents';
import { useSessionCardColumns } from '@/hooks/useSessionCardColumns';
import { useUserLocation } from '@/hooks/useUserLocation';
import { distanceToEventKm, skillMatchesEvent } from '@/lib/event-filters';
import { formatDistanceMiles } from '@/lib/geo';
import { mapTabRoute, sessionRoute } from '@/lib/routes';
import { useAuth } from '@/providers/AuthProvider';

export function SessionsFeed() {
  const { session, profile } = useAuth();
  const userId = session?.user.id;
  const isAppAdmin = profile?.is_app_admin ?? false;
  const { columns, cardWidth, gap } = useSessionCardColumns();

  const { data: locationResult, refetch: refetchLocation } = useUserLocation();
  const location = locationResult?.coords ?? null;
  const locationStatus = locationResult?.status ?? 'unavailable';

  const {
    data: events,
    isLoading: eventsLoading,
    isRefetching,
    refetch: refetchEvents,
    error,
  } = useUpcomingEvents();

  const { data: myRsvps, refetch: refetchRsvps } = useMyEventRsvps();

  const joinable = useMemo(() => {
    const rsvpIds = new Set((myRsvps ?? []).map((row) => row.event_id));

    return (events ?? []).filter((event) => {
      if (userId && event.created_by === userId) return false;
      if (rsvpIds.has(event.id)) return false;
      return skillMatchesEvent(profile?.skill_level, event.skill_min, event.skill_max);
    });
  }, [events, myRsvps, profile?.skill_level, userId]);

  const handleRefresh = () => {
    void refetchLocation();
    void refetchEvents();
    void refetchRsvps();
  };

  if (eventsLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={brand.accent} />
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      {locationStatus === 'denied' ? (
        <Pressable onPress={() => void refetchLocation()} style={styles.locationPrompt}>
          <Text style={styles.secondaryLinkText}>Enable location to see distance</Text>
        </Pressable>
      ) : null}

      {error ? (
        <View style={styles.padded}>
          <EmptyState title="Could not load sessions" body={error.message} />
        </View>
      ) : !joinable.length ? (
        <View style={styles.padded}>
          <EmptyState
            title="No games to join yet"
            body="Open the map, tap a court pin, and schedule a session there."
            action={
              isAppAdmin ? (
                <Pressable onPress={() => router.push(mapTabRoute)} style={styles.secondaryLink}>
                  <Text style={styles.secondaryLinkText}>Manage courts</Text>
                </Pressable>
              ) : undefined
            }
          />
        </View>
      ) : (
        <FlatList
          key={columns}
          data={joinable}
          keyExtractor={(item) => item.id}
          numColumns={columns}
          style={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />
          }
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={columns > 1 ? [styles.row, { gap }] : undefined}
          renderItem={({ item }) => {
            const distanceKm = distanceToEventKm(location, item);
            const distanceLabel =
              distanceKm != null ? formatDistanceMiles(distanceKm) : undefined;

            return (
              <View style={[styles.cell, { maxWidth: cardWidth, marginBottom: gap }]}>
                <SessionCard
                  event={item}
                  distanceLabel={distanceLabel}
                  onPress={() => router.push(sessionRoute(item.id))}
                />
              </View>
            );
          }}
        />
      )}
      <View style={styles.footer}>
        <PrimaryButton label="Find a court" onPress={() => router.push(mapTabRoute)} />
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
  listContainer: {
    flex: 1,
    backgroundColor: brand.background,
  },
  locationPrompt: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  padded: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  list: {
    flex: 1,
    width: '100%',
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  row: {
    flex: 1,
  },
  cell: {
    flex: 1,
  },
  footer: {
    padding: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: brand.border,
    backgroundColor: brand.surfaceElevated,
  },
  secondaryLink: {
    alignItems: 'center',
  },
  secondaryLinkText: {
    color: brand.accent,
    fontSize: 15,
    fontWeight: '600',
  },
});
