import {
  RSVP_STATUSES,
  RSVP_STATUS_LABELS,
  SESSION_TYPE_LABELS,
  SKILL_LEVEL_LABELS,
  type SkillLevel,
} from '@pickleballcx/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { SkillBadge } from '@/components/ui/SkillBadge';
import { PrimaryButton } from '@/components/ui/Screen';
import { SessionComments } from '@/components/sessions/SessionComments';
import { brand } from '@/constants/brand';
import {
  countGoing,
  skillBreakdown,
  useDeleteEvent,
  useEvent,
  useEventRsvps,
  useRsvp,
  type EventRsvpRow,
} from '@/hooks/useEvents';
import { formatSessionDateTime } from '@/lib/format';
import { getDirectionsUrl } from '@/lib/maps-links';
import { editSessionRoute, newSessionRoute, sessionsTabRoute } from '@/lib/routes';
import { useAuth } from '@/providers/AuthProvider';

export default function SessionDetailScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const id = eventId!;
  const { session } = useAuth();
  const { data: event, isLoading, error } = useEvent(id);
  const { data: rsvps, isLoading: rsvpsLoading } = useEventRsvps(id);
  const rsvpMutation = useRsvp(id);
  const deleteEvent = useDeleteEvent(id, event?.group_id ?? null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();

  const isCreator = event?.created_by === session?.user.id;
  const userRsvp = rsvps?.find((row) => row.user_id === session?.user.id);
  const goingCount = countGoing(rsvps ?? []);
  const breakdown = skillBreakdown(rsvps ?? []);
  const goingAttendees = (rsvps ?? []).filter((row) => row.status === 'going');

  if (isLoading || rsvpsLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={brand.accent} />
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorTitle}>Session not found</Text>
        <Text style={styles.errorBody}>{error?.message ?? 'This session may have been removed.'}</Text>
      </View>
    );
  }

  const headcountLabel =
    event.max_players != null
      ? `${goingCount}/${event.max_players} going`
      : `${goingCount} going`;

  const skillSummary = (['beginner', 'intermediate', 'advanced'] as SkillLevel[])
    .filter((level) => breakdown[level] > 0)
    .map((level) => `${breakdown[level]} ${SKILL_LEVEL_LABELS[level].toLowerCase()}`)
    .join(', ');

  const directionsUrl = getDirectionsUrl({
    address: event.courts?.address,
    lat: event.lat,
    lng: event.lng,
  });

  const handleOpenDirections = () => {
    if (!directionsUrl) return;
    void Linking.openURL(directionsUrl);
  };

  const handleConfirmDelete = async () => {
    setDeleteError(undefined);

    try {
      await deleteEvent.mutateAsync();
      router.replace(sessionsTabRoute);
    } catch (deleteError_) {
      setDeleteError(
        deleteError_ instanceof Error ? deleteError_.message : 'Could not delete session',
      );
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.headerCard}>
        <Text style={styles.datetime}>{formatSessionDateTime(event.starts_at)}</Text>
        <Text style={styles.title}>{event.courts?.name ?? 'Session'}</Text>
        <Text style={styles.subtitle}>{SESSION_TYPE_LABELS[event.session_type]}</Text>
        {event.courts?.address ? <Text style={styles.address}>{event.courts.address}</Text> : null}
        {directionsUrl ? (
          <Pressable onPress={handleOpenDirections} style={styles.directionsLink}>
            <Text style={styles.directionsLinkText}>Get directions →</Text>
          </Pressable>
        ) : null}
        {event.courts?.num_courts ? (
          <Text style={styles.meta}>{event.courts.num_courts} courts at this venue</Text>
        ) : null}
        {event.description ? <Text style={styles.description}>{event.description}</Text> : null}
      </View>

      {isCreator ? (
        <View style={styles.creatorActions}>
          <PrimaryButton label="Edit session" onPress={() => router.push(editSessionRoute(id))} />
          {confirmingDelete ? (
            <View style={styles.confirmCard}>
              <Text style={styles.confirmTitle}>Delete session?</Text>
              <Text style={styles.confirmBody}>
                This will permanently remove the session and all RSVPs. This cannot be undone.
              </Text>
              {deleteError ? <Text style={styles.deleteError}>{deleteError}</Text> : null}
              <View style={styles.confirmActions}>
                <Pressable
                  disabled={deleteEvent.isPending}
                  onPress={() => {
                    setConfirmingDelete(false);
                    setDeleteError(undefined);
                  }}
                  style={({ pressed }) => [
                    styles.confirmCancelButton,
                    pressed && !deleteEvent.isPending && styles.deleteButtonPressed,
                  ]}>
                  <Text pointerEvents="none" style={styles.confirmCancelText}>
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  disabled={deleteEvent.isPending}
                  onPress={() => void handleConfirmDelete()}
                  style={({ pressed }) => [
                    styles.confirmDeleteButton,
                    deleteEvent.isPending && styles.deleteButtonDisabled,
                    pressed && !deleteEvent.isPending && styles.deleteButtonPressed,
                  ]}>
                  <Text pointerEvents="none" style={styles.confirmDeleteText}>
                    {deleteEvent.isPending ? 'Deleting…' : 'Delete'}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setDeleteError(undefined);
                setConfirmingDelete(true);
              }}
              style={({ pressed }) => [
                styles.deleteButton,
                pressed && styles.deleteButtonPressed,
              ]}>
              <Text pointerEvents="none" style={styles.deleteButtonText}>
                Delete session
              </Text>
            </Pressable>
          )}
            <Pressable
              onPress={() => router.push(newSessionRoute(event.court_id))}
              style={styles.secondaryLink}>
              <Text style={styles.secondaryLinkText}>Schedule another session here</Text>
            </Pressable>
        </View>
      ) : null}

      <View style={styles.headcountCard}>
        <Text style={styles.headcountValue}>{headcountLabel}</Text>
        {skillSummary ? (
          <Text style={styles.skillSummary}>{skillSummary}</Text>
        ) : (
          <Text style={styles.skillSummary}>No skill data yet for going players</Text>
        )}
      </View>

      <Text style={styles.sectionTitle}>Your RSVP</Text>
      <View style={styles.rsvpRow}>
        {RSVP_STATUSES.filter((status) => status !== 'waitlist').map((status) => {
          const selected = userRsvp?.status === status;
          return (
            <Pressable
              key={status}
              disabled={rsvpMutation.isPending}
              onPress={() => rsvpMutation.mutate(status)}
              style={[styles.rsvpButton, selected && styles.rsvpButtonSelected]}>
              <Text style={[styles.rsvpText, selected && styles.rsvpTextSelected]}>
                {RSVP_STATUS_LABELS[status]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>Going ({goingCount})</Text>
      {goingAttendees.length === 0 ? (
        <Text style={styles.emptyAttendees}>No one has RSVP'd going yet. Be the first!</Text>
      ) : (
        goingAttendees.map((attendee) => (
          <AttendeeRow key={attendee.user_id} attendee={attendee} />
        ))
      )}

      {(rsvps ?? []).some((row) => row.status === 'maybe') ? (
        <>
          <Text style={styles.sectionTitle}>Maybe</Text>
          {(rsvps ?? [])
            .filter((row) => row.status === 'maybe')
            .map((attendee) => (
              <AttendeeRow key={attendee.user_id} attendee={attendee} />
            ))}
        </>
      ) : null}

      <SessionComments eventId={id} />
    </ScrollView>
  );
}

function AttendeeRow({ attendee }: { attendee: EventRsvpRow }) {
  return (
    <View style={styles.attendeeCard}>
      <Avatar uri={attendee.avatar_url} name={attendee.display_name} size={40} />
      <View style={styles.attendeeCopy}>
        <Text style={styles.attendeeName}>{attendee.display_name || 'Player'}</Text>
        <SkillBadge level={attendee.skill_level} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.background,
  },
  container: {
    flex: 1,
    backgroundColor: brand.background,
    padding: 20,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: brand.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: brand.border,
    marginBottom: 16,
  },
  creatorActions: {
    marginBottom: 16,
    gap: 12,
  },
  deleteButton: {
    backgroundColor: brand.surface,
    borderWidth: 1,
    borderColor: brand.danger,
    borderRadius: 12,
    paddingVertical: 16,
  },
  deleteButtonPressed: {
    opacity: 0.85,
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    color: brand.danger,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
  },
  confirmCard: {
    backgroundColor: brand.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: brand.border,
    gap: 12,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: brand.text,
  },
  confirmBody: {
    fontSize: 15,
    lineHeight: 22,
    color: brand.muted,
  },
  deleteError: {
    fontSize: 14,
    color: brand.danger,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmCancelButton: {
    flex: 1,
    backgroundColor: brand.surface,
    borderWidth: 1,
    borderColor: brand.borderStrong,
    borderRadius: 12,
    paddingVertical: 14,
  },
  confirmCancelText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: brand.text,
  },
  confirmDeleteButton: {
    flex: 1,
    backgroundColor: brand.danger,
    borderRadius: 12,
    paddingVertical: 14,
  },
  confirmDeleteText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: brand.white,
  },
  secondaryLink: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  secondaryLinkText: {
    color: brand.accent,
    fontSize: 15,
    fontWeight: '600',
  },
  datetime: {
    fontSize: 14,
    fontWeight: '600',
    color: brand.accent,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: brand.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: brand.muted,
    marginBottom: 8,
  },
  address: {
    fontSize: 15,
    color: brand.text,
    marginBottom: 4,
  },
  directionsLink: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    marginBottom: 4,
  },
  directionsLinkText: {
    fontSize: 15,
    fontWeight: '700',
    color: brand.accent,
  },
  meta: {
    fontSize: 14,
    color: brand.muted,
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: brand.text,
    marginTop: 8,
  },
  headcountCard: {
    backgroundColor: brand.accentSurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: brand.accent,
    padding: 18,
    marginBottom: 20,
  },
  headcountValue: {
    fontSize: 22,
    fontWeight: '800',
    color: brand.accent,
    marginBottom: 4,
  },
  skillSummary: {
    fontSize: 14,
    color: brand.muted,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: brand.text,
    marginBottom: 12,
  },
  rsvpRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  rsvpButton: {
    backgroundColor: brand.surface,
    borderWidth: 1,
    borderColor: brand.borderStrong,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  rsvpButtonSelected: {
    backgroundColor: brand.accent,
    borderColor: brand.accent,
  },
  rsvpText: {
    fontSize: 14,
    fontWeight: '700',
    color: brand.text,
  },
  rsvpTextSelected: {
    color: brand.accentText,
  },
  attendeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brand.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: brand.border,
    marginBottom: 10,
    gap: 12,
  },
  attendeeCopy: {
    flex: 1,
    gap: 6,
  },
  attendeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: brand.text,
  },
  emptyAttendees: {
    fontSize: 15,
    color: brand.muted,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: brand.text,
    marginBottom: 8,
  },
  errorBody: {
    fontSize: 15,
    color: brand.muted,
  },
});
