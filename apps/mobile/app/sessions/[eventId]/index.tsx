import {
  RSVP_STATUSES,
  RSVP_STATUS_LABELS,
  SESSION_TYPE_LABELS,
  SKILL_LEVEL_LABELS,
  formatDurationLabel,
  type SkillLevel,
} from '@pickleballcx/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { SkillBadge } from '@/components/ui/SkillBadge';
import { PrimaryButton } from '@/components/ui/Screen';
import { SessionComments } from '@/components/sessions/SessionComments';
import { brand } from '@/constants/brand';
import {
  countGoing,
  skillBreakdown,
  useBroadcastToAttendees,
  useCancelEvent,
  useDeleteEvent,
  useEvent,
  useEventRsvps,
  useReinstateEvent,
  useRsvp,
  type EventRsvpRow,
} from '@/hooks/useEvents';
import { formatSessionTimeRange, isSessionInProgress } from '@/lib/format';
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
  const deleteEvent = useDeleteEvent(id);
  const cancelEvent = useCancelEvent(id);
  const reinstateEvent = useReinstateEvent(id);
  const broadcast = useBroadcastToAttendees(id);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastError, setBroadcastError] = useState<string>();
  const [broadcastSent, setBroadcastSent] = useState<number>();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [actionError, setActionError] = useState<string>();

  const isCreator = event?.created_by === session?.user.id;
  const userRsvp = rsvps?.find((row) => row.user_id === session?.user.id);
  const goingCount = countGoing(rsvps ?? []);
  const breakdown = skillBreakdown(rsvps ?? []);
  const goingAttendees = (rsvps ?? []).filter((row) => row.status === 'going');
  // The roster RPC orders by RSVP time, so this is the real promotion order.
  const waitlist = (rsvps ?? []).filter((row) => row.status === 'waitlist');
  const isFull = event?.max_players != null && goingCount >= event.max_players;
  const onWaitlist = userRsvp?.status === 'waitlist';
  const waitlistPosition = onWaitlist
    ? waitlist.findIndex((row) => row.user_id === session?.user.id) + 1
    : 0;
  const isCancelled = Boolean(event?.cancelled_at);
  const hasEnded = event ? new Date(event.ends_at).getTime() <= Date.now() : false;

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
      {isCancelled ? (
        <View style={styles.cancelledBanner}>
          <Text style={styles.cancelledTitle}>This session was cancelled</Text>
          {event.cancellation_reason ? (
            <Text style={styles.cancelledBody}>{event.cancellation_reason}</Text>
          ) : (
            <Text style={styles.cancelledBody}>The host called it off.</Text>
          )}
        </View>
      ) : null}

      <View style={styles.headerCard}>
        <Text style={styles.datetime}>
          {formatSessionTimeRange(event.starts_at, event.ends_at)}
        </Text>
        <Text style={styles.duration}>
          {formatDurationLabel(event.duration_minutes)}
          {isSessionInProgress(event.starts_at, event.ends_at) ? ' · in progress now' : ''}
        </Text>
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
          {isCancelled ? (
            <>
              <PrimaryButton
                label={reinstateEvent.isPending ? 'Putting it back on…' : 'Put session back on'}
                onPress={() => {
                  setActionError(undefined);
                  reinstateEvent.mutate(undefined, {
                    onError: (error) =>
                      setActionError(
                        error instanceof Error ? error.message : 'Could not reinstate session',
                      ),
                  });
                }}
                disabled={reinstateEvent.isPending}
              />
              {actionError ? <Text style={styles.deleteError}>{actionError}</Text> : null}
            </>
          ) : (
            <PrimaryButton label="Edit session" onPress={() => router.push(editSessionRoute(id))} />
          )}

          {!isCancelled && !hasEnded ? (
            <View style={styles.broadcastCard}>
              <Text style={styles.confirmTitle}>Message the players</Text>
              <Text style={styles.confirmBody}>
                Everyone who RSVP’d gets a notification. Good for “running 10 minutes late” or
                “we’re on court 3”.
              </Text>
              <TextInput
                style={styles.reasonInput}
                value={broadcastMessage}
                onChangeText={(text) => {
                  setBroadcastMessage(text);
                  setBroadcastSent(undefined);
                  setBroadcastError(undefined);
                }}
                placeholder="e.g. Running 10 minutes late, start without me"
                placeholderTextColor={brand.muted}
                maxLength={500}
                multiline
                textAlignVertical="top"
                accessibilityLabel="Message to players"
              />
              {broadcastError ? <Text style={styles.deleteError}>{broadcastError}</Text> : null}
              {broadcastSent != null ? (
                <Text style={styles.broadcastSuccess}>
                  {broadcastSent === 0
                    ? 'Nobody else has RSVP’d yet, so there was nobody to notify.'
                    : `Sent to ${broadcastSent} ${broadcastSent === 1 ? 'player' : 'players'}.`}
                </Text>
              ) : null}
              <PrimaryButton
                label={broadcast.isPending ? 'Sending…' : 'Send message'}
                disabled={broadcast.isPending || !broadcastMessage.trim()}
                onPress={() => {
                  setBroadcastError(undefined);
                  setBroadcastSent(undefined);
                  broadcast.mutate(broadcastMessage.trim(), {
                    onSuccess: (count) => {
                      setBroadcastSent(count);
                      setBroadcastMessage('');
                    },
                    onError: (error) =>
                      setBroadcastError(
                        error instanceof Error ? error.message : 'Could not send message',
                      ),
                  });
                }}
              />
            </View>
          ) : null}

          {!isCancelled ? (
            confirmingCancel ? (
              <View style={styles.confirmCard}>
                <Text style={styles.confirmTitle}>Cancel this session?</Text>
                <Text style={styles.confirmBody}>
                  Everyone who RSVP’d will be notified. The session stays visible to them with your
                  reason, and you can put it back on later.
                </Text>
                <TextInput
                  style={styles.reasonInput}
                  value={cancelReason}
                  onChangeText={setCancelReason}
                  placeholder="Reason (optional), e.g. courts flooded"
                  placeholderTextColor={brand.muted}
                  maxLength={300}
                  multiline
                  textAlignVertical="top"
                  accessibilityLabel="Cancellation reason"
                />
                {actionError ? <Text style={styles.deleteError}>{actionError}</Text> : null}
                <View style={styles.confirmActions}>
                  <Pressable
                    disabled={cancelEvent.isPending}
                    onPress={() => {
                      setConfirmingCancel(false);
                      setActionError(undefined);
                    }}
                    style={({ pressed }) => [
                      styles.confirmCancelButton,
                      pressed && !cancelEvent.isPending && styles.deleteButtonPressed,
                    ]}>
                    <Text pointerEvents="none" style={styles.confirmCancelText}>
                      Keep it
                    </Text>
                  </Pressable>
                  <Pressable
                    disabled={cancelEvent.isPending}
                    onPress={() => {
                      setActionError(undefined);
                      cancelEvent.mutate(cancelReason, {
                        onSuccess: () => {
                          setConfirmingCancel(false);
                          setCancelReason('');
                        },
                        onError: (error) =>
                          setActionError(
                            error instanceof Error ? error.message : 'Could not cancel session',
                          ),
                      });
                    }}
                    style={({ pressed }) => [
                      styles.confirmDeleteButton,
                      cancelEvent.isPending && styles.deleteButtonDisabled,
                      pressed && !cancelEvent.isPending && styles.deleteButtonPressed,
                    ]}>
                    <Text pointerEvents="none" style={styles.confirmDeleteText}>
                      {cancelEvent.isPending ? 'Cancelling…' : 'Cancel session'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setActionError(undefined);
                  setConfirmingCancel(true);
                }}
                style={({ pressed }) => [styles.deleteButton, pressed && styles.deleteButtonPressed]}>
                <Text pointerEvents="none" style={styles.deleteButtonText}>
                  Cancel session
                </Text>
              </Pressable>
            )
          ) : null}
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
        {isFull ? (
          <Text style={styles.fullNotice}>
            {waitlist.length
              ? `Session full · ${waitlist.length} waiting`
              : 'Session full · new RSVPs join the waitlist'}
          </Text>
        ) : null}
      </View>

      {onWaitlist ? (
        <View style={styles.waitlistBanner}>
          <Text style={styles.waitlistBannerTitle}>
            {waitlistPosition > 0 ? `You are #${waitlistPosition} on the waitlist` : 'You are on the waitlist'}
          </Text>
          <Text style={styles.waitlistBannerBody}>
            We will move you in automatically and notify you if a spot opens up.
          </Text>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Your RSVP</Text>
      {isCancelled ? (
        <Text style={styles.rsvpClosed}>
          RSVPs are closed because this session was cancelled.
        </Text>
      ) : (
      <View style={styles.rsvpRow}>
        {RSVP_STATUSES.filter((status) => status !== 'waitlist').map((status) => {
          // A going request on a full session is stored as waitlist, so that button
          // owns the waitlist state rather than showing nothing as selected.
          const selected =
            userRsvp?.status === status || (status === 'going' && onWaitlist);
          const label =
            status === 'going' && (onWaitlist || (isFull && userRsvp?.status !== 'going'))
              ? onWaitlist
                ? 'On waitlist'
                : 'Join waitlist'
              : RSVP_STATUS_LABELS[status];

          return (
            <Pressable
              key={status}
              disabled={rsvpMutation.isPending}
              onPress={() => rsvpMutation.mutate(status)}
              style={[styles.rsvpButton, selected && styles.rsvpButtonSelected]}>
              <Text style={[styles.rsvpText, selected && styles.rsvpTextSelected]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
      )}

      <Text style={styles.sectionTitle}>Going ({goingCount})</Text>
      {goingAttendees.length === 0 ? (
        <Text style={styles.emptyAttendees}>No one has RSVP'd going yet. Be the first!</Text>
      ) : (
        goingAttendees.map((attendee) => (
          <AttendeeRow key={attendee.user_id} attendee={attendee} />
        ))
      )}

      {waitlist.length ? (
        <>
          <Text style={styles.sectionTitle}>Waitlist ({waitlist.length})</Text>
          {waitlist.map((attendee, index) => (
            <AttendeeRow key={attendee.user_id} attendee={attendee} position={index + 1} />
          ))}
        </>
      ) : null}

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

function AttendeeRow({ attendee, position }: { attendee: EventRsvpRow; position?: number }) {
  return (
    <View style={styles.attendeeCard}>
      <Avatar uri={attendee.avatar_url} name={attendee.display_name} size={40} />
      <View style={styles.attendeeCopy}>
        <Text style={styles.attendeeName}>{attendee.display_name || 'Player'}</Text>
        <SkillBadge level={attendee.skill_level} />
      </View>
      {position ? <Text style={styles.attendeePosition}>#{position}</Text> : null}
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
    marginBottom: 2,
  },
  duration: {
    fontSize: 13,
    color: brand.muted,
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
  cancelledBanner: {
    backgroundColor: brand.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: brand.danger,
    padding: 16,
    marginBottom: 16,
    gap: 4,
  },
  cancelledTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: brand.danger,
  },
  cancelledBody: {
    fontSize: 14,
    lineHeight: 20,
    color: brand.text,
  },
  reasonInput: {
    backgroundColor: brand.background,
    borderWidth: 1,
    borderColor: brand.borderStrong,
    borderRadius: 12,
    padding: 12,
    minHeight: 70,
    fontSize: 15,
    color: brand.text,
  },
  broadcastCard: {
    backgroundColor: brand.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: brand.border,
    padding: 16,
    gap: 10,
  },
  broadcastSuccess: {
    fontSize: 14,
    fontWeight: '700',
    color: brand.accent,
  },
  rsvpClosed: {
    fontSize: 15,
    color: brand.muted,
    marginBottom: 24,
  },
  fullNotice: {
    fontSize: 14,
    fontWeight: '700',
    color: brand.text,
    marginTop: 8,
  },
  waitlistBanner: {
    backgroundColor: brand.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: brand.borderStrong,
    padding: 16,
    marginBottom: 20,
    gap: 4,
  },
  waitlistBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: brand.text,
  },
  waitlistBannerBody: {
    fontSize: 14,
    lineHeight: 20,
    color: brand.muted,
  },
  attendeePosition: {
    fontSize: 14,
    fontWeight: '700',
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
