import {
  SESSION_TYPES,
  SESSION_TYPE_LABELS,
  SKILL_LEVELS,
  SKILL_LEVEL_LABELS,
} from '@pickleballcx/shared';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { FilterDropdown, type FilterDropdownOption } from '@/components/ui/FilterDropdown';
import { ErrorText } from '@/components/ui/Screen';
import { brand } from '@/constants/brand';
import { border, radius, spacing, typography } from '@/constants/theme';
import {
  DISCOVERY_RADIUS_OPTIONS_MI,
  RADIUS_FILTER_ANY,
  SESSION_TYPE_FILTER_ANY,
  SKILL_FILTER_ANY,
  type RadiusFilter,
  type SessionTypeFilter,
  type SkillFilter,
} from '@/lib/event-search';
import type { SearchLocationState } from '@/hooks/useSearchLocation';

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

export function GameSearchBar({
  search,
  onSearchChange,
  skill,
  onSkillChange,
  sessionType,
  onSessionTypeChange,
  radius: radiusFilter,
  onRadiusChange,
  location,
  onClear,
  showClear,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  skill: SkillFilter;
  onSkillChange: (value: SkillFilter) => void;
  sessionType: SessionTypeFilter;
  onSessionTypeChange: (value: SessionTypeFilter) => void;
  radius: RadiusFilter;
  onRadiusChange: (value: RadiusFilter) => void;
  location: SearchLocationState;
  onClear: () => void;
  showClear: boolean;
}) {
  const isCityMode = location.mode === 'city';

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={search}
        onChangeText={onSearchChange}
        placeholder="Search courts or keywords"
        placeholderTextColor={brand.muted}
        autoCapitalize="none"
        accessibilityLabel="Search games"
      />

      <View style={styles.locationRow}>
        {isCityMode ? (
          <TextInput
            style={[styles.input, styles.cityInput, location.error ? styles.inputInvalid : null]}
            value={location.city}
            onChangeText={location.setCity}
            placeholder="City, e.g. Austin, TX"
            placeholderTextColor={brand.muted}
            autoCapitalize="words"
            accessibilityLabel="Search in city"
          />
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={location.useCityMode}
            style={({ pressed }) => [styles.locationChip, pressed && styles.locationChipPressed]}>
            <Text style={styles.locationChipText}>{location.label}</Text>
            <Text style={styles.locationChipHint}>Change</Text>
          </Pressable>
        )}
        {isCityMode ? (
          <Pressable accessibilityRole="button" onPress={location.useNearMe}>
            <Text style={styles.nearMeLink}>Near me</Text>
          </Pressable>
        ) : null}
      </View>

      {location.isResolving ? <Text style={styles.status}>Finding that city…</Text> : null}
      <ErrorText message={location.error} />

      <View style={styles.filterRow}>
        <View style={styles.filterCell}>
          <FilterDropdown
            value={radiusFilter}
            options={DISTANCE_OPTIONS}
            onChange={onRadiusChange}
            disabled={!location.coords}
            accessibilityLabel="Distance"
          />
        </View>
        <View style={styles.filterCell}>
          <FilterDropdown
            value={skill}
            options={SKILL_OPTIONS}
            onChange={onSkillChange}
            accessibilityLabel="Skill level"
          />
        </View>
        <View style={styles.filterCell}>
          <FilterDropdown
            value={sessionType}
            options={SESSION_TYPE_OPTIONS}
            onChange={onSessionTypeChange}
            accessibilityLabel="Session type"
          />
        </View>
      </View>

      {showClear ? (
        <Pressable accessibilityRole="button" onPress={onClear} style={styles.clear}>
          <Text style={styles.clearText}>Clear filters</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    marginBottom: spacing.md,
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cityInput: {
    flex: 1,
  },
  locationChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: brand.surface,
    borderWidth: border.width,
    borderColor: border.color,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
  },
  locationChipPressed: {
    opacity: 0.85,
  },
  locationChipText: {
    fontSize: 15,
    fontWeight: '600',
    color: brand.text,
  },
  locationChipHint: {
    ...typography.caption,
    color: brand.accent,
    fontWeight: '700',
  },
  nearMeLink: {
    color: brand.accent,
    fontSize: 14,
    fontWeight: '700',
  },
  status: {
    ...typography.caption,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterCell: {
    flex: 1,
  },
  clear: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  clearText: {
    color: brand.accent,
    fontSize: 14,
    fontWeight: '700',
  },
});
