import { Pressable, StyleSheet, Text } from 'react-native';

import { brand } from '@/constants/brand';
import { border, radius, spacing } from '@/constants/theme';

export function EnumPicker<T extends string>({
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
