import MapView, { Marker } from 'react-native-maps';
import { StyleSheet, View } from 'react-native';

import { brand } from '@/constants/brand';
import { radius, spacing } from '@/constants/theme';
import { hasValidCoordinates } from '@/lib/geo';
import { getMapProvider } from '@/lib/map-provider';

import type { CourtMapViewProps } from './CourtMapView.types';

export type { CourtMapViewProps } from './CourtMapView.types';

const DEFAULT_DELTA = 0.02;

export function CourtMapView({
  lat,
  lng,
  height = 140,
  interactive = false,
  bleed = false,
}: CourtMapViewProps) {
  const coords = lat != null && lng != null ? { lat, lng } : null;

  if (!hasValidCoordinates(coords)) return null;

  return (
    <View style={[styles.container, bleed && styles.bleed, { height }]}>
      <MapView
        provider={getMapProvider()}
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude: coords!.lat,
          longitude: coords!.lng,
          latitudeDelta: DEFAULT_DELTA,
          longitudeDelta: DEFAULT_DELTA,
        }}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={interactive}
        liteMode={!interactive}
        pointerEvents={interactive ? 'auto' : 'none'}>
        <Marker
          coordinate={{ latitude: coords!.lat, longitude: coords!.lng }}
          pinColor={brand.accent}
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: brand.surfaceElevated,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  bleed: {
    marginHorizontal: -spacing.lg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
});
