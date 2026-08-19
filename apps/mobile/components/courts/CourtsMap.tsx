import MapView, { Marker } from 'react-native-maps';
import { StyleSheet, Text, View } from 'react-native';

import { brand } from '@/constants/brand';
import { hasValidCoordinates } from '@/lib/geo';
import { getMapProvider } from '@/lib/map-provider';

import type { CourtsMapProps } from './CourtsMap.types';

export type { CourtsMapProps } from './CourtsMap.types';

export function CourtsMap({
  courts,
  userLat,
  userLng,
  onSelectCourt,
}: CourtsMapProps) {
  const userCoords =
    userLat != null && userLng != null ? { lat: userLat, lng: userLng } : null;
  const hasUser = hasValidCoordinates(userCoords);

  if (!courts.length && !hasUser) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No courts with map pins yet.</Text>
      </View>
    );
  }

  const lats = courts.map((court) => court.lat);
  const lngs = courts.map((court) => court.lng);
  if (hasUser) {
    lats.push(userCoords!.lat);
    lngs.push(userCoords!.lng);
  }

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latitudeDelta = lats.length ? Math.max(0.06, (maxLat - minLat) * 1.5 || 0.12) : 0.12;
  const longitudeDelta = lngs.length ? Math.max(0.06, (maxLng - minLng) * 1.5 || 0.12) : 0.12;

  const centerLat = lats.length ? (minLat + maxLat) / 2 : 39.5;
  const centerLng = lngs.length ? (minLng + maxLng) / 2 : -98.35;

  return (
    <MapView
      provider={getMapProvider()}
      style={styles.map}
      initialRegion={{
        latitude: centerLat,
        longitude: centerLng,
        latitudeDelta,
        longitudeDelta,
      }}
      showsUserLocation={hasUser}
      toolbarEnabled={false}>
      {courts.map((court) => (
        <Marker
          key={court.id}
          coordinate={{ latitude: court.lat, longitude: court.lng }}
          title={court.name}
          description={court.address}
          pinColor={brand.accent}
          onCalloutPress={() => onSelectCourt(court.id)}
          onPress={() => onSelectCourt(court.id)}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    minHeight: 320,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.surfaceElevated,
    padding: 24,
  },
  emptyText: {
    color: brand.muted,
    fontSize: 15,
    textAlign: 'center',
  },
});
