import { zodResolver } from '@hookform/resolvers/zod';
import { createEventSchema, type CreateEventInput } from '@pickleballcx/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SessionForm } from '@/components/sessions/SessionForm';
import { PrimaryButton, FormScreenContainer, Subtitle, Title } from '@/components/ui/Screen';
import { brand } from '@/constants/brand';
import { useCourts } from '@/hooks/useCourts';
import { useCreateEvent } from '@/hooks/useEvents';
import { useGroups } from '@/hooks/useGroups';
import { useMatchRequests } from '@/hooks/useMatchRequests';
import { useCreateSessionInvite } from '@/hooks/useSessionInvites';
import { courtsRoute, playerRequestsRoute, sessionRoute } from '@/lib/routes';

export default function NewSessionScreen() {
  const { groupId: presetGroupId, inviteMatchRequestId } = useLocalSearchParams<{
    groupId?: string;
    inviteMatchRequestId?: string;
  }>();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(presetGroupId ?? null);
  const [limitToGroup, setLimitToGroup] = useState(!!presetGroupId);
  const { data: courts, isLoading: courtsLoading } = useCourts();
  const { data: groups } = useGroups();
  const createEvent = useCreateEvent();
  const createSessionInvite = useCreateSessionInvite();
  const { data: matchRequests } = useMatchRequests();
  const [formError, setFormError] = useState<string>();

  const inviteTarget = useMemo(() => {
    if (!inviteMatchRequestId) return null;
    return (matchRequests ?? []).find((request) => request.id === inviteMatchRequestId) ?? null;
  }, [inviteMatchRequestId, matchRequests]);

  const selectedGroup = useMemo(
    () => groups?.find((group) => group.id === selectedGroupId) ?? null,
    [groups, selectedGroupId],
  );

  const defaultStart = new Date();
  defaultStart.setMinutes(0, 0, 0);
  defaultStart.setHours(defaultStart.getHours() + 2);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<CreateEventInput>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      courtId: '',
      startsAt: defaultStart,
      sessionType: undefined,
      maxPlayers: undefined,
      description: '',
    },
  });

  const onSubmit = handleSubmit(
    async (values) => {
      setFormError(undefined);

      if (limitToGroup && !selectedGroupId) {
        setFormError('Select a group or turn off group-only visibility.');
        return;
      }

      try {
        const { id } = await createEvent.mutateAsync({
          groupId: limitToGroup ? selectedGroupId : null,
          courtId: values.courtId,
          startsAt: values.startsAt,
          sessionType: values.sessionType,
          maxPlayers: values.maxPlayers,
          skillMin: values.skillMin,
          skillMax: values.skillMax,
          description: values.description,
        });

        if (inviteTarget?.status === 'accepted') {
          await createSessionInvite.mutateAsync({
            eventId: id,
            invitedUserId: inviteTarget.other_user_id,
          });
          router.replace(playerRequestsRoute);
          return;
        }

        router.push(sessionRoute(id));
      } catch (error) {
        setFormError(error instanceof Error ? error.message : 'Could not create session');
      }
    },
    () => {
      setFormError('Please fill in all required fields.');
    },
  );

  if (courtsLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={brand.accent} />
      </View>
    );
  }

  if (!courts?.length) {
    return (
      <FormScreenContainer>
        <Title>Add a court first</Title>
        <Subtitle>
          Sessions need a court from the global catalog. Ask an app admin to add venues, or add one
          yourself if you have admin access.
        </Subtitle>
        <PrimaryButton label="Browse courts" onPress={() => router.push(courtsRoute)} />
        <PrimaryButton label="Go back" onPress={() => router.back()} />
      </FormScreenContainer>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <FormScreenContainer>
        {inviteTarget ? (
          <Subtitle>
            Create a session for {inviteTarget.other_display_name}. We&apos;ll send them an invite
            when you save.
          </Subtitle>
        ) : null}
        <View style={styles.groupSection}>
          <Text style={styles.sectionTitle}>Visibility</Text>
          <Pressable
            onPress={() => {
              setLimitToGroup(false);
              setSelectedGroupId(null);
            }}
            style={[styles.option, !limitToGroup && styles.optionSelected]}>
            <Text style={[styles.optionText, !limitToGroup && styles.optionTextSelected]}>
              Public — anyone can discover and RSVP
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setLimitToGroup(true);
              if (presetGroupId) setSelectedGroupId(presetGroupId);
            }}
            style={[styles.option, limitToGroup && styles.optionSelected]}>
            <Text style={[styles.optionText, limitToGroup && styles.optionTextSelected]}>
              Group only — members of a group can see it
            </Text>
          </Pressable>

          {limitToGroup ? (
            groups?.length ? (
              <>
                <Text style={styles.groupPickerLabel}>Select group</Text>
                {groups.map((group) => {
                  const selected = selectedGroupId === group.id;
                  return (
                    <Pressable
                      key={group.id}
                      onPress={() => setSelectedGroupId(group.id)}
                      style={[styles.groupOption, selected && styles.optionSelected]}>
                      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                        {group.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </>
            ) : (
              <Text style={styles.noGroups}>
                You are not in any groups yet. Create or join a group, or schedule a public session
                instead.
              </Text>
            )
          ) : null}

          {limitToGroup && selectedGroup ? (
            <Text style={styles.groupHint}>Posting to {selectedGroup.name}</Text>
          ) : null}
        </View>

        <SessionForm
          title="Schedule session"
          subtitle={
            limitToGroup
              ? 'Pick a court, time, and session type. Only your group will see this session.'
              : 'Pick a court, time, and session type. This open session will be visible to everyone.'
          }
          courts={courts}
          control={control}
          errors={errors}
          formError={formError}
          submitLabel="Create session"
          pendingLabel="Creating…"
          isSubmitting={isSubmitting || createEvent.isPending}
          onSubmit={onSubmit}
        />
      </FormScreenContainer>
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
  groupSection: {
    marginBottom: 24,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: brand.text,
    marginBottom: 4,
  },
  option: {
    backgroundColor: brand.surface,
    borderWidth: 1,
    borderColor: brand.borderStrong,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  groupOption: {
    backgroundColor: brand.surface,
    borderWidth: 1,
    borderColor: brand.borderStrong,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  optionSelected: {
    borderColor: brand.accent,
    backgroundColor: brand.accentSurface,
  },
  optionText: {
    fontSize: 15,
    color: brand.muted,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: brand.accent,
    fontWeight: '800',
  },
  groupPickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: brand.muted,
    marginTop: 8,
  },
  groupHint: {
    fontSize: 14,
    color: brand.accent,
    fontWeight: '600',
  },
  noGroups: {
    fontSize: 14,
    lineHeight: 20,
    color: brand.muted,
  },
});
