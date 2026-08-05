import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { PrimaryButton } from '@/components/ui/Screen';
import { SessionCard } from '@/components/ui/SessionCard';
import { brand } from '@/constants/brand';
import { spacing } from '@/constants/theme';
import { useUpcomingEvents } from '@/hooks/useEvents';
import { useUserLocation } from '@/hooks/useUserLocation';
import {
  DISCOVERY_RADIUS_OPTIONS_MI,
  type DiscoveryRadiusMi,
  distanceToEventKm,
} from '@/lib/event-filters';
import { formatDistanceMiles } from '@/lib/geo';
import { courtsRoute, newSessionRoute, sessionRoute } from '@/lib/routes';
import { useAuth } from '@/providers/AuthProvider';

export function SessionsFeed() {
  const { profile } = useAuth();
  const isAppAdmin = profile?.is_app_admin ?? false;
  const [radiusMi, setRadiusMi] = useState<DiscoveryRadiusMi>(50);

  const {
    data: locationResult,
    isLoading: locationLoading,
    refetch: refetchLocation,
  } = useUserLocation();

  const location = locationResult?.coords ?? null;
  const locationStatus = locationResult?.status ?? 'unavailable';

  const {
    data: events,
    isLoading: eventsLoading,
    isRefetching,
    refetch: refetchEvents,
    error,
  } = useUpcomingEvents({
    location,
    radiusMi,
  });

  const isLoading = eventsLoading || locationLoading;

  const locationMessage = useMemo(() => {
    if (locationLoading) return 'Getting your location…';
    if (locationStatus === 'granted' && location) {
      return `Showing open sessions within ${radiusMi} miles of you. Group sessions always appear.`;
    }
    if (locationStatus === 'denied') {
      return 'Location off — showing all open sessions. Enable location to filter by distance.';
    }
    return 'Location unavailable — showing all open sessions.';
  }, [location, locationLoading, locationStatus, radiusMi]);

  const subtitle = locationMessage;

  const handleRefresh = () => {
    void refetchLocation();
    void refetchEvents();
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={brand.accent} />
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      <View style={styles.discoveryHeader}>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <View style={styles.radiusRow}>
          {DISCOVERY_RADIUS_OPTIONS_MI.map((option) => (
            <Chip
              key={option}
              label={`${option} mi`}
              selected={radiusMi === option}
              disabled={!location}
              onPress={() => setRadiusMi(option)}
            />
          ))}
        </View>
        {locationStatus === 'denied' ? (
          <Pressable onPress={() => void refetchLocation()} style={styles.secondaryLink}>
            <Text style={styles.secondaryLinkText}>Try enabling location again</Text>
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <View style={styles.container}>
          <EmptyState title="Could not load sessions" body={error.message} />
        </View>
      ) : !events?.length ? (
        <View style={styles.container}>
          <EmptyState
            title="No sessions yet"
            body="Schedule a public open session or post to one of your groups. Try a wider radius if you are filtering by location."
            action={
              isAppAdmin ? (
                <Pressable onPress={() => router.push(courtsRoute)} style={styles.secondaryLink}>
                  <Text style={styles.secondaryLinkText}>Manage courts</Text>
                </Pressable>
              ) : undefined
            }
          />
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const distanceKm = distanceToEventKm(location, item);
            const distanceLabel =
              distanceKm != null && item.group_id == null
                ? formatDistanceMiles(distanceKm)
                : undefined;

            return (
              <SessionCard
                event={item}
                distanceLabel={distanceLabel}
                onPress={() => router.push(sessionRoute(item.id))}
              />
            );
          }}
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
    backgroundColor: brand.background,
  },
  listContainer: {
    flex: 1,
    backgroundColor: brand.background,
  },
  discoveryHeader: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: brand.muted,
  },
  radiusRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
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
