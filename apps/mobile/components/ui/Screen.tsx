import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { brand } from '@/constants/brand';
import { border, radius, spacing, typography } from '@/constants/theme';

export function ScreenContainer({ children }: { children: React.ReactNode }) {
  return <View style={styles.screen}>{children}</View>;
}

export function FormScreenContainer({ children }: { children: React.ReactNode }) {
  return <View style={styles.formScreen}>{children}</View>;
}

export function AuthBrandMark() {
  return (
    <View style={styles.brandMark}>
      <Text style={styles.brandName}>
        Pickleball <Text style={styles.brandAccent}>CX</Text>
      </Text>
      <Text style={styles.brandTagline}>YOUR GAME. YOUR PEOPLE.</Text>
    </View>
  );
}

export function AuthHeading({ children }: { children: React.ReactNode }) {
  return <Text style={styles.authHeading}>{children}</Text>;
}

export function Title({ children }: { children: React.ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Subtitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.subtitle}>{children}</Text>;
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primaryButton,
        disabled && styles.primaryButtonDisabled,
        pressed && !disabled && styles.primaryButtonPressed,
      ]}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function LinkText({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Text accessibilityRole="link" onPress={onPress} style={styles.link}>
      {label}
    </Text>
  );
}

export function ErrorText({ message }: { message?: string }) {
  if (!message) return null;
  return <Text style={styles.error}>{message}</Text>;
}

export function FieldLabel({
  children,
  invalid,
}: {
  children: React.ReactNode;
  invalid?: boolean;
}) {
  return <Text style={[styles.label, invalid && styles.labelInvalid]}>{children}</Text>;
}

/** Red border treatment for inputs that declare their own base style. */
export const invalidInputStyle = {
  borderColor: brand.danger,
  borderWidth: border.width,
} as const;

export function TextField({
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  autoCapitalize = 'none',
  keyboardType = 'default',
  error,
  multiline,
  numberOfLines,
  accessibilityLabel,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'number-pad';
  error?: string;
  multiline?: boolean;
  numberOfLines?: number;
  accessibilityLabel?: string;
}) {
  const invalid = Boolean(error);

  return (
    <View>
      <TextInput
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          invalid && styles.inputInvalid,
          invalid && styles.inputWithError,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={brand.muted}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        accessibilityLabel={accessibilityLabel}
        aria-invalid={invalid}
      />
      <ErrorText message={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: brand.background,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxxl,
  },
  formScreen: {
    flex: 1,
    backgroundColor: brand.background,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  brandMark: {
    marginBottom: spacing.xxxl,
    gap: spacing.sm,
  },
  brandName: {
    fontSize: 36,
    fontWeight: '800',
    color: brand.text,
    letterSpacing: -1,
  },
  brandAccent: {
    color: brand.accent,
  },
  brandTagline: {
    ...typography.eyebrow,
    color: brand.muted,
    fontSize: 11,
  },
  authHeading: {
    fontSize: 24,
    fontWeight: '700',
    color: brand.text,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.title,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.subtitle,
    marginBottom: spacing.xxxl,
  },
  label: {
    ...typography.label,
    marginBottom: spacing.sm,
  },
  labelInvalid: {
    color: brand.danger,
  },
  input: {
    backgroundColor: brand.surface,
    borderWidth: border.width,
    borderColor: border.color,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: 16,
    color: brand.text,
    marginBottom: spacing.lg,
  },
  inputMultiline: {
    minHeight: 96,
    paddingTop: spacing.md,
    textAlignVertical: 'top',
  },
  inputInvalid: {
    borderColor: brand.danger,
  },
  /** The inline message supplies the gap, so the input drops its own. */
  inputWithError: {
    marginBottom: spacing.sm,
  },
  primaryButton: {
    backgroundColor: brand.accent,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  primaryButtonPressed: {
    opacity: 0.88,
  },
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: brand.accentText,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
    paddingVertical: spacing.lg,
  },
  link: {
    color: brand.accent,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  error: {
    color: brand.danger,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
});
