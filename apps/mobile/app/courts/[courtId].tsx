import { zodResolver } from '@hookform/resolvers/zod';
import {
  COURT_TYPES,
  COURT_TYPE_LABELS,
  SESSION_TYPE_LABELS,
  updateCourtSchema,
  type CourtType,
  type UpdateCourtInput,
} from '@pickleballcx/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { CourtMapView } from '@/components/ui/CourtMapView';
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
import { useCourt, useUpdateCourt } from '@/hooks/useCourts';
import { useCourtEvents } from '@/hooks/useEvents';
import { formatSessionDateTime } from '@/lib/format';
import { hasValidCoordinates } from '@/lib/geo';
import { newSessionRoute, sessionRoute } from '@/lib/routes';
import { useAuth } from '@/providers/AuthProvider';

export default function CourtDetailScreen() {
  const { courtId } = useLocalSearchParams<{ courtId: string }>();
  const id = courtId!;
  const { profile } = useAuth();
  const isAppAdmin = profile?.is_app_admin ?? false;
  const { data: court, isLoading, error } = useCourt(id);
  const { data: courtEvents, isLoading: sessionsLoading } = useCourtEvents(id);
  const updateCourt = useUpdateCourt(id);
  const [formError, setFormError] = useState<string>();
  const [isEditing, setIsEditing] = useState(false);
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<UpdateCourtInput>({
    resolver: zodResolver(updateCourtSchema),
    defaultValues: {
      name: '',
      address: '',
      courtType: undefined,
      numCourts: 1,
      notes: '',
    },
  });

  useEffect(() => {
    if (!court) return;
    reset({
      name: court.name,
      address: court.address,
      courtType: court.court_type,
      numCourts: court.num_courts,
      notes: court.notes ?? '',
    });
  }, [court, reset]);

  const onSubmit = handleSubmit(
    async (values) => {
      setFormError(undefined);

      try {
        await updateCourt.mutateAsync({
          name: values.name,
          address: values.address,
          courtType: values.courtType,
          numCourts: values.numCourts,
          notes: values.notes,
        });
        setIsEditing(false);
      } catch (submitError) {
        setFormError(submitError instanceof Error ? submitError.message : 'Could not update court');
      }
    },
    () => {
      setFormError('Please fill in all required fields.');
    },
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={brand.accent} />
      </View>
    );
  }

  if (error || !court) {
    return (
      <FormScreenContainer>
        <Title>Court not found</Title>
        <ErrorText message={error?.message ?? 'This court may have been removed.'} />
      </FormScreenContainer>
    );
  }

  if (!isEditing) {
    return (
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <FormScreenContainer>
          <Title>{court.name}</Title>
          <Subtitle>{court.address}</Subtitle>

          {hasValidCoordinates({ lat: court.lat, lng: court.lng }) ? (
            <CourtMapView lat={court.lat} lng={court.lng} height={280} interactive />
          ) : (
            <Text style={styles.mapPending}>
              Map pin not set yet — edit and re-save the court address to geocode coordinates.
            </Text>
          )}

          <View style={styles.detailCard}>
            <DetailRow label="Type" value={COURT_TYPE_LABELS[court.court_type]} />
            <DetailRow
              label="Courts available"
              value={`${court.num_courts} court${court.num_courts === 1 ? '' : 's'}`}
            />
            {court.notes ? <DetailRow label="Notes" value={court.notes} /> : null}
          </View>

          <Text style={styles.sectionTitle}>Upcoming sessions</Text>
          {sessionsLoading ? (
            <ActivityIndicator color={brand.accent} style={styles.sessionsSpinner} />
          ) : courtEvents?.length ? (
            <View style={styles.sessionList}>
              {courtEvents.map((event) => (
                <Pressable
                  key={event.id}
                  onPress={() => router.push(sessionRoute(event.id))}
                  style={({ pressed }) => [styles.sessionRow, pressed && styles.sessionRowPressed]}>
                  <Text style={styles.sessionWhen}>{formatSessionDateTime(event.starts_at)}</Text>
                  <Text style={styles.sessionType}>{SESSION_TYPE_LABELS[event.session_type]}</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <Text style={styles.emptySessions}>No upcoming sessions at this court yet.</Text>
          )}

          <PrimaryButton
            label="Schedule session"
            onPress={() => router.push(newSessionRoute(court.id))}
          />

          {isAppAdmin ? (
            <Pressable onPress={() => setIsEditing(true)} style={styles.editLink}>
              <Text style={styles.editLinkText}>Edit court</Text>
            </Pressable>
          ) : null}
        </FormScreenContainer>
      </ScrollView>
    );
  }

  if (!isAppAdmin) {
    return (
      <FormScreenContainer>
        <Title>Admin only</Title>
        <Subtitle>Only app admins can edit courts.</Subtitle>
        <PrimaryButton label="Go back" onPress={() => router.back()} />
      </FormScreenContainer>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
      <FormScreenContainer>
        <Title>Edit court</Title>
        <Subtitle>Update venue details in the global catalog.</Subtitle>
        <ErrorText message={formError} />
        <ErrorText message={errors.courtType?.message ?? errors.numCourts?.message} />

        <FieldLabel>Court or venue name</FieldLabel>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <>
              <TextField value={value} onChangeText={onChange} autoCapitalize="words" />
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
              <TextField value={value} onChangeText={onChange} autoCapitalize="words" />
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
                multiline
                textAlignVertical="top"
              />
              <ErrorText message={error?.message} />
            </>
          )}
        />

        <PrimaryButton
          label={isSubmitting || updateCourt.isPending ? 'Saving…' : 'Save changes'}
          onPress={onSubmit}
          disabled={isSubmitting || updateCourt.isPending}
        />
        <Pressable onPress={() => setIsEditing(false)} style={styles.cancelLink}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </FormScreenContainer>
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.background,
  },
  detailCard: {
    backgroundColor: brand.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: brand.border,
    marginBottom: 24,
    gap: 16,
  },
  detailRow: {
    gap: 4,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: brand.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    color: brand.text,
    lineHeight: 22,
  },
  mapPending: {
    fontSize: 14,
    lineHeight: 20,
    color: brand.muted,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: brand.muted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  sessionsSpinner: {
    marginBottom: 16,
  },
  sessionList: {
    gap: 10,
    marginBottom: 20,
  },
  sessionRow: {
    backgroundColor: brand.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: brand.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  sessionRowPressed: {
    opacity: 0.85,
  },
  sessionWhen: {
    fontSize: 16,
    fontWeight: '700',
    color: brand.text,
  },
  sessionType: {
    fontSize: 14,
    color: brand.muted,
    marginTop: 4,
  },
  emptySessions: {
    fontSize: 14,
    lineHeight: 20,
    color: brand.muted,
    marginBottom: 20,
  },
  editLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  editLinkText: {
    color: brand.muted,
    fontSize: 15,
    fontWeight: '600',
  },
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
  cancelLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  cancelText: {
    color: brand.muted,
    fontSize: 15,
    fontWeight: '600',
  },
});
