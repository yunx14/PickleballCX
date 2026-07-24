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
    backgroundColor: brand.white,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  chipSelected: {
    borderColor: brand.green700,
    backgroundColor: brand.green100,
  },
  chipDisabled: {
    opacity: 0.5,
  },
  text: {
    ...typography.label,
    fontSize: 14,
  },
  textSelected: {
    color: brand.green900,
  },
  textDisabled: {
    color: brand.muted,
  },
});
