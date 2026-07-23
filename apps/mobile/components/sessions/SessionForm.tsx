import DateTimePicker from '@react-native-community/datetimepicker';
import {
  SESSION_TYPES,
  SESSION_TYPE_LABELS,
  SKILL_LEVELS,
  SKILL_LEVEL_LABELS,
  type CreateEventInput,
  type SessionType,
  type SkillLevel,
} from '@pickleballcx/shared';
import { useState } from 'react';
import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  ErrorText,
  FieldLabel,
  PrimaryButton,
  Subtitle,
  Title,
} from '@/components/ui/Screen';
import { brand } from '@/constants/brand';
import type { Court } from '@/hooks/useCourts';
import { formatSessionDateTime } from '@/lib/format';

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
  courts,
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
  courts: Court[];
  control: Control<CreateEventInput>;
  errors: FieldErrors<CreateEventInput>;
  formError?: string;
  submitLabel: string;
  pendingLabel: string;
  isSubmitting: boolean;
  onSubmit: () => void;
}) {
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(
    Platform.OS === 'ios' ? 'date' : null,
  );

  return (
    <>
      <Title>{title}</Title>
      <Subtitle>{subtitle}</Subtitle>
      <ErrorText message={formError} />
      <ErrorText message={errors.courtId?.message ?? errors.sessionType?.message} />

      <FieldLabel>Court</FieldLabel>
      <Controller
        control={control}
        name="courtId"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <>
            <CourtDropdown courts={courts} value={value} onChange={onChange} />
            <ErrorText message={error?.message} />
          </>
        )}
      />

      <FieldLabel>Date & time</FieldLabel>
      <Controller
        control={control}
        name="startsAt"
        render={({ field: { value, onChange } }) => (
          <>
            <Pressable
              onPress={() => {
                if (Platform.OS === 'android') setPickerMode('date');
              }}
              style={styles.dateButton}>
              <Text style={styles.dateButtonText}>
                {formatSessionDateTime(value.toISOString())}
              </Text>
              {Platform.OS === 'android' ? (
                <Text style={styles.dateButtonHint}>Tap to change date and time</Text>
              ) : null}
            </Pressable>

            {(Platform.OS === 'ios' || pickerMode === 'date') && (
              <DateTimePicker
                value={value}
                mode="date"
                minimumDate={new Date()}
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={(event, date) => {
                  if (Platform.OS === 'android') {
                    if (event.type === 'dismissed') {
                      setPickerMode(null);
                      return;
                    }
                    setPickerMode('time');
                  }
                  if (date) onChange(mergeDatePart(value, date));
                }}
              />
            )}

            {(Platform.OS === 'ios' || pickerMode === 'time') && (
              <DateTimePicker
                value={value}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, date) => {
                  if (Platform.OS === 'android') {
                    setPickerMode(null);
                    if (event.type === 'dismissed') return;
                  }
                  if (date) onChange(mergeTimePart(value, date));
                }}
              />
            )}
          </>
        )}
      />
      <ErrorText message={errors.startsAt?.message} />

      <FieldLabel>Session type</FieldLabel>
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
            />
            <ErrorText message={error?.message} />
          </>
        )}
      />

      <FieldLabel>Max players (optional)</FieldLabel>
      <Controller
        control={control}
        name="maxPlayers"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <>
            <TextInput
              style={styles.input}
              value={value === undefined ? '' : String(value)}
              onChangeText={(text) => {
                const trimmed = text.trim();
                onChange(trimmed === '' ? undefined : Number(trimmed));
              }}
              keyboardType="number-pad"
              placeholder="e.g. 12"
              placeholderTextColor={brand.muted}
            />
            <ErrorText message={error?.message} />
          </>
        )}
      />

      <FieldLabel>Skill range (optional)</FieldLabel>
      <Controller
        control={control}
        name="skillMin"
        render={({ field: { onChange, value } }) => (
          <SkillPicker label="Minimum skill" value={value} onChange={onChange} allowClear />
        )}
      />
      <Controller
        control={control}
        name="skillMax"
        render={({ field: { onChange, value } }) => (
          <SkillPicker label="Maximum skill" value={value} onChange={onChange} allowClear />
        )}
      />

      <FieldLabel>Description (optional)</FieldLabel>
      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={value ?? ''}
              onChangeText={onChange}
              placeholder="Bring extra balls, courts 3–4 in the back…"
              placeholderTextColor={brand.muted}
              multiline
              textAlignVertical="top"
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

function CourtDropdown({
  courts,
  value,
  onChange,
}: {
  courts: Court[];
  value?: string;
  onChange: (courtId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = courts.find((court) => court.id === value);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.dropdownTrigger, pressed && styles.dropdownTriggerPressed]}>
        <View style={styles.dropdownTriggerContent}>
          {selected ? (
            <>
              <Text style={styles.dropdownValue} numberOfLines={1}>
                {selected.name}
              </Text>
              <Text style={styles.dropdownSubvalue} numberOfLines={1}>
                {selected.address}
              </Text>
            </>
          ) : (
            <Text style={styles.dropdownPlaceholder}>Select a court</Text>
          )}
        </View>
        <Text style={styles.dropdownChevron}>▾</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalBackdropPress} onPress={() => setOpen(false)} />
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Select court</Text>
            <ScrollView style={styles.modalList} keyboardShouldPersistTaps="handled">
              {courts.map((court) => {
                const isSelected = value === court.id;
                return (
                  <Pressable
                    key={court.id}
                    onPress={() => {
                      onChange(court.id);
                      setOpen(false);
                    }}
                    style={[styles.modalOption, isSelected && styles.optionSelected]}>
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                      {court.name}
                    </Text>
                    <Text style={styles.optionSubtext}>{court.address}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
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
}: {
  options: readonly T[];
  labels: Record<T, string>;
  value?: T;
  onChange: (value: T) => void;
}) {
  return (
    <>
      {options.map((option) => {
        const selected = value === option;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            style={[styles.option, selected && styles.optionSelected]}>
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
}: {
  label: string;
  value?: SkillLevel;
  onChange: (value?: SkillLevel) => void;
  allowClear?: boolean;
}) {
  return (
    <View style={styles.skillBlock}>
      <Text style={styles.skillLabel}>{label}</Text>
      {allowClear && !value ? <Text style={styles.skillHint}>Any</Text> : null}
      {SKILL_LEVELS.map((level) => {
        const selected = value === level;
        return (
          <Pressable
            key={level}
            onPress={() => onChange(selected && allowClear ? undefined : level)}
            style={[styles.option, selected && styles.optionSelected]}>
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
    backgroundColor: brand.white,
    borderWidth: 1,
    borderColor: '#DEE2E6',
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
  option: {
    backgroundColor: brand.white,
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  optionSelected: {
    borderColor: brand.green700,
    backgroundColor: brand.green100,
  },
  optionText: {
    fontSize: 16,
    color: brand.text,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: brand.green900,
    fontWeight: '700',
  },
  optionSubtext: {
    fontSize: 13,
    color: brand.muted,
    marginTop: 4,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brand.white,
    borderWidth: 1,
    borderColor: '#DEE2E6',
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalSheet: {
    backgroundColor: brand.sand,
    borderRadius: 16,
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
    backgroundColor: brand.white,
    borderWidth: 1,
    borderColor: '#DEE2E6',
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
  dateButton: {
    backgroundColor: brand.white,
    borderWidth: 1,
    borderColor: '#DEE2E6',
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
  skillHint: {
    fontSize: 14,
    color: brand.muted,
    marginBottom: 8,
  },
});
