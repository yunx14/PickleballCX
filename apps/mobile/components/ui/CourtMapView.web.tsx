import { Image, StyleSheet, Text, View } from 'react-native';

import { brand } from '@/constants/brand';
import { radius, spacing } from '@/constants/theme';
import { hasValidCoordinates } from '@/lib/geo';
import { getGoogleStaticMapUrl } from '@/lib/static-map';

import type { CourtMapViewProps } from './CourtMapView.types';

export type { CourtMapViewProps } from './CourtMapView.types';

export function CourtMapView({
  lat,
  lng,
  height = 140,
  interactive: _interactive = false,
  bleed = false,
}: CourtMapViewProps) {
  const coords = lat != null && lng != null ? { lat, lng } : null;

  if (!hasValidCoordinates(coords)) return null;

  const uri = getGoogleStaticMapUrl(coords!, { width: 600, height: Math.round(height * 2) });
  if (!uri) {
    return (
      <View style={[styles.placeholder, bleed && styles.bleed, { height }]}>
        <Text style={styles.placeholderText}>Map unavailable — add Google Maps API key</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, bleed && styles.bleed, { height }]}>
      <Image
        source={{ uri }}
        style={styles.image}
        resizeMode="cover"
        accessibilityLabel="Map showing court location"
      />
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
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: brand.surfaceElevated,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  placeholderText: {
    fontSize: 13,
    color: brand.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
