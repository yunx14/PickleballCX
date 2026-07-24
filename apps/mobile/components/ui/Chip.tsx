import { Pressable, StyleSheet, Text } from 'react-native';

import { brand } from '@/constants/brand';
import { border, radius, spacing, typography } from '@/constants/theme';

export function Chip({
  label,
  selected,
  disabled,
  onPress,
}: {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.chip,
        selected && styles.chipSelected,
        disabled && styles.chipDisabled,
      ]}>
      <Text
        style={[
          styles.text,
          selected && styles.textSelected,
          disabled && styles.textDisabled,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: border.width,
    borderColor: border.colorStrong,
    backgroundColor: brand.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  chipSelected: {
    borderColor: brand.accent,
    backgroundColor: brand.accentSurface,
  },
  chipDisabled: {
    opacity: 0.45,
  },
  text: {
    ...typography.label,
    fontSize: 14,
    color: brand.muted,
  },
  textSelected: {
    color: brand.accent,
  },
  textDisabled: {
    color: brand.muted,
  },
});
