import { router } from 'expo-router';
import { useMemo, type ReactNode } from 'react';
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
import { border, spacing, typography } from '@/constants/theme';
import {
  useMyEventRsvps,
  useMyHostedUpcomingEvents,
  useUpcomingEvents,
  type EventRow,
} from '@/hooks/useEvents';
import { useSessionCardColumns } from '@/hooks/useSessionCardColumns';
import { useUserLocation } from '@/hooks/useUserLocation';
import { distanceToEventKm, skillMatchesEvent } from '@/lib/event-filters';
import { formatDistanceMiles } from '@/lib/geo';
import { mapTabRoute, sessionRoute } from '@/lib/routes';
import { useAuth } from '@/providers/AuthProvider';

export function SessionsFeed({ header }: { header?: ReactNode } = {}) {
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
  const hostedQuery = useMyHostedUpcomingEvents();
  const hostedEvents = hostedQuery.data?.events ?? [];
  const goingByEventId = hostedQuery.data?.goingByEventId ?? {};

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
    void hostedQuery.refetch();
  };

  const renderSessionCard = (item: EventRow, goingCount?: number) => {
    const distanceKm = distanceToEventKm(location, item);
    const distanceLabel = distanceKm != null ? formatDistanceMiles(distanceKm) : undefined;

    return (
      <View style={[styles.cell, { maxWidth: cardWidth, marginBottom: gap }]}>
        <SessionCard
          event={item}
          goingCount={goingCount}
          distanceLabel={distanceLabel}
          onPress={() => router.push(sessionRoute(item.id))}
        />
      </View>
    );
  };

  if (eventsLoading) {
    return (
      <View style={styles.listContainer}>
        {header ? <View style={styles.headerSlot}>{header}</View> : null}
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={brand.accent} />
        </View>
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
          {header}
          <EmptyState title="Could not load sessions" body={error.message} />
        </View>
      ) : (
        <FlatList
          key={columns}
          data={joinable}
          keyExtractor={(item) => item.id}
          numColumns={columns}
          style={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching || hostedQuery.isRefetching}
              onRefresh={handleRefresh}
            />
          }
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={columns > 1 ? [styles.row, { gap }] : undefined}
          ListHeaderComponent={
            <View>
              {header}
              <Text style={styles.sectionTitle}>Find games</Text>
              {!joinable.length ? (
                <View style={styles.emptyInList}>
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
              ) : null}
            </View>
          }
          ListFooterComponent={
            hostedEvents.length ? (
              <View style={styles.section}>
                <View style={styles.sectionDivider} />
                <Text style={styles.sectionTitle}>Your upcoming games</Text>
                <View style={[styles.grid, { gap }]}>
                  {hostedEvents.map((item) => (
                    <View key={item.id} style={{ width: cardWidth }}>
                      <SessionCard
                        event={item}
                        goingCount={goingByEventId[item.id] ?? 0}
                        onPress={() => router.push(sessionRoute(item.id))}
                      />
                    </View>
                  ))}
                </View>
              </View>
            ) : null
          }
          renderItem={({ item }) => renderSessionCard(item)}
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
  headerSlot: {
    paddingHorizontal: spacing.xl,
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
  section: {
    width: '100%',
    paddingBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.titleSm,
    marginBottom: spacing.md,
  },
  sectionDivider: {
    height: border.width,
    backgroundColor: border.color,
    marginHorizontal: -spacing.xl,
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyInList: {
    marginBottom: spacing.md,
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
