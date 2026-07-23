import { zodResolver } from '@hookform/resolvers/zod';
import { createEventSchema, type CreateEventInput } from '@pickleballcx/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SessionForm } from '@/components/sessions/SessionForm';
import { PrimaryButton, ScreenContainer, Subtitle, Title } from '@/components/ui/Screen';
import { brand } from '@/constants/brand';
import { useCourts } from '@/hooks/useCourts';
import { useEvent, useUpdateEvent } from '@/hooks/useEvents';
import { useAuth } from '@/providers/AuthProvider';

export default function EditSessionScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const id = eventId!;
  const { session } = useAuth();
  const { data: event, isLoading: eventLoading, error: eventError } = useEvent(id);
  const groupId = event?.group_id ?? null;
  const { data: courts, isLoading: courtsLoading } = useCourts();
  const updateEvent = useUpdateEvent(id, groupId);
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
      setFormError('Please fill in all required fields.');
    },
  );

  if (eventLoading || courtsLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={brand.green700} />
      </View>
    );
  }

  if (eventError || !event) {
    return (
      <ScreenContainer>
        <Title>Session not found</Title>
        <Subtitle>{eventError?.message ?? 'This session may have been removed.'}</Subtitle>
        <PrimaryButton label="Go back" onPress={() => router.back()} />
      </ScreenContainer>
    );
  }

  if (event.created_by !== session?.user.id) {
    return (
      <ScreenContainer>
        <Title>Cannot edit session</Title>
        <Subtitle>Only the person who created this session can edit it.</Subtitle>
        <PrimaryButton label="Go back" onPress={() => router.back()} />
      </ScreenContainer>
    );
  }

  if (!courts?.length) {
    return (
      <ScreenContainer>
        <Title>Add a court first</Title>
        <Subtitle>This group needs at least one court before you can edit the session.</Subtitle>
        <PrimaryButton label="Go back" onPress={() => router.back()} />
      </ScreenContainer>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
      <ScreenContainer>
        <SessionForm
          title="Edit session"
          subtitle="Update the court, time, or session details."
          courts={courts}
          control={control}
          errors={errors}
          formError={formError}
          submitLabel="Save changes"
          pendingLabel="Saving…"
          isSubmitting={isSubmitting || updateEvent.isPending}
          onSubmit={onSubmit}
        />
      </ScreenContainer>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.sand,
  },
});
