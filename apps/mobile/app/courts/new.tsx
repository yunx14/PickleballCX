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

import { FormErrorSummary, type FieldLabels } from '@/components/ui/FormErrorSummary';
import {
  ErrorText,
  FieldLabel,
  PrimaryButton,
  FormScreenContainer,
  Subtitle,
  TextField,
  Title,
  invalidInputStyle,
} from '@/components/ui/Screen';
import { brand } from '@/constants/brand';
import { useCreateCourt } from '@/hooks/useCourts';
import { courtRoute } from '@/lib/routes';
import { useAuth } from '@/providers/AuthProvider';

const FIELD_LABELS: FieldLabels = {
  name: 'Court or venue name',
  address: 'Address',
  courtType: 'Court type',
  numCourts: 'Number of courts',
  notes: 'Notes',
};

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
      // Field-level messages are listed by the summary, so drop any stale server error.
      setFormError(undefined);
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
        <FormErrorSummary formError={formError} errors={errors} labels={FIELD_LABELS} />

        <FieldLabel invalid={Boolean(errors.name)}>Court or venue name</FieldLabel>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <TextField
              value={value}
              onChangeText={onChange}
              placeholder="Riverside Park courts 3–4"
              autoCapitalize="words"
              error={error?.message}
              accessibilityLabel="Court or venue name"
            />
          )}
        />

        <FieldLabel invalid={Boolean(errors.address)}>Address</FieldLabel>
        <Controller
          control={control}
          name="address"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <TextField
              value={value}
              onChangeText={onChange}
              placeholder="123 Main St, Your City"
              autoCapitalize="words"
              error={error?.message}
              accessibilityLabel="Address"
            />
          )}
        />

        <FieldLabel invalid={Boolean(errors.courtType)}>Court type</FieldLabel>
        <Controller
          control={control}
          name="courtType"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <>
              <CourtTypePicker value={value} onChange={onChange} invalid={Boolean(error)} />
              <ErrorText message={error?.message} />
            </>
          )}
        />

        <FieldLabel invalid={Boolean(errors.numCourts)}>Number of courts</FieldLabel>
        <Controller
          control={control}
          name="numCourts"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <>
              <TextInput
                style={[styles.input, Boolean(error) && invalidInputStyle]}
                value={String(value ?? '')}
                onChangeText={(text) => onChange(text.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                placeholder="4"
                placeholderTextColor={brand.muted}
                accessibilityLabel="Number of courts"
              />
              <ErrorText message={error?.message} />
            </>
          )}
        />

        <FieldLabel invalid={Boolean(errors.notes)}>Notes (optional)</FieldLabel>
        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <>
              <TextInput
                style={[styles.input, styles.notesInput, Boolean(error) && invalidInputStyle]}
                value={value ?? ''}
                onChangeText={onChange}
                placeholder="Gate code, which courts to use, lights off at 9pm…"
                placeholderTextColor={brand.muted}
                multiline
                textAlignVertical="top"
                accessibilityLabel="Notes"
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
  invalid,
}: {
  value?: CourtType;
  onChange: (value: CourtType) => void;
  invalid?: boolean;
}) {
  return (
    <>
      {COURT_TYPES.map((type) => {
        const selected = value === type;
        return (
          <Pressable
            key={type}
            onPress={() => onChange(type)}
            style={[
              styles.option,
              invalid && !selected && invalidInputStyle,
              selected && styles.optionSelected,
            ]}>
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
