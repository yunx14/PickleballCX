import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PrimaryButton } from '@/components/ui/Screen';
import { brand } from '@/constants/brand';
import { border, radius, spacing } from '@/constants/theme';
import { useMatchRequests } from '@/hooks/useMatchRequests';
import {
  useCreateSessionInvite,
  useHostSessions,
} from '@/hooks/useSessionInvites';
import { formatSessionDateTime } from '@/lib/format';
import { newSessionWithInviteRoute, playerRequestsRoute } from '@/lib/routes';

export default function PlayerInviteScreen() {
  const { matchRequestId } = useLocalSearchParams<{ matchRequestId: string }>();
  const { data: matchRequests } = useMatchRequests();
  const { data: hostSessions, isLoading, error } = useHostSessions();
  const createInvite = useCreateSessionInvite();
  const [selectedEventId, setSelectedEventId] = useState<string>();
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState<string>();

  const matchRequest = useMemo(
    () => (matchRequests ?? []).find((request) => request.id === matchRequestId),
    [matchRequestId, matchRequests],
  );

  const handleSendInvite = async () => {
    if (!matchRequest || !selectedEventId) {
      setFormError('Select a session to invite them to.');
      return;
    }

    setFormError(undefined);

    try {
      await createInvite.mutateAsync({
        eventId: selectedEventId,
        invitedUserId: matchRequest.other_user_id,
        message,
      });
      router.replace(playerRequestsRoute);
    } catch (inviteError) {
      const errorMessage =
        inviteError instanceof Error ? inviteError.message : 'Could not send invite';
      setFormError(
        errorMessage.includes('session_invites_one_pending_event_user')
          ? 'You already have a pending invite to this player for that session.'
          : errorMessage,
      );
    }
  };

  if (!matchRequestId) {
    return (
      <View style={styles.container}>
        <EmptyState title="Invite unavailable" body="Open this screen from a connected player." />
      </View>
    );
  }

  if (!matchRequest) {
    return (
      <View style={styles.container}>
        <EmptyState title="Invite unavailable" body="This match connection could not be found." />
      </View>
    );
  }

  if (matchRequest.status !== 'accepted') {
    return (
      <View style={styles.container}>
        <EmptyState
          title="Not connected yet"
          body="Accept the match request before inviting this player to a session."
        />
      </View>
    );
  }

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
        <EmptyState title="Could not load sessions" body={error.message} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Text style={styles.intro}>
        Invite {matchRequest.other_display_name} to one of your upcoming sessions.
      </Text>

      {hostSessions?.length === 0 ? (
        <Card>
          <Text style={styles.emptyTitle}>No upcoming sessions</Text>
          <Text style={styles.emptyBody}>
            Create a session first, then come back to send the invite.
          </Text>
          <PrimaryButton
            label="Create session"
            onPress={() => router.push(newSessionWithInviteRoute(matchRequestId))}
          />
        </Card>
      ) : (
        <>
          <View style={styles.sessionList}>
            {hostSessions?.map((sessionOption) => {
              const selected = selectedEventId === sessionOption.id;
              return (
                <Pressable
                  key={sessionOption.id}
                  onPress={() => setSelectedEventId(sessionOption.id)}
                  style={({ pressed }) => [
                    styles.sessionOption,
                    selected && styles.sessionOptionSelected,
                    pressed && styles.sessionOptionPressed,
                  ]}>
                  <Text style={styles.sessionTitle}>{sessionOption.court_name}</Text>
                  <Text style={styles.sessionMeta}>
                    {formatSessionDateTime(sessionOption.starts_at)}
                    {sessionOption.group_name ? ` · ${sessionOption.group_name}` : ' · Open session'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>Optional note</Text>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Looking for a fourth…"
            placeholderTextColor={brand.muted}
            multiline
            maxLength={500}
          />

          {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

          <PrimaryButton
            label={createInvite.isPending ? 'Sending…' : 'Send invite'}
            onPress={() => void handleSendInvite()}
            disabled={createInvite.isPending || !selectedEventId}
          />

          <Pressable
            onPress={() => router.push(newSessionWithInviteRoute(matchRequestId))}
            style={styles.secondaryLink}>
            <Text style={styles.secondaryLinkText}>Create a new session instead</Text>
          </Pressable>
        </>
      )}
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
  intro: {
    fontSize: 15,
    lineHeight: 22,
    color: brand.muted,
  },
  sessionList: {
    gap: spacing.sm,
  },
  sessionOption: {
    borderWidth: border.width,
    borderColor: brand.borderStrong,
    borderRadius: radius.lg,
    backgroundColor: brand.surface,
    padding: spacing.lg,
    gap: 4,
  },
  sessionOptionSelected: {
    borderColor: brand.accent,
    backgroundColor: brand.accentSurface,
  },
  sessionOptionPressed: {
    opacity: 0.9,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: brand.text,
  },
  sessionMeta: {
    fontSize: 14,
    color: brand.muted,
    lineHeight: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: brand.text,
  },
  input: {
    backgroundColor: brand.surface,
    borderWidth: border.width,
    borderColor: brand.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: brand.text,
    minHeight: 72,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 14,
    color: brand.danger,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: brand.text,
    marginBottom: spacing.xs,
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 20,
    color: brand.muted,
    marginBottom: spacing.lg,
  },
  secondaryLink: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
  },
  secondaryLinkText: {
    fontSize: 14,
    fontWeight: '700',
    color: brand.accent,
  },
});
