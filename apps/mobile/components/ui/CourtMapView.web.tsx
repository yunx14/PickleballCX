import { StyleSheet, View } from 'react-native';

import { WebGoogleMap } from '@/components/maps/WebGoogleMap';
import { brand } from '@/constants/brand';
import { radius, spacing } from '@/constants/theme';
import { hasValidCoordinates } from '@/lib/geo';

import type { CourtMapViewProps } from './CourtMapView.types';

export type { CourtMapViewProps } from './CourtMapView.types';

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
      <WebGoogleMap
        center={{ lat: coords!.lat, lng: coords!.lng }}
        zoom={15}
        height={height}
        interactive={interactive}
        markers={[{ id: 'court', lat: coords!.lat, lng: coords!.lng }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: brand.surfaceElevated,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  bleed: {
    marginHorizontal: -spacing.lg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginBottom: 0,
  },
});
