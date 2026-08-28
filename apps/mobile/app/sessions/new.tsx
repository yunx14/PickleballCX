import { zodResolver } from '@hookform/resolvers/zod';
import { createEventSchema, type CreateEventInput } from '@pickleballcx/shared';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { SessionForm } from '@/components/sessions/SessionForm';
import { PrimaryButton, FormScreenContainer, Subtitle, Title } from '@/components/ui/Screen';
import { brand } from '@/constants/brand';
import { useCourt } from '@/hooks/useCourts';
import { useCreateEvent } from '@/hooks/useEvents';
import { mapTabRoute, sessionRoute } from '@/lib/routes';

export default function NewSessionScreen() {
  const { courtId } = useLocalSearchParams<{ courtId?: string }>();
  const { data: court, isLoading: courtLoading, error: courtError } = useCourt(courtId ?? '');
  const createEvent = useCreateEvent();
  const [formError, setFormError] = useState<string>();

  const defaultStart = new Date();
  defaultStart.setMinutes(0, 0, 0);
  defaultStart.setHours(defaultStart.getHours() + 2);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<CreateEventInput>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      courtId: courtId ?? '',
      startsAt: defaultStart,
      sessionType: undefined,
      maxPlayers: undefined,
      description: '',
    },
  });

  useEffect(() => {
    if (courtId) {
      reset((values) => ({ ...values, courtId }));
    }
  }, [courtId, reset]);

  const onSubmit = handleSubmit(
    async (values) => {
      setFormError(undefined);

      try {
        const { id } = await createEvent.mutateAsync({
          courtId: values.courtId,
          startsAt: values.startsAt,
          sessionType: values.sessionType,
          maxPlayers: values.maxPlayers,
          skillMin: values.skillMin,
          skillMax: values.skillMax,
          description: values.description,
        });

        router.push(sessionRoute(id));
      } catch (error) {
        setFormError(error instanceof Error ? error.message : 'Could not create session');
      }
    },
    () => {
      // Field-level messages are listed by the summary, so drop any stale server error.
      setFormError(undefined);
    },
  );

  if (!courtId) {
    return <Redirect href={mapTabRoute} />;
  }

  if (courtLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={brand.accent} />
      </View>
    );
  }

  if (courtError || !court) {
    return (
      <FormScreenContainer>
        <Title>Court not found</Title>
        <Subtitle>Pick a court on the map to schedule a session.</Subtitle>
        <PrimaryButton label="Open map" onPress={() => router.replace(mapTabRoute)} />
      </FormScreenContainer>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
      <FormScreenContainer>
        <SessionForm
          title="Schedule session"
          subtitle="Anyone nearby can discover this session and RSVP."
          lockedCourt={court}
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
});
