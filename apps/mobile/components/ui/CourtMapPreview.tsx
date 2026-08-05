import { StyleSheet, View } from 'react-native';

import { spacing } from '@/constants/theme';

import { CourtMapView } from './CourtMapView';

const PREVIEW_HEIGHT = 140;

export function CourtMapPreview({
  lat,
  lng,
}: {
  lat: number | null | undefined;
  lng: number | null | undefined;
}) {
  return (
    <View style={styles.wrapper}>
      <CourtMapView lat={lat} lng={lng} height={PREVIEW_HEIGHT} interactive={false} bleed />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: -spacing.lg,
    marginBottom: spacing.md,
  },
});
