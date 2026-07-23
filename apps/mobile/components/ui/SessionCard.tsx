import { SESSION_TYPE_LABELS } from '@pickleballcx/shared';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { brand } from '@/constants/brand';
import type { EventRow } from '@/hooks/useEvents';
import { formatSessionDateTime } from '@/lib/format';

export function SessionCard({
  event,
  goingCount,
  onPress,
}: {
  event: EventRow;
  goingCount?: number;
  onPress: () => void;
}) {
  const headcount =
    event.max_players != null && goingCount != null
      ? `${goingCount}/${event.max_players} going`
      : goingCount != null
        ? `${goingCount} going`
        : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <Text style={styles.datetime}>{formatSessionDateTime(event.starts_at)}</Text>
      <Text style={styles.title}>{event.courts?.name ?? 'Session'}</Text>
      <Text style={styles.subtitle}>
        {event.groups?.name ?? 'Open play'} · {SESSION_TYPE_LABELS[event.session_type]}
      </Text>
      {event.courts?.address ? <Text style={styles.address}>{event.courts.address}</Text> : null}
      {headcount ? <Text style={styles.headcount}>{headcount}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: brand.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginBottom: 12,
  },
  cardPressed: {
    opacity: 0.85,
  },
  datetime: {
    fontSize: 13,
    fontWeight: '600',
    color: brand.green700,
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: brand.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: brand.muted,
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: brand.muted,
    marginBottom: 6,
  },
  headcount: {
    fontSize: 13,
    fontWeight: '700',
    color: brand.green900,
  },
});
