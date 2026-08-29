import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { PrimaryButton } from '@/components/ui/Screen';
import { brand } from '@/constants/brand';
import { radius, spacing } from '@/constants/theme';
import {
  useConfirmAttendance,
  useMySessionFeedback,
  useSubmitSessionFeedback,
  type EventRsvpRow,
} from '@/hooks/useEvents';

const RATINGS = [1, 2, 3, 4, 5] as const;

/**
 * Everything that happens after a session is over: the host reconciles who actually
 * played, and the players who were there rate it.
 */
export function PostSessionSection({
  eventId,
  roster,
  isHost,
  attendanceConfirmed,
  viewerRsvp,
}: {
  eventId: string;
  roster: EventRsvpRow[];
  isHost: boolean;
  attendanceConfirmed: boolean;
  viewerRsvp?: EventRsvpRow;
}) {
  // Somebody who said they were not coming is not part of the reconciliation.
  const candidates = useMemo(
    () => roster.filter((row) => row.status !== 'not_going'),
    [roster],
  );

  // Before the host confirms, everyone who said they were going may rate: an idle host
  // should not be able to silence the whole session.
  const canRate =
    viewerRsvp?.attended === true ||
    (!attendanceConfirmed && viewerRsvp?.status === 'going');

  return (
    <View style={styles.wrapper}>
      <Text style={styles.heading}>After the game</Text>

      {isHost ? (
        <AttendanceConfirm
          eventId={eventId}
          candidates={candidates}
          attendanceConfirmed={attendanceConfirmed}
        />
      ) : null}

      {canRate ? (
        <SessionRating eventId={eventId} />
      ) : viewerRsvp?.attended === false ? (
        <Text style={styles.ineligible}>
          The host recorded you as not having played, so this session is not yours to rate.
        </Text>
      ) : null}
    </View>
  );
}

function AttendanceConfirm({
  eventId,
  candidates,
  attendanceConfirmed,
}: {
  eventId: string;
  candidates: EventRsvpRow[];
  attendanceConfirmed: boolean;
}) {
  const confirm = useConfirmAttendance(eventId);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string>();
  const [savedCount, setSavedCount] = useState<number>();

  // Start from what the host already confirmed, or from who said they were going.
  useEffect(() => {
    setSelected(
      candidates
        .filter((row) => (attendanceConfirmed ? row.attended === true : row.status === 'going'))
        .map((row) => row.user_id),
    );
  }, [candidates, attendanceConfirmed]);

  if (!candidates.length) {
    return <Text style={styles.body}>Nobody joined this session, so there is nothing to confirm.</Text>;
  }

  const toggle = (userId: string) => {
    setSavedCount(undefined);
    setError(undefined);
    setSelected((current) =>
      current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId],
    );
  };

  const absentCount = candidates.length - selected.length;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Who played?</Text>
      <Text style={styles.body}>
        Tap anyone who did not turn up. This is what no-show counts are built on, so it is
        worth getting right.
      </Text>

      {candidates.map((player) => {
        const played = selected.includes(player.user_id);
        return (
          <Pressable
            key={player.user_id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: played }}
            onPress={() => toggle(player.user_id)}
            style={({ pressed }) => [
              styles.playerRow,
              played && styles.playerRowPlayed,
              pressed && styles.pressed,
            ]}>
            <Avatar name={player.display_name} uri={player.avatar_url} size={32} />
            <Text style={styles.playerName} numberOfLines={1}>
              {player.display_name}
            </Text>
            <Text style={[styles.playerState, played && styles.playerStatePlayed]}>
              {played ? 'Played' : 'No-show'}
            </Text>
          </Pressable>
        );
      })}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {savedCount != null ? (
        <Text style={styles.success}>
          Saved. {savedCount} {savedCount === 1 ? 'player' : 'players'} played
          {absentCount > 0 ? `, ${absentCount} did not` : ''}.
        </Text>
      ) : null}

      <PrimaryButton
        label={
          confirm.isPending
            ? 'Saving…'
            : attendanceConfirmed
              ? 'Update attendance'
              : 'Confirm attendance'
        }
        disabled={confirm.isPending}
        onPress={() => {
          setError(undefined);
          setSavedCount(undefined);
          confirm.mutate(selected, {
            onSuccess: (count) => setSavedCount(count),
            onError: (err) =>
              setError(err instanceof Error ? err.message : 'Could not save attendance'),
          });
        }}
      />
    </View>
  );
}

function SessionRating({ eventId }: { eventId: string }) {
  const { data: existing, isLoading } = useMySessionFeedback(eventId);
  const submit = useSubmitSessionFeedback(eventId);
  const [rating, setRating] = useState<number>();
  const [note, setNote] = useState('');
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!existing) return;
    setRating(existing.rating);
    setNote(existing.court_note ?? '');
  }, [existing]);

  if (isLoading) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{existing ? 'Your rating' : 'How was it?'}</Text>
      <Text style={styles.body}>
        Ratings stay private. Notes about the courts help other players know what to expect.
      </Text>

      <View style={styles.ratingRow}>
        {RATINGS.map((value) => {
          const active = rating === value;
          return (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityLabel={`${value} out of 5`}
              accessibilityState={{ selected: active }}
              onPress={() => {
                setRating(value);
                setSaved(false);
                setError(undefined);
              }}
              style={({ pressed }) => [
                styles.ratingChip,
                active && styles.ratingChipActive,
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.ratingLabel, active && styles.ratingLabelActive]}>{value}</Text>
            </Pressable>
          );
        })}
      </View>

      <TextInput
        style={styles.noteInput}
        value={note}
        onChangeText={(text) => {
          setNote(text);
          setSaved(false);
        }}
        placeholder="Anything about the courts? e.g. nets sagging, lights out"
        placeholderTextColor={brand.muted}
        maxLength={500}
        multiline
        textAlignVertical="top"
        accessibilityLabel="Court note"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {saved ? <Text style={styles.success}>Thanks, your rating is saved.</Text> : null}

      <PrimaryButton
        label={submit.isPending ? 'Saving…' : existing ? 'Update rating' : 'Submit rating'}
        disabled={submit.isPending || rating == null}
        onPress={() => {
          if (rating == null) return;
          setError(undefined);
          submit.mutate(
            { rating, courtNote: note },
            {
              onSuccess: () => setSaved(true),
              onError: (err) =>
                setError(err instanceof Error ? err.message : 'Could not save your rating'),
            },
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  heading: {
    fontSize: 18,
    fontWeight: '800',
    color: brand.text,
  },
  card: {
    backgroundColor: brand.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: brand.border,
    padding: 16,
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: brand.text,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: brand.muted,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: brand.background,
  },
  playerRowPlayed: {
    borderColor: brand.accent,
  },
  playerName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: brand.text,
  },
  playerState: {
    fontSize: 13,
    fontWeight: '700',
    color: brand.muted,
  },
  playerStatePlayed: {
    color: brand.accent,
  },
  pressed: {
    opacity: 0.7,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  ratingChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: brand.background,
  },
  ratingChipActive: {
    backgroundColor: brand.accent,
    borderColor: brand.accent,
  },
  ratingLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: brand.text,
  },
  ratingLabelActive: {
    color: brand.accentText,
  },
  noteInput: {
    backgroundColor: brand.background,
    borderWidth: 1,
    borderColor: brand.borderStrong,
    borderRadius: 12,
    padding: 12,
    minHeight: 70,
    fontSize: 15,
    color: brand.text,
  },
  error: {
    fontSize: 14,
    fontWeight: '600',
    color: brand.danger,
  },
  success: {
    fontSize: 14,
    fontWeight: '700',
    color: brand.accent,
  },
  ineligible: {
    fontSize: 14,
    lineHeight: 20,
    color: brand.muted,
  },
});
