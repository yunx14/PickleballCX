import { SESSION_TYPE_LABELS } from '@pickleballcx/shared';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { brand } from '@/constants/brand';
import { spacing, typography } from '@/constants/theme';
import type { EventRow } from '@/hooks/useEvents';
import { formatSessionDateTime } from '@/lib/format';

export function SessionCard({
  event,
  goingCount,
  distanceLabel,
  onPress,
}: {
  event: EventRow;
  goingCount?: number;
  distanceLabel?: string;
  onPress: () => void;
}) {
  const headcount =
    event.max_players != null && goingCount != null
      ? `${goingCount}/${event.max_players}`
      : goingCount != null
        ? `${goingCount}`
        : null;

  const isOpenPlay = event.group_id == null;

  return (
    <View style={styles.wrapper}>
      <Card onPress={onPress} accent={isOpenPlay}>
        <View style={styles.metaRow}>
          <Text style={styles.datetime}>{formatSessionDateTime(event.starts_at)}</Text>
          {isOpenPlay ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>OPEN</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.title}>{event.courts?.name ?? 'Session'}</Text>
        <Text style={styles.subtitle}>
          {event.groups?.name ?? 'Public'} · {SESSION_TYPE_LABELS[event.session_type]}
        </Text>
        {event.courts?.address ? <Text style={styles.address}>{event.courts.address}</Text> : null}
        <View style={styles.footerRow}>
          {distanceLabel ? <Text style={styles.distance}>{distanceLabel}</Text> : null}
          {headcount ? (
            <View style={styles.headcountBadge}>
              <Text style={styles.headcount}>{headcount} going</Text>
            </View>
          ) : null}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  datetime: {
    ...typography.caption,
    fontWeight: '700',
    color: brand.accent,
    flexShrink: 1,
  },
  badge: {
    backgroundColor: brand.accentSurface,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: brand.accent,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: brand.accent,
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: brand.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  address: {
    ...typography.caption,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  distance: {
    fontSize: 13,
    fontWeight: '700',
    color: brand.accent,
  },
  headcountBadge: {
    backgroundColor: brand.surfaceElevated,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  headcount: {
    fontSize: 12,
    fontWeight: '700',
    color: brand.text,
  },
});
