import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { GameSearchSheet } from '@/components/sessions/GameSearchSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { SessionCard } from '@/components/ui/SessionCard';
import { brand } from '@/constants/brand';
import { border, radius, spacing, typography } from '@/constants/theme';
import { useMyHostedUpcomingEvents, type EventRow } from '@/hooks/useEvents';
import { useSearchEvents } from '@/hooks/useSearchEvents';
import { useSearchLocation } from '@/hooks/useSearchLocation';
import { useSessionCardColumns } from '@/hooks/useSessionCardColumns';
import { useUserLocation } from '@/hooks/useUserLocation';
import { distanceToEventKm } from '@/lib/event-filters';
import {
  DEFAULT_EVENT_SEARCH_FORM,
  countActiveEventFilters,
  toEventSearchFilter,
  type EventSearchFormState,
} from '@/lib/event-search';
import { formatDistanceMiles } from '@/lib/geo';
import { mapTabRoute, sessionRoute } from '@/lib/routes';
import { useAuth } from '@/providers/AuthProvider';

export function SessionsFeed({ header }: { header?: ReactNode } = {}) {
  const { session, profile } = useAuth();
  const userId = session?.user.id;
  const isAppAdmin = profile?.is_app_admin ?? false;
  const { columns, cardWidth, gap } = useSessionCardColumns();

  const [applied, setApplied] = useState<EventSearchFormState>(DEFAULT_EVENT_SEARCH_FORM);
  const [sheetOpen, setSheetOpen] = useState(false);

  const searchLocation = useSearchLocation({ city: applied.city });

  const { data: locationResult, refetch: refetchLocation } = useUserLocation();
  const locationStatus = locationResult?.status ?? 'unavailable';
  const location = searchLocation.coords;

  const searchFilter = useMemo(
    () => toEventSearchFilter(applied, location, userId),
    [applied, location, userId],
  );

  const activeFilterCount = countActiveEventFilters(applied);
  const filtersActive = activeFilterCount > 0;

  const {
    data: events,
    isLoading: eventsLoading,
    isRefetching,
    refetch: refetchEvents,
    error,
  } = useSearchEvents(searchFilter);

  const hostedQuery = useMyHostedUpcomingEvents();
  const hostedEvents = hostedQuery.data?.events ?? [];
  const goingByEventId = hostedQuery.data?.goingByEventId ?? {};

  const joinable = events ?? [];

  const clearFilters = () => setApplied(DEFAULT_EVENT_SEARCH_FORM);

  const handleRefresh = () => {
    void refetchLocation();
    void refetchEvents();
    void hostedQuery.refetch();
  };

  const findGamesHeader = (
    <View style={styles.sectionHeaderRow}>
      <Text style={styles.sectionHeaderTitle}>Find games</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          filtersActive ? `Search games, ${activeFilterCount} filters active` : 'Search games'
        }
        onPress={() => setSheetOpen(true)}
        hitSlop={8}
        style={({ pressed }) => [styles.searchButton, pressed && styles.pressed]}>
        <SymbolView
          name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
          tintColor={brand.text}
          size={22}
        />
        {filtersActive ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{activeFilterCount}</Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );

  const renderSessionCard = (
    item: EventRow & { distance_km?: number | null; going_count?: number },
    goingCount = item.going_count,
  ) => {
    // The RPC computes distance server-side; fall back for rows without it.
    const distanceKm = item.distance_km ?? distanceToEventKm(location, item);
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

  const searchSheet = sheetOpen ? (
    <GameSearchSheet
      initial={applied}
      onApply={(next) => {
        setApplied(next);
        setSheetOpen(false);
      }}
      onClose={() => setSheetOpen(false)}
    />
  ) : null;

  if (eventsLoading) {
    return (
      <View style={styles.listContainer}>
        {header ? <View style={styles.headerSlot}>{header}</View> : null}
        <View style={styles.padded}>{findGamesHeader}</View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={brand.accent} />
        </View>
        {searchSheet}
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
          {findGamesHeader}
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
              {findGamesHeader}
              {!joinable.length ? (
                <View style={styles.emptyInList}>
                  <EmptyState
                    title={filtersActive ? 'No games match your search' : 'No games to join yet'}
                    body={
                      filtersActive
                        ? 'Try a wider distance, a different city, or clear your filters.'
                        : 'Open the map, tap a court pin, and schedule a session there.'
                    }
                    action={
                      filtersActive ? (
                        <Pressable onPress={clearFilters} style={styles.secondaryLink}>
                          <Text style={styles.secondaryLinkText}>Clear filters</Text>
                        </Pressable>
                      ) : isAppAdmin ? (
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

      {searchSheet}
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionHeaderTitle: {
    ...typography.titleSm,
  },
  searchButton: {
    padding: 6,
    borderWidth: border.width,
    borderColor: brand.borderStrong,
    borderRadius: radius.md,
    backgroundColor: brand.surface,
  },
  pressed: {
    opacity: 0.7,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: brand.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: brand.white,
    fontSize: 9,
    fontWeight: '800',
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
  secondaryLink: {
    alignItems: 'center',
  },
  secondaryLinkText: {
    color: brand.accent,
    fontSize: 15,
    fontWeight: '600',
  },
});
