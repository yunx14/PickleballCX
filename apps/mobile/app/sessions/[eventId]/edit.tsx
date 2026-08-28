import { zodResolver } from '@hookform/resolvers/zod';
import { createEventSchema, type CreateEventInput } from '@pickleballcx/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SessionForm } from '@/components/sessions/SessionForm';
import { PrimaryButton, FormScreenContainer, Subtitle, Title } from '@/components/ui/Screen';
import { brand } from '@/constants/brand';
import { useCourt } from '@/hooks/useCourts';
import { useEvent, useUpdateEvent } from '@/hooks/useEvents';
import { useAuth } from '@/providers/AuthProvider';

export default function EditSessionScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const id = eventId!;
  const { session } = useAuth();
  const { data: event, isLoading: eventLoading, error: eventError } = useEvent(id);
  const { data: court, isLoading: courtLoading } = useCourt(event?.court_id ?? '');
  const updateEvent = useUpdateEvent(id);
  const [formError, setFormError] = useState<string>();

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<CreateEventInput>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      courtId: '',
      startsAt: new Date(),
      sessionType: undefined,
      maxPlayers: undefined,
      description: '',
    },
  });

  useEffect(() => {
    if (!event) return;
    reset({
      courtId: event.court_id,
      startsAt: new Date(event.starts_at),
      sessionType: event.session_type,
      maxPlayers: event.max_players ?? undefined,
      skillMin: event.skill_min ?? undefined,
      skillMax: event.skill_max ?? undefined,
      description: event.description ?? '',
    });
  }, [event, reset]);

  const onSubmit = handleSubmit(
    async (values) => {
      setFormError(undefined);

      try {
        await updateEvent.mutateAsync({
          courtId: values.courtId,
          startsAt: values.startsAt,
          sessionType: values.sessionType,
          maxPlayers: values.maxPlayers,
          skillMin: values.skillMin,
          skillMax: values.skillMax,
          description: values.description,
        });
        router.back();
      } catch (error) {
        setFormError(error instanceof Error ? error.message : 'Could not update session');
      }
    },
    () => {
      // Field-level messages are listed by the summary, so drop any stale server error.
      setFormError(undefined);
    },
  );

  if (eventLoading || courtLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={brand.accent} />
      </View>
    );
  }

  if (eventError || !event) {
    return (
      <FormScreenContainer>
        <Title>Session not found</Title>
        <Subtitle>{eventError?.message ?? 'This session may have been removed.'}</Subtitle>
        <PrimaryButton label="Go back" onPress={() => router.back()} />
      </FormScreenContainer>
    );
  }

  if (event.created_by !== session?.user.id) {
    return (
      <FormScreenContainer>
        <Title>Cannot edit session</Title>
        <Subtitle>Only the person who created this session can edit it.</Subtitle>
        <PrimaryButton label="Go back" onPress={() => router.back()} />
      </FormScreenContainer>
    );
  }

  if (!court) {
    return (
      <FormScreenContainer>
        <Title>Court not found</Title>
        <Subtitle>This session’s court is no longer available.</Subtitle>
        <PrimaryButton label="Go back" onPress={() => router.back()} />
      </FormScreenContainer>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
      <FormScreenContainer>
        <SessionForm
          title="Edit session"
          subtitle="Update the time or session details."
          lockedCourt={court}
          control={control}
          errors={errors}
          formError={formError}
          submitLabel="Save changes"
          pendingLabel="Saving…"
          isSubmitting={isSubmitting || updateEvent.isPending}
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
});
