import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { StyleSheet, Text, View } from 'react-native';

import { brand } from '@/constants/brand';
import { radius, spacing } from '@/constants/theme';
import { hasValidCoordinates } from '@/lib/geo';

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
        provider={PROVIDER_GOOGLE}
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
      {!interactive ? (
        <View style={styles.overlay} pointerEvents="none">
          <Text style={styles.attribution}>Google</Text>
        </View>
      ) : null}
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
  overlay: {
    position: 'absolute',
    right: spacing.xs,
    bottom: spacing.xs,
  },
  attribution: {
    fontSize: 9,
    color: brand.muted,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
});
