import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { WebGoogleMap } from '@/components/maps/WebGoogleMap';
import { brand } from '@/constants/brand';
import { radius, spacing } from '@/constants/theme';
import { formatDistanceMiles, hasValidCoordinates } from '@/lib/geo';
import { distanceToCoordsKm } from '@/lib/proximity';

import type { CourtsMapProps } from './CourtsMap.types';

export type { CourtsMapProps } from './CourtsMap.types';

export function CourtsMap({
  courts,
  userLat,
  userLng,
  onSelectCourt,
}: CourtsMapProps) {
  const location =
    userLat != null && userLng != null ? { lat: userLat, lng: userLng } : null;
  const firstCourt = courts[0];
  const center =
    location && hasValidCoordinates(location)
      ? { lat: location.lat, lng: location.lng }
      : firstCourt
        ? { lat: firstCourt.lat, lng: firstCourt.lng }
        : { lat: 39.5, lng: -98.35 };
  const zoom = location && hasValidCoordinates(location) ? 11 : 4;

  return (
    <View style={styles.container}>
      <WebGoogleMap
        center={center}
        zoom={zoom}
        height={360}
        interactive
        markers={courts.map((court) => ({
          id: court.id,
          lat: court.lat,
          lng: court.lng,
          title: court.name,
        }))}
        onMarkerPress={onSelectCourt}
      />
      <Text style={styles.hint}>Tap a pin or a court name to see sessions and schedule a game</Text>
      <ScrollView contentContainerStyle={styles.legend} keyboardShouldPersistTaps="handled">
        {courts.map((court) => {
          const distanceKm = distanceToCoordsKm(location, { lat: court.lat, lng: court.lng });
          return (
            <Pressable
              key={court.id}
              onPress={() => onSelectCourt(court.id)}
              style={({ pressed }) => [styles.legendItem, pressed && styles.pressed]}>
              <View style={styles.pinDot} />
              <View style={styles.legendCopy}>
                <Text style={styles.name} numberOfLines={1}>
                  {court.name}
                </Text>
                <Text style={styles.address} numberOfLines={1}>
                  {court.address}
                </Text>
              </View>
              {distanceKm != null ? (
                <Text style={styles.distance}>{formatDistanceMiles(distanceKm)}</Text>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hint: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    fontSize: 13,
    color: brand.muted,
  },
  legend: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: brand.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: brand.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  pressed: {
    opacity: 0.85,
  },
  pinDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: brand.accent,
  },
  legendCopy: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: brand.text,
  },
  address: {
    fontSize: 13,
    color: brand.muted,
    marginTop: 2,
  },
  distance: {
    fontSize: 12,
    fontWeight: '700',
    color: brand.accent,
  },
});
