import { router } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { CourtsMap } from '@/components/courts/CourtsMap';
import { EmptyState } from '@/components/ui/EmptyState';
import { PrimaryButton } from '@/components/ui/Screen';
import { brand } from '@/constants/brand';
import { spacing } from '@/constants/theme';
import { useCourts } from '@/hooks/useCourts';
import { useUserLocation } from '@/hooks/useUserLocation';
import { formatDistanceMiles, hasValidCoordinates } from '@/lib/geo';
import { distanceToCoordsKm } from '@/lib/proximity';
import { courtRoute, newCourtRoute } from '@/lib/routes';
import { useAuth } from '@/providers/AuthProvider';

export default function CourtsMapScreen() {
  const { profile } = useAuth();
  const isAppAdmin = profile?.is_app_admin ?? false;

  const { data: courts, isLoading: courtsLoading, error, refetch } = useCourts();
  const {
    data: locationResult,
    refetch: refetchLocation,
  } = useUserLocation();

  const location = locationResult?.coords ?? null;
  const locationStatus = locationResult?.status ?? 'unavailable';
  const showHeader = locationStatus === 'denied' || isAppAdmin;

  const courtsToShow = useMemo(() => {
    const withPins = (courts ?? []).filter((court) =>
      hasValidCoordinates({ lat: court.lat, lng: court.lng }),
    );

    return [...withPins].sort((a, b) => {
      const da = distanceToCoordsKm(location, { lat: a.lat, lng: a.lng }) ?? Number.POSITIVE_INFINITY;
      const db = distanceToCoordsKm(location, { lat: b.lat, lng: b.lng }) ?? Number.POSITIVE_INFINITY;
      return da - db;
    });
  }, [courts, location]);

  if (courtsLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={brand.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.padded}>
        <EmptyState title="Could not load courts" body={error.message} />
        <PrimaryButton label="Try again" onPress={() => void refetch()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showHeader ? (
        <View style={styles.header}>
          {locationStatus === 'denied' ? (
            <Pressable onPress={() => void refetchLocation()}>
              <Text style={styles.link}>Try enabling location again</Text>
            </Pressable>
          ) : null}
          {isAppAdmin ? (
            <Pressable onPress={() => router.push(newCourtRoute)}>
              <Text style={styles.link}>Add court</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {courtsToShow.length === 0 ? (
        <View style={styles.padded}>
          <EmptyState
            title="No courts on the map yet"
            body={
              isAppAdmin
                ? 'Add a court with an address so it can be pinned on the map.'
                : 'Courts are added by app admins. Check back soon.'
            }
          />
        </View>
      ) : (
        <>
          <CourtsMap
            courts={courtsToShow}
            userLat={location?.lat}
            userLng={location?.lng}
            onSelectCourt={(courtId) => router.push(courtRoute(courtId))}
          />
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {courtsToShow.length} court{courtsToShow.length === 1 ? '' : 's'}
              {location && courtsToShow[0]
                ? ` · nearest ${formatDistanceMiles(
                    distanceToCoordsKm(location, {
                      lat: courtsToShow[0].lat,
                      lng: courtsToShow[0].lng,
                    }) ?? 0,
                  )}`
                : ''}
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brand.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.background,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  link: {
    color: brand.accent,
    fontSize: 14,
    fontWeight: '700',
  },
  padded: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: brand.border,
    backgroundColor: brand.surfaceElevated,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '600',
    color: brand.muted,
  },
});
