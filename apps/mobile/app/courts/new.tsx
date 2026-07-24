import { zodResolver } from '@hookform/resolvers/zod';
import {
  COURT_TYPES,
  COURT_TYPE_LABELS,
  createCourtSchema,
  type CourtType,
  type CreateCourtInput,
} from '@pickleballcx/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  ErrorText,
  FieldLabel,
  PrimaryButton,
  FormScreenContainer,
  Subtitle,
  TextField,
  Title,
} from '@/components/ui/Screen';
import { brand } from '@/constants/brand';
import { useCreateCourt } from '@/hooks/useCourts';
import { courtRoute } from '@/lib/routes';
import { useAuth } from '@/providers/AuthProvider';

export default function NewCourtScreen() {
  const { profile } = useAuth();
  const isAppAdmin = profile?.is_app_admin ?? false;
  const [formError, setFormError] = useState<string>();
  const createCourt = useCreateCourt();
  const {
    control,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<CreateCourtInput>({
    resolver: zodResolver(createCourtSchema),
    defaultValues: {
      name: '',
      address: '',
      courtType: undefined,
      numCourts: 1,
      notes: '',
    },
  });

  const onSubmit = handleSubmit(
    async (values) => {
      setFormError(undefined);

      try {
        const court = await createCourt.mutateAsync({
          name: values.name,
          address: values.address,
          courtType: values.courtType,
          numCourts: values.numCourts,
          notes: values.notes,
        });
        router.replace(courtRoute(court.id));
      } catch (error) {
        setFormError(error instanceof Error ? error.message : 'Could not save court');
      }
    },
    () => {
      setFormError('Please fill in all required fields.');
    },
  );

  if (!isAppAdmin) {
    return (
      <FormScreenContainer>
        <Title>Admin only</Title>
        <Subtitle>Only app admins can add courts to the global catalog.</Subtitle>
        <PrimaryButton label="Go back" onPress={() => router.back()} />
      </FormScreenContainer>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
      <FormScreenContainer>
        <Title>Add a court</Title>
        <Subtitle>
          Add a venue to the global catalog. Map coordinates will be added when map integration ships.
        </Subtitle>
        <ErrorText message={formError} />
        <ErrorText message={errors.courtType?.message ?? errors.numCourts?.message} />

        <FieldLabel>Court or venue name</FieldLabel>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <>
              <TextField
                value={value}
                onChangeText={onChange}
                placeholder="Riverside Park courts 3–4"
                autoCapitalize="words"
              />
              <ErrorText message={error?.message} />
            </>
          )}
        />

        <FieldLabel>Address</FieldLabel>
        <Controller
          control={control}
          name="address"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <>
              <TextField
                value={value}
                onChangeText={onChange}
                placeholder="123 Main St, Your City"
                autoCapitalize="words"
              />
              <ErrorText message={error?.message} />
            </>
          )}
        />

        <FieldLabel>Court type</FieldLabel>
        <Controller
          control={control}
          name="courtType"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <>
              <CourtTypePicker value={value} onChange={onChange} />
              <ErrorText message={error?.message} />
            </>
          )}
        />

        <FieldLabel>Number of courts</FieldLabel>
        <Controller
          control={control}
          name="numCourts"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <>
              <TextInput
                style={styles.input}
                value={String(value ?? '')}
                onChangeText={(text) => onChange(text.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                placeholder="4"
                placeholderTextColor={brand.muted}
              />
              <ErrorText message={error?.message} />
            </>
          )}
        />

        <FieldLabel>Notes (optional)</FieldLabel>
        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <>
              <TextInput
                style={[styles.input, styles.notesInput]}
                value={value ?? ''}
                onChangeText={onChange}
                placeholder="Gate code, which courts to use, lights off at 9pm…"
                placeholderTextColor={brand.muted}
                multiline
                textAlignVertical="top"
              />
              <ErrorText message={error?.message} />
            </>
          )}
        />

        <PrimaryButton
          label={isSubmitting || createCourt.isPending ? 'Saving…' : 'Save court'}
          onPress={onSubmit}
          disabled={isSubmitting || createCourt.isPending}
        />
      </FormScreenContainer>
    </ScrollView>
  );
}

function CourtTypePicker({
  value,
  onChange,
}: {
  value?: CourtType;
  onChange: (value: CourtType) => void;
}) {
  return (
    <>
      {COURT_TYPES.map((type) => {
        const selected = value === type;
        return (
          <Pressable
            key={type}
            onPress={() => onChange(type)}
            style={[styles.option, selected && styles.optionSelected]}>
            <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
              {COURT_TYPE_LABELS[type]}
            </Text>
          </Pressable>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: brand.surface,
    borderWidth: 1,
    borderColor: brand.borderStrong,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: brand.text,
    marginBottom: 16,
  },
  notesInput: {
    minHeight: 100,
    paddingTop: 14,
  },
  option: {
    backgroundColor: brand.surface,
    borderWidth: 1,
    borderColor: brand.borderStrong,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  optionSelected: {
    borderColor: brand.accent,
    backgroundColor: brand.accentSurface,
  },
  optionText: {
    fontSize: 16,
    color: brand.muted,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: brand.accent,
    fontWeight: '800',
  },
});
