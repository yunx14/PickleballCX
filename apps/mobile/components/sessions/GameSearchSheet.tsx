import {
  SESSION_TYPES,
  SESSION_TYPE_LABELS,
  SKILL_LEVELS,
  SKILL_LEVEL_LABELS,
} from '@pickleballcx/shared';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FilterDropdown, type FilterDropdownOption } from '@/components/ui/FilterDropdown';
import { ErrorText, FieldLabel, PrimaryButton } from '@/components/ui/Screen';
import { brand } from '@/constants/brand';
import { border, radius, spacing, typography } from '@/constants/theme';
import { useSearchLocation } from '@/hooks/useSearchLocation';
import {
  DEFAULT_EVENT_SEARCH_FORM,
  DISCOVERY_RADIUS_OPTIONS_MI,
  RADIUS_FILTER_ANY,
  SESSION_TYPE_FILTER_ANY,
  SKILL_FILTER_ANY,
  countActiveEventFilters,
  type EventSearchFormState,
  type RadiusFilter,
  type SessionTypeFilter,
  type SkillFilter,
} from '@/lib/event-search';

const SKILL_OPTIONS: FilterDropdownOption<SkillFilter>[] = [
  { value: SKILL_FILTER_ANY, label: 'Any skill' },
  ...SKILL_LEVELS.map((level) => ({ value: level, label: SKILL_LEVEL_LABELS[level] })),
];

const SESSION_TYPE_OPTIONS: FilterDropdownOption<SessionTypeFilter>[] = [
  { value: SESSION_TYPE_FILTER_ANY, label: 'Any type' },
  ...SESSION_TYPES.map((type) => ({ value: type, label: SESSION_TYPE_LABELS[type] })),
];

const DISTANCE_OPTIONS: FilterDropdownOption<RadiusFilter>[] = [
  { value: RADIUS_FILTER_ANY, label: 'Any distance' },
  ...DISCOVERY_RADIUS_OPTIONS_MI.map((miles) => ({
    value: miles,
    label: `Within ${miles} mi`,
  })),
];

/**
 * Full-screen search form. Edits a local draft seeded from the applied filters;
 * nothing reaches the feed until Apply. The feed unmounts this on close, so
 * closing discards the draft.
 */
export function GameSearchSheet({
  initial,
  onApply,
  onClose,
}: {
  initial: EventSearchFormState;
  onApply: (next: EventSearchFormState) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<EventSearchFormState>(initial);

  const location = useSearchLocation({ city: draft.city });
  const hasCity = Boolean(draft.city.trim());

  const update = <K extends keyof EventSearchFormState>(
    key: K,
    value: EventSearchFormState[K],
  ) => setDraft((current) => ({ ...current, [key]: value }));

  // Applying an unresolved place would silently return nothing.
  const cityUnresolved = hasCity && !location.coords;
  const canApply = !location.isResolving && !cityUnresolved;
  const draftFilterCount = countActiveEventFilters(draft);
  const cityTooShort = hasCity && draft.city.trim().length < 3;

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close search"
            onPress={onClose}
            hitSlop={8}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <SymbolView
              name={{ ios: 'xmark', android: 'close', web: 'close' }}
              tintColor={brand.text}
              size={20}
            />
          </Pressable>
          <Text style={styles.topBarTitle}>Search games</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setDraft(DEFAULT_EVENT_SEARCH_FORM)}
            disabled={!draftFilterCount}
            hitSlop={8}
            style={({ pressed }) => [pressed && styles.pressed]}>
            <Text style={[styles.resetText, !draftFilterCount && styles.resetTextDisabled]}>
              Reset
            </Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          keyboardShouldPersistTaps="handled">
          <View style={styles.field}>
            <FieldLabel invalid={Boolean(location.error)}>Location</FieldLabel>
            <TextInput
              style={[styles.input, location.error && styles.inputInvalid]}
              value={draft.city}
              onChangeText={(value) => update('city', value)}
              placeholder="City, e.g. Austin, TX"
              placeholderTextColor={brand.muted}
              autoCapitalize="words"
              accessibilityLabel="Search near a city"
            />

            {cityTooShort ? (
              <Text style={styles.status}>Type at least 3 characters to find a city</Text>
            ) : location.isResolving ? (
              <Text style={styles.status}>Finding that city…</Text>
            ) : hasCity ? null : location.coords ? (
              <Text style={styles.status}>Blank searches around {location.label}</Text>
            ) : (
              <Text style={styles.status}>
                Enter a city, or turn on location to search near you
              </Text>
            )}
            <ErrorText message={location.error} />
          </View>

          <View style={styles.field}>
            <FieldLabel>Distance</FieldLabel>
            <FilterDropdown
              value={draft.radius}
              options={DISTANCE_OPTIONS}
              onChange={(value) => update('radius', value)}
              disabled={!location.coords}
              accessibilityLabel="Distance"
            />
            {!location.coords ? (
              <Text style={styles.status}>Pick a location to filter by distance</Text>
            ) : null}
          </View>

          <View style={styles.field}>
            <FieldLabel>Skill level</FieldLabel>
            <FilterDropdown
              value={draft.skill}
              options={SKILL_OPTIONS}
              onChange={(value) => update('skill', value)}
              accessibilityLabel="Skill level"
            />
          </View>

          <View style={styles.field}>
            <FieldLabel>Session type</FieldLabel>
            <FilterDropdown
              value={draft.sessionType}
              options={SESSION_TYPE_OPTIONS}
              onChange={(value) => update('sessionType', value)}
              accessibilityLabel="Session type"
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          {location.isResolving ? (
            <ActivityIndicator color={brand.accent} style={styles.footerSpinner} />
          ) : null}
          <PrimaryButton label="Apply" onPress={() => onApply(draft)} disabled={!canApply} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: brand.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: border.width,
    borderBottomColor: border.color,
  },
  topBarTitle: {
    ...typography.titleSm,
  },
  iconButton: {
    padding: 4,
  },
  pressed: {
    opacity: 0.7,
  },
  resetText: {
    color: brand.accent,
    fontSize: 15,
    fontWeight: '700',
  },
  resetTextDisabled: {
    color: brand.muted,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  field: {
    marginBottom: spacing.xl,
  },
  input: {
    backgroundColor: brand.surface,
    borderWidth: border.width,
    borderColor: border.color,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    fontSize: 15,
    color: brand.text,
  },
  inputInvalid: {
    borderColor: brand.danger,
  },
  status: {
    ...typography.caption,
    marginTop: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: border.width,
    borderTopColor: border.color,
  },
  footerSpinner: {
    marginBottom: spacing.sm,
  },
});
