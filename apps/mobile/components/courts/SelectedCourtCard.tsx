import { COURT_TYPE_LABELS } from '@pickleballcx/shared';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { brand } from '@/constants/brand';
import { border, radius, spacing, typography, cardShadow } from '@/constants/theme';
import type { Court } from '@/hooks/useCourts';

/**
 * Bottom sheet style preview shown after tapping a map pin. Tapping the card
 * opens the court; the pin itself no longer navigates directly.
 */
export function SelectedCourtCard({
  court,
  onPress,
}: {
  court: Court;
  onPress: () => void;
}) {
  const courtCount = `${court.num_courts} ${court.num_courts === 1 ? 'court' : 'courts'} available`;

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View ${court.name}`}
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={1}>
            {court.name}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {COURT_TYPE_LABELS[court.court_type]} • {courtCount}
          </Text>
          <Text style={styles.hint}>Tap for details and sessions</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.lg,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: brand.surfaceElevated,
    borderWidth: border.width,
    borderColor: border.colorStrong,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...cardShadow(),
  },
  cardPressed: {
    opacity: 0.9,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...typography.titleSm,
    fontSize: 18,
  },
  meta: {
    ...typography.caption,
    fontSize: 14,
    color: brand.accent,
    fontWeight: '600',
  },
  hint: {
    ...typography.caption,
    marginTop: 2,
  },
});
