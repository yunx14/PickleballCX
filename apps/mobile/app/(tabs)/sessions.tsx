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

import { SessionCard } from '@/components/ui/SessionCard';
import { PrimaryButton } from '@/components/ui/Screen';
import { brand } from '@/constants/brand';
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

export default function SessionsScreen() {
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

  const handleRefresh = () => {
    void refetchLocation();
    void refetchEvents();
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={brand.green700} />
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      <View style={styles.discoveryHeader}>
        <Text style={styles.discoveryTitle}>Near you</Text>
        <Text style={styles.discoveryBody}>{locationMessage}</Text>
        <View style={styles.radiusRow}>
          {DISCOVERY_RADIUS_OPTIONS_MI.map((option) => {
            const selected = radiusMi === option;
            return (
              <Pressable
                key={option}
                disabled={!location}
                onPress={() => setRadiusMi(option)}
                style={[
                  styles.radiusChip,
                  selected && styles.radiusChipSelected,
                  !location && styles.radiusChipDisabled,
                ]}>
                <Text
                  style={[
                    styles.radiusChipText,
                    selected && styles.radiusChipTextSelected,
                    !location && styles.radiusChipTextDisabled,
                  ]}>
                  {option} mi
                </Text>
              </Pressable>
            );
          })}
        </View>
        {locationStatus === 'denied' ? (
          <Pressable onPress={() => void refetchLocation()} style={styles.secondaryLink}>
            <Text style={styles.secondaryLinkText}>Try enabling location again</Text>
          </Pressable>
        ) : null}
      </View>

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
              Schedule a public open session or post to one of your groups. Try a wider radius if
              you are filtering by location.
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
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const distanceKm = distanceToEventKm(location, item);
            const distanceLabel =
              distanceKm != null && item.group_id == null ? formatDistanceMiles(distanceKm) : undefined;

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
    backgroundColor: brand.sand,
  },
  listContainer: {
    flex: 1,
    backgroundColor: brand.sand,
  },
  discoveryHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 8,
  },
  discoveryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: brand.text,
  },
  discoveryBody: {
    fontSize: 14,
    lineHeight: 20,
    color: brand.muted,
  },
  radiusRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  radiusChip: {
    borderWidth: 1,
    borderColor: '#DEE2E6',
    backgroundColor: brand.white,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  radiusChipSelected: {
    borderColor: brand.green700,
    backgroundColor: brand.green100,
  },
  radiusChipDisabled: {
    opacity: 0.5,
  },
  radiusChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: brand.text,
  },
  radiusChipTextSelected: {
    color: brand.green900,
  },
  radiusChipTextDisabled: {
    color: brand.muted,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
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
    marginTop: 12,
    alignItems: 'center',
  },
  secondaryLinkText: {
    color: brand.green700,
    fontSize: 15,
    fontWeight: '600',
  },
});
