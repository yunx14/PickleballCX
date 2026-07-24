import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PrimaryButton } from '@/components/ui/Screen';
import { brand } from '@/constants/brand';
import { spacing } from '@/constants/theme';
import {
  useCancelMatchRequest,
  useMatchRequests,
  useRespondToMatchRequest,
} from '@/hooks/useMatchRequests';
import {
  useCancelSessionInvite,
  useRespondToSessionInvite,
  useSessionInvites,
} from '@/hooks/useSessionInvites';
import { formatRelativeTime, formatSessionDateTime } from '@/lib/format';
import { playerInviteRoute, playerMessageRoute, sessionRoute } from '@/lib/routes';

export default function MatchRequestsScreen() {
  const { data: requests, isLoading, isRefetching, refetch, error } = useMatchRequests();
  const {
    data: sessionInvites,
    isRefetching: invitesRefetching,
    refetch: refetchInvites,
  } = useSessionInvites();
  const respondToRequest = useRespondToMatchRequest();
  const cancelRequest = useCancelMatchRequest();
  const respondToInvite = useRespondToSessionInvite();
  const cancelInvite = useCancelSessionInvite();
  const [actionError, setActionError] = useState<string>();
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [activeInviteId, setActiveInviteId] = useState<string | null>(null);

  const incomingPending = useMemo(
    () =>
      (requests ?? []).filter(
        (request) => request.direction === 'incoming' && request.status === 'pending',
      ),
    [requests],
  );

  const outgoingPending = useMemo(
    () =>
      (requests ?? []).filter(
        (request) => request.direction === 'outgoing' && request.status === 'pending',
      ),
    [requests],
  );

  const accepted = useMemo(
    () => (requests ?? []).filter((request) => request.status === 'accepted'),
    [requests],
  );

  const incomingSessionInvites = useMemo(
    () =>
      (sessionInvites ?? []).filter(
        (invite) => invite.direction === 'incoming' && invite.status === 'pending',
      ),
    [sessionInvites],
  );

  const outgoingSessionInvites = useMemo(
    () =>
      (sessionInvites ?? []).filter(
        (invite) => invite.direction === 'outgoing' && invite.status === 'pending',
      ),
    [sessionInvites],
  );

  const handleRefresh = () => {
    void refetch();
    void refetchInvites();
  };

  const handleRespond = async (requestId: string, accept: boolean) => {
    setActionError(undefined);
    setActiveRequestId(requestId);

    try {
      await respondToRequest.mutateAsync({ requestId, accept });
    } catch (respondError) {
      setActionError(
        respondError instanceof Error ? respondError.message : 'Could not update match request',
      );
    } finally {
      setActiveRequestId(null);
    }
  };

  const handleCancel = async (requestId: string) => {
    setActionError(undefined);
    setActiveRequestId(requestId);

    try {
      await cancelRequest.mutateAsync(requestId);
    } catch (cancelError) {
      setActionError(
        cancelError instanceof Error ? cancelError.message : 'Could not cancel match request',
      );
    } finally {
      setActiveRequestId(null);
    }
  };

  const handleRespondInvite = async (inviteId: string, accept: boolean) => {
    setActionError(undefined);
    setActiveInviteId(inviteId);

    try {
      const eventId = await respondToInvite.mutateAsync({ inviteId, accept });
      if (accept) {
        router.push(sessionRoute(eventId));
      }
    } catch (respondError) {
      setActionError(
        respondError instanceof Error ? respondError.message : 'Could not update session invite',
      );
    } finally {
      setActiveInviteId(null);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    setActionError(undefined);
    setActiveInviteId(inviteId);

    try {
      await cancelInvite.mutateAsync(inviteId);
    } catch (cancelError) {
      setActionError(
        cancelError instanceof Error ? cancelError.message : 'Could not cancel session invite',
      );
    } finally {
      setActiveInviteId(null);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={brand.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <EmptyState title="Could not load requests" body={error.message} />
      </View>
    );
  }

  const hasAny =
    incomingPending.length > 0 ||
    outgoingPending.length > 0 ||
    accepted.length > 0 ||
    incomingSessionInvites.length > 0 ||
    outgoingSessionInvites.length > 0;

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching || invitesRefetching}
          onRefresh={handleRefresh}
        />
      }>
      {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}

      {!hasAny ? (
        <EmptyState
          title="No match requests"
          body="When someone requests a match with you, it will show up here."
        />
      ) : null}

      {incomingSessionInvites.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session invites</Text>
          {incomingSessionInvites.map((invite) => {
            const isBusy = activeInviteId === invite.id;
            return (
              <Card key={invite.id}>
                <Text style={styles.requestName}>{invite.other_display_name}</Text>
                <Text style={styles.requestMeta}>
                  {invite.court_name} · {formatSessionDateTime(invite.event_starts_at)}
                  {invite.message ? `\n“${invite.message}”` : ''}
                </Text>
                <View style={styles.actionsRow}>
                  <Pressable
                    disabled={isBusy}
                    onPress={() => void handleRespondInvite(invite.id, false)}
                    style={({ pressed }) => [
                      styles.declineButton,
                      pressed && !isBusy && styles.buttonPressed,
                    ]}>
                    <Text style={styles.declineButtonText}>{isBusy ? '…' : 'Decline'}</Text>
                  </Pressable>
                  <PrimaryButton
                    label={isBusy ? '…' : 'Accept'}
                    onPress={() => void handleRespondInvite(invite.id, true)}
                    disabled={isBusy}
                  />
                </View>
              </Card>
            );
          })}
        </View>
      ) : null}

      {incomingPending.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Respond</Text>
          {incomingPending.map((request) => {
            const isBusy = activeRequestId === request.id;
            return (
              <Card key={request.id}>
                <Text style={styles.requestName}>{request.other_display_name}</Text>
                <Text style={styles.requestMeta}>
                  {formatRelativeTime(request.created_at)}
                  {request.message ? ` · “${request.message}”` : ''}
                </Text>
                <View style={styles.actionsRow}>
                  <Pressable
                    disabled={isBusy}
                    onPress={() => void handleRespond(request.id, false)}
                    style={({ pressed }) => [
                      styles.declineButton,
                      pressed && !isBusy && styles.buttonPressed,
                    ]}>
                    <Text style={styles.declineButtonText}>
                      {isBusy ? '…' : 'Decline'}
                    </Text>
                  </Pressable>
                  <PrimaryButton
                    label={isBusy ? '…' : 'Accept'}
                    onPress={() => void handleRespond(request.id, true)}
                    disabled={isBusy}
                  />
                </View>
              </Card>
            );
          })}
        </View>
      ) : null}

      {outgoingPending.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sent</Text>
          {outgoingPending.map((request) => {
            const isBusy = activeRequestId === request.id;
            return (
              <Card key={request.id}>
                <Text style={styles.requestName}>{request.other_display_name}</Text>
                <Text style={styles.requestMeta}>
                  Pending · {formatRelativeTime(request.created_at)}
                </Text>
                <Pressable
                  disabled={isBusy}
                  onPress={() => void handleCancel(request.id)}
                  style={styles.cancelLink}>
                  <Text style={styles.cancelLinkText}>
                    {isBusy ? 'Canceling…' : 'Cancel request'}
                  </Text>
                </Pressable>
              </Card>
            );
          })}
        </View>
      ) : null}

      {outgoingSessionInvites.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sent invites</Text>
          {outgoingSessionInvites.map((invite) => {
            const isBusy = activeInviteId === invite.id;
            return (
              <Card key={invite.id}>
                <Text style={styles.requestName}>{invite.other_display_name}</Text>
                <Text style={styles.requestMeta}>
                  Pending · {invite.court_name} · {formatSessionDateTime(invite.event_starts_at)}
                </Text>
                <Pressable
                  disabled={isBusy}
                  onPress={() => void handleCancelInvite(invite.id)}
                  style={styles.cancelLink}>
                  <Text style={styles.cancelLinkText}>
                    {isBusy ? 'Canceling…' : 'Cancel invite'}
                  </Text>
                </Pressable>
              </Card>
            );
          })}
        </View>
      ) : null}

      {accepted.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connected</Text>
          {accepted.map((request) => (
            <Card key={request.id}>
              <Text style={styles.requestName}>{request.other_display_name}</Text>
              <Text style={styles.requestMeta}>Connected · coordinate your next game</Text>
              <View style={styles.actionsRow}>
                <Pressable
                  onPress={() => router.push(playerInviteRoute(request.id))}
                  style={({ pressed }) => [styles.declineButton, pressed && styles.buttonPressed]}>
                  <Text style={styles.declineButtonText}>Invite to session</Text>
                </Pressable>
                <PrimaryButton
                  label="Message"
                  onPress={() => router.push(playerMessageRoute(request.id))}
                />
              </View>
            </Card>
          ))}
        </View>
      ) : null}
    </ScrollView>
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
    padding: spacing.xl,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: brand.background,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  errorText: {
    fontSize: 14,
    color: brand.danger,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: brand.text,
  },
  requestName: {
    fontSize: 17,
    fontWeight: '800',
    color: brand.text,
    marginBottom: 4,
  },
  requestMeta: {
    fontSize: 14,
    lineHeight: 20,
    color: brand.muted,
    marginBottom: spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  declineButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: brand.borderStrong,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: brand.text,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  cancelLink: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  cancelLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: brand.danger,
  },
});
