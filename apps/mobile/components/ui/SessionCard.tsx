import { SESSION_TYPE_LABELS } from '@pickleballcx/shared';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { CourtMapPreview } from '@/components/ui/CourtMapPreview';
import { brand } from '@/constants/brand';
import { spacing, typography } from '@/constants/theme';
import type { EventRow } from '@/hooks/useEvents';
import { useIsCompactViewport } from '@/hooks/useIsCompactViewport';
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
  const isCompact = useIsCompactViewport();
  const headcount =
    event.max_players != null && goingCount != null
      ? `${goingCount}/${event.max_players}`
      : goingCount != null
        ? `${goingCount}`
        : null;
  const isFull = event.max_players != null && goingCount != null && goingCount >= event.max_players;

  return (
    <View style={styles.wrapper}>
      <Card onPress={onPress} style={styles.card}>
        {isCompact ? null : <CourtMapPreview lat={event.lat} lng={event.lng} />}
        <View style={styles.body}>
          <View style={styles.metaRow}>
            <Text style={styles.datetime}>{formatSessionDateTime(event.starts_at)}</Text>
          </View>
          <Text style={styles.title} numberOfLines={1}>
            {event.courts?.name ?? 'Session'}
          </Text>
          <Text style={styles.subtitle}>{SESSION_TYPE_LABELS[event.session_type]}</Text>
          {event.courts?.address ? (
            <Text style={styles.address} numberOfLines={1}>
              {event.courts.address}
            </Text>
          ) : null}
          <View style={styles.footerRow}>
            {distanceLabel ? <Text style={styles.distance}>{distanceLabel}</Text> : null}
            {headcount ? (
              <View style={styles.headcountBadge}>
                <Text style={styles.headcount}>
                  {isFull ? `${headcount} · full` : `${headcount} going`}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  card: {
    width: '100%',
  },
  body: {
    flexDirection: 'column',
    gap: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  datetime: {
    ...typography.caption,
    fontWeight: '700',
    color: brand.accent,
    flexShrink: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: brand.text,
  },
  subtitle: {
    ...typography.caption,
    fontSize: 14,
  },
  address: {
    ...typography.caption,
    fontSize: 14,
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
