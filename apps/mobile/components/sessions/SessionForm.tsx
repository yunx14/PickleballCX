import DateTimePicker from '@react-native-community/datetimepicker';
import {
  SESSION_DURATION_OPTIONS,
  SESSION_TYPES,
  SESSION_TYPE_LABELS,
  SKILL_LEVELS,
  SKILL_LEVEL_LABELS,
  formatDurationLabel,
  type CreateEventInput,
  type SessionType,
  type SkillLevel,
} from '@pickleballcx/shared';
import { createElement, useEffect, useState } from 'react';
import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { FormErrorSummary, type FieldLabels } from '@/components/ui/FormErrorSummary';
import {
  ErrorText,
  FieldLabel,
  PrimaryButton,
  Subtitle,
  Title,
  invalidInputStyle,
} from '@/components/ui/Screen';
import { brand } from '@/constants/brand';
import type { Court } from '@/hooks/useCourts';
import { formatSessionDateTime } from '@/lib/format';

const FIELD_LABELS: FieldLabels = {
  courtId: 'Court',
  startsAt: 'Date & time',
  durationMinutes: 'Length',
  sessionType: 'Session type',
  maxPlayers: 'Max players',
  skillMin: 'Minimum skill',
  skillMax: 'Maximum skill',
  description: 'Description',
};

function mergeDatePart(current: Date, picked: Date): Date {
  const merged = new Date(current);
  merged.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
  return merged;
}

function mergeTimePart(current: Date, picked: Date): Date {
  const merged = new Date(current);
  merged.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
  return merged;
}

export function SessionForm({
  title,
  subtitle,
  lockedCourt,
  control,
  errors,
  formError,
  submitLabel,
  pendingLabel,
  isSubmitting,
  onSubmit,
}: {
  title: string;
  subtitle: string;
  lockedCourt: Court;
  control: Control<CreateEventInput>;
  errors: FieldErrors<CreateEventInput>;
  formError?: string;
  submitLabel: string;
  pendingLabel: string;
  isSubmitting: boolean;
  onSubmit: () => void;
}) {
  return (
    <>
      <Title>{title}</Title>
      <Subtitle>{subtitle}</Subtitle>
      <FormErrorSummary formError={formError} errors={errors} labels={FIELD_LABELS} />

      <FieldLabel invalid={Boolean(errors.courtId)}>Court</FieldLabel>
      <View style={[styles.lockedCourt, Boolean(errors.courtId) && invalidInputStyle]}>
        <Text style={styles.lockedCourtName}>{lockedCourt.name}</Text>
        <Text style={styles.lockedCourtAddress}>{lockedCourt.address}</Text>
      </View>
      <ErrorText message={errors.courtId?.message} />

      <FieldLabel invalid={Boolean(errors.startsAt)}>Date & time</FieldLabel>
      <Controller
        control={control}
        name="startsAt"
        render={({ field: { value, onChange }, fieldState: { error } }) => (
          <DateTimeDropdown value={value} onChange={onChange} invalid={Boolean(error)} />
        )}
      />
      <ErrorText message={errors.startsAt?.message} />

      <FieldLabel invalid={Boolean(errors.durationMinutes)}>How long</FieldLabel>
      <Controller
        control={control}
        name="durationMinutes"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <>
            <View style={styles.durationRow}>
              {SESSION_DURATION_OPTIONS.map((minutes) => {
                const selected = value === minutes;
                return (
                  <Pressable
                    key={minutes}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => onChange(minutes)}
                    style={[
                      styles.durationChip,
                      Boolean(error) && !selected && invalidInputStyle,
                      selected && styles.optionSelected,
                    ]}>
                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                      {formatDurationLabel(minutes)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <ErrorText message={error?.message} />
          </>
        )}
      />

      <FieldLabel invalid={Boolean(errors.sessionType)}>Session type</FieldLabel>
      <Controller
        control={control}
        name="sessionType"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <>
            <OptionPicker
              options={SESSION_TYPES}
              labels={SESSION_TYPE_LABELS}
              value={value}
              onChange={onChange}
              invalid={Boolean(error)}
            />
            <ErrorText message={error?.message} />
          </>
        )}
      />

      <FieldLabel invalid={Boolean(errors.maxPlayers)}>Max players (optional)</FieldLabel>
      <Controller
        control={control}
        name="maxPlayers"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <>
            <TextInput
              style={[styles.input, Boolean(error) && invalidInputStyle]}
              value={value === undefined ? '' : String(value)}
              onChangeText={(text) => {
                const trimmed = text.trim();
                onChange(trimmed === '' ? undefined : Number(trimmed));
              }}
              keyboardType="number-pad"
              placeholder="e.g. 12"
              placeholderTextColor={brand.muted}
              accessibilityLabel="Max players"
            />
            <ErrorText message={error?.message} />
          </>
        )}
      />

      <FieldLabel>Skill range (optional)</FieldLabel>
      <Controller
        control={control}
        name="skillMin"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <>
            <SkillPicker
              label="Minimum skill"
              value={value}
              onChange={onChange}
              allowClear
              invalid={Boolean(error)}
            />
            <ErrorText message={error?.message} />
          </>
        )}
      />
      <Controller
        control={control}
        name="skillMax"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <>
            <SkillPicker
              label="Maximum skill"
              value={value}
              onChange={onChange}
              allowClear
              invalid={Boolean(error)}
            />
            <ErrorText message={error?.message} />
          </>
        )}
      />

      <FieldLabel invalid={Boolean(errors.description)}>Description (optional)</FieldLabel>
      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <>
            <TextInput
              style={[styles.input, styles.notesInput, Boolean(error) && invalidInputStyle]}
              value={value ?? ''}
              onChangeText={onChange}
              placeholder="Bring extra balls, courts 3–4 in the back…"
              placeholderTextColor={brand.muted}
              multiline
              textAlignVertical="top"
              accessibilityLabel="Description"
            />
            <ErrorText message={error?.message} />
          </>
        )}
      />

      <PrimaryButton
        label={isSubmitting ? pendingLabel : submitLabel}
        onPress={onSubmit}
        disabled={isSubmitting}
      />
    </>
  );
}

function toDatetimeLocalValue(date: Date): string {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function DateTimeDropdown({
  value,
  onChange,
  invalid,
}: {
  value: Date;
  onChange: (date: Date) => void;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const apply = () => {
    onChange(draft);
    setOpen(false);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.dateButton,
          invalid && invalidInputStyle,
          pressed && styles.dropdownTriggerPressed,
        ]}>
        <Text style={styles.dateButtonText}>{formatSessionDateTime(value.toISOString())}</Text>
        <Text style={styles.dateButtonHint}>Tap to change date and time</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalBackdropPress} onPress={() => setOpen(false)} />
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Date & time</Text>

            {Platform.OS === 'web' ? (
              <View style={styles.webDateTimeInputWrap}>
                {createElement('input', {
                  type: 'datetime-local',
                  value: toDatetimeLocalValue(draft),
                  min: toDatetimeLocalValue(new Date()),
                  onChange: (event: { target: { value: string } }) => {
                    if (event.target.value) {
                      setDraft(new Date(event.target.value));
                    }
                  },
                  style: {
                    width: '100%',
                    fontSize: 16,
                    padding: 14,
                    borderRadius: 12,
                    border: `1px solid ${brand.borderStrong}`,
                    backgroundColor: brand.surface,
                    color: brand.text,
                    boxSizing: 'border-box',
                  },
                })}
              </View>
            ) : (
              <>
                <DateTimePicker
                  value={draft}
                  mode="date"
                  minimumDate={new Date()}
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={(_event, date) => {
                    if (date) setDraft((current) => mergeDatePart(current, date));
                  }}
                />
                <DateTimePicker
                  value={draft}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(_event, date) => {
                    if (date) setDraft((current) => mergeTimePart(current, date));
                  }}
                />
              </>
            )}

            <PrimaryButton label="Done" onPress={apply} />
            <Pressable onPress={() => setOpen(false)} style={styles.modalCancel}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

function OptionPicker<T extends string>({
  options,
  labels,
  value,
  onChange,
  invalid,
}: {
  options: readonly T[];
  labels: Record<T, string>;
  value?: T;
  onChange: (value: T) => void;
  invalid?: boolean;
}) {
  return (
    <>
      {options.map((option) => {
        const selected = value === option;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            style={[
              styles.option,
              invalid && !selected && invalidInputStyle,
              selected && styles.optionSelected,
            ]}>
            <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
              {labels[option]}
            </Text>
          </Pressable>
        );
      })}
    </>
  );
}

function SkillPicker({
  label,
  value,
  onChange,
  allowClear,
  invalid,
}: {
  label: string;
  value?: SkillLevel;
  onChange: (value?: SkillLevel) => void;
  allowClear?: boolean;
  invalid?: boolean;
}) {
  return (
    <View style={styles.skillBlock}>
      <Text style={[styles.skillLabel, invalid && styles.skillLabelInvalid]}>{label}</Text>
      {allowClear && !value ? <Text style={styles.skillHint}>Any</Text> : null}
      {SKILL_LEVELS.map((level) => {
        const selected = value === level;
        return (
          <Pressable
            key={level}
            onPress={() => onChange(selected && allowClear ? undefined : level)}
            style={[
              styles.option,
              invalid && !selected && invalidInputStyle,
              selected && styles.optionSelected,
            ]}>
            <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
              {SKILL_LEVEL_LABELS[level]}
            </Text>
          </Pressable>
        );
      })}
    </View>
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
    minHeight: 90,
    paddingTop: 14,
  },
  lockedCourt: {
    backgroundColor: brand.surface,
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  lockedCourtName: {
    fontSize: 16,
    fontWeight: '700',
    color: brand.text,
  },
  lockedCourtAddress: {
    fontSize: 13,
    color: brand.muted,
    marginTop: 2,
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
  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  durationChip: {
    backgroundColor: brand.surface,
    borderWidth: 1,
    borderColor: brand.borderStrong,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  optionSubtext: {
    fontSize: 13,
    color: brand.muted,
    marginTop: 4,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brand.surface,
    borderWidth: 1,
    borderColor: brand.borderStrong,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  dropdownTriggerPressed: {
    opacity: 0.85,
  },
  dropdownTriggerContent: {
    flex: 1,
    marginRight: 8,
  },
  dropdownValue: {
    fontSize: 16,
    fontWeight: '600',
    color: brand.text,
  },
  dropdownSubvalue: {
    fontSize: 13,
    color: brand.muted,
    marginTop: 2,
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: brand.muted,
  },
  dropdownChevron: {
    fontSize: 16,
    color: brand.muted,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  modalBackdropPress: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalSheet: {
    backgroundColor: brand.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: brand.border,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: brand.text,
    marginBottom: 12,
  },
  modalList: {
    maxHeight: 320,
  },
  modalOption: {
    backgroundColor: brand.surface,
    borderWidth: 1,
    borderColor: brand.borderStrong,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  modalCancel: {
    marginTop: 4,
    alignItems: 'center',
    paddingVertical: 12,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: brand.muted,
  },
  webDateTimeInputWrap: {
    marginBottom: 16,
  },
  dateButton: {
    backgroundColor: brand.surface,
    borderWidth: 1,
    borderColor: brand.borderStrong,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  dateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: brand.text,
  },
  dateButtonHint: {
    fontSize: 13,
    color: brand.muted,
    marginTop: 4,
  },
  skillBlock: {
    marginBottom: 8,
  },
  skillLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: brand.text,
    marginBottom: 8,
  },
  skillLabelInvalid: {
    color: brand.danger,
  },
  skillHint: {
    fontSize: 14,
    color: brand.muted,
    marginBottom: 8,
  },
});
