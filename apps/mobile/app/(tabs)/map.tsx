import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { CourtsMap } from '@/components/courts/CourtsMap';
import { SelectedCourtCard } from '@/components/courts/SelectedCourtCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { PrimaryButton } from '@/components/ui/Screen';
import { brand } from '@/constants/brand';
import { spacing } from '@/constants/theme';
import { useCourts } from '@/hooks/useCourts';
import { useUserLocation } from '@/hooks/useUserLocation';
import { hasValidCoordinates } from '@/lib/geo';
import { distanceToCoordsKm } from '@/lib/proximity';
import { courtRoute, newCourtRoute } from '@/lib/routes';
import { useAuth } from '@/providers/AuthProvider';

export default function CourtsMapScreen() {
  const { profile } = useAuth();
  const isAppAdmin = profile?.is_app_admin ?? false;
  const [selectedCourtId, setSelectedCourtId] = useState<string | null>(null);

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

  const selectedCourt = useMemo(
    () => courtsToShow.find((court) => court.id === selectedCourtId) ?? null,
    [courtsToShow, selectedCourtId],
  );

  // Drop the selection if that court disappears from the map on a refetch.
  useEffect(() => {
    if (selectedCourtId && !selectedCourt) setSelectedCourtId(null);
  }, [selectedCourt, selectedCourtId]);

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
        <View style={styles.mapArea}>
          <CourtsMap
            courts={courtsToShow}
            userLat={location?.lat}
            userLng={location?.lng}
            onSelectCourt={setSelectedCourtId}
            onDeselectCourt={() => setSelectedCourtId(null)}
          />
          {selectedCourt ? (
            <SelectedCourtCard
              court={selectedCourt}
              onPress={() => router.push(courtRoute(selectedCourt.id))}
            />
          ) : null}
        </View>
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
  mapArea: {
    flex: 1,
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
});
