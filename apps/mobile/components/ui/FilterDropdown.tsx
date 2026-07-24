import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { brand } from '@/constants/brand';
import { border, radius, spacing } from '@/constants/theme';

export interface FilterDropdownOption<T extends string | number> {
  value: T;
  label: string;
}

export function FilterDropdown<T extends string | number>({
  value,
  options,
  onChange,
  disabled,
  accessibilityLabel,
}: {
  value: T;
  options: readonly FilterDropdownOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.trigger,
          disabled && styles.triggerDisabled,
          pressed && !disabled && styles.triggerPressed,
        ]}>
        <Text style={[styles.triggerText, disabled && styles.triggerTextDisabled]} numberOfLines={1}>
          {selected?.label ?? 'Select'}
        </Text>
        <Text style={[styles.chevron, disabled && styles.triggerTextDisabled]}>▾</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalBackdropPress} onPress={() => setOpen(false)} />
          <View style={styles.modalSheet}>
            <ScrollView style={styles.modalList} keyboardShouldPersistTaps="handled">
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    style={[styles.modalOption, isSelected && styles.modalOptionSelected]}>
                    <Text
                      style={[styles.modalOptionText, isSelected && styles.modalOptionTextSelected]}>
                      {option.label}
                    </Text>
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

const styles = StyleSheet.create({
  trigger: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brand.surface,
    borderWidth: border.width,
    borderColor: brand.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 12,
    gap: spacing.xs,
  },
  triggerPressed: {
    opacity: 0.85,
  },
  triggerDisabled: {
    opacity: 0.45,
  },
  triggerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: brand.text,
  },
  triggerTextDisabled: {
    color: brand.muted,
  },
  chevron: {
    fontSize: 12,
    color: brand.muted,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalBackdropPress: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalSheet: {
    backgroundColor: brand.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: border.width,
    borderColor: brand.border,
    padding: spacing.lg,
    maxHeight: '60%',
  },
  modalList: {
    maxHeight: 320,
  },
  modalOption: {
    backgroundColor: brand.surface,
    borderWidth: border.width,
    borderColor: brand.borderStrong,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  modalOptionSelected: {
    borderColor: brand.accent,
    backgroundColor: brand.accentSurface,
  },
  modalOptionText: {
    fontSize: 16,
    color: brand.muted,
    fontWeight: '500',
  },
  modalOptionTextSelected: {
    color: brand.accent,
    fontWeight: '800',
  },
  modalCancel: {
    marginTop: spacing.xs,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: brand.muted,
  },
});
