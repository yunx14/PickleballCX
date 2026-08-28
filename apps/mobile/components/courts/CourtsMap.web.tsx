import { StyleSheet, View } from 'react-native';

import { WebGoogleMap } from '@/components/maps/WebGoogleMap';
import { hasValidCoordinates } from '@/lib/geo';

import type { CourtsMapProps } from './CourtsMap.types';

export type { CourtsMapProps } from './CourtsMap.types';

export function CourtsMap({
  courts,
  userLat,
  userLng,
  onSelectCourt,
  onDeselectCourt,
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
        fill
        interactive
        markers={courts.map((court) => ({
          id: court.id,
          lat: court.lat,
          lng: court.lng,
          title: court.name,
        }))}
        onMarkerPress={onSelectCourt}
        onMapPress={onDeselectCourt}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
