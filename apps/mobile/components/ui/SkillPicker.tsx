import { SKILL_LEVELS, SKILL_LEVEL_LABELS, type SkillLevel } from '@pickleballcx/shared';
import { Pressable, StyleSheet, Text } from 'react-native';

import { brand } from '@/constants/brand';
import { border, radius, spacing } from '@/constants/theme';

export function SkillPicker({
  value,
  onChange,
}: {
  value?: SkillLevel;
  onChange: (value: SkillLevel) => void;
}) {
  return (
    <>
      {SKILL_LEVELS.map((level) => {
        const selected = value === level;
        return (
          <Pressable
            key={level}
            onPress={() => onChange(level)}
            style={[styles.option, selected && styles.optionSelected]}>
            <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
              {SKILL_LEVEL_LABELS[level]}
            </Text>
          </Pressable>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  option: {
    backgroundColor: brand.surface,
    borderWidth: border.width,
    borderColor: border.color,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
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
