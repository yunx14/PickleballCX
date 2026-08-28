import { router } from 'expo-router';
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

import { GameSearchBar } from '@/components/sessions/GameSearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { SessionCard } from '@/components/ui/SessionCard';
import { brand } from '@/constants/brand';
import { border, spacing, typography } from '@/constants/theme';
import { useMyHostedUpcomingEvents, type EventRow } from '@/hooks/useEvents';
import { useSearchEvents } from '@/hooks/useSearchEvents';
import { useSearchLocation } from '@/hooks/useSearchLocation';
import { useSessionCardColumns } from '@/hooks/useSessionCardColumns';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useUserLocation } from '@/hooks/useUserLocation';
import { distanceToEventKm } from '@/lib/event-filters';
import {
  RADIUS_FILTER_ANY,
  SESSION_TYPE_FILTER_ANY,
  SKILL_FILTER_ANY,
  hasActiveEventFilters,
  type RadiusFilter,
  type SessionTypeFilter,
  type SkillFilter,
} from '@/lib/event-search';
import { formatDistanceMiles } from '@/lib/geo';
import { mapTabRoute, sessionRoute } from '@/lib/routes';
import { useAuth } from '@/providers/AuthProvider';

export function SessionsFeed({ header }: { header?: ReactNode } = {}) {
  const { session, profile } = useAuth();
  const userId = session?.user.id;
  const isAppAdmin = profile?.is_app_admin ?? false;
  const { columns, cardWidth, gap } = useSessionCardColumns();

  const [search, setSearch] = useState('');
  const [skill, setSkill] = useState<SkillFilter>(SKILL_FILTER_ANY);
  const [sessionType, setSessionType] = useState<SessionTypeFilter>(SESSION_TYPE_FILTER_ANY);
  const [radius, setRadius] = useState<RadiusFilter>(RADIUS_FILTER_ANY);
  const debouncedSearch = useDebouncedValue(search);
  const searchLocation = useSearchLocation();

  const { data: locationResult, refetch: refetchLocation } = useUserLocation();
  const locationStatus = locationResult?.status ?? 'unavailable';
  const location = searchLocation.coords;

  const searchFilter = useMemo(
    () => ({
      search: debouncedSearch,
      skill,
      sessionType,
      radius,
      location,
      excludeUserId: userId,
    }),
    [debouncedSearch, skill, sessionType, radius, location, userId],
  );

  const filtersActive = hasActiveEventFilters(searchFilter) || searchLocation.mode === 'city';

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

  const clearFilters = () => {
    setSearch('');
    setSkill(SKILL_FILTER_ANY);
    setSessionType(SESSION_TYPE_FILTER_ANY);
    setRadius(RADIUS_FILTER_ANY);
    searchLocation.useNearMe();
  };

  const handleRefresh = () => {
    void refetchLocation();
    void refetchEvents();
    void hostedQuery.refetch();
  };

  const searchBar = (
    <GameSearchBar
      search={search}
      onSearchChange={setSearch}
      skill={skill}
      onSkillChange={setSkill}
      sessionType={sessionType}
      onSessionTypeChange={setSessionType}
      radius={radius}
      onRadiusChange={setRadius}
      location={searchLocation}
      onClear={clearFilters}
      showClear={filtersActive}
    />
  );

  const renderSessionCard = (
    item: EventRow & { distance_km?: number | null },
    goingCount?: number,
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

  if (eventsLoading) {
    return (
      <View style={styles.listContainer}>
        {header ? <View style={styles.headerSlot}>{header}</View> : null}
        <View style={styles.padded}>{searchBar}</View>
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
          {searchBar}
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
              {searchBar}
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
  secondaryLink: {
    alignItems: 'center',
  },
  secondaryLinkText: {
    color: brand.accent,
    fontSize: 15,
    fontWeight: '600',
  },
});
