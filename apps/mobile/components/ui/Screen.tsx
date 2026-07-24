import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { brand } from '@/constants/brand';
import { border, cardShadow, radius, spacing, typography } from '@/constants/theme';

export function ScreenContainer({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.screen}>
      <View style={styles.heroBand} />
      <View style={styles.container}>{children}</View>
    </View>
  );
}

export function AuthBrandMark() {
  return (
    <View style={styles.brandMark}>
      <Text style={styles.brandEmoji}>🏓</Text>
      <Text style={styles.brandName}>PickleballCX</Text>
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

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function TextField({
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  autoCapitalize = 'none',
  keyboardType = 'default',
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address';
}) {
  return (
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={brand.muted}
      secureTextEntry={secureTextEntry}
      autoCapitalize={autoCapitalize}
      keyboardType={keyboardType}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: brand.sand,
  },
  heroBand: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: brand.green900,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxxl,
  },
  brandMark: {
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  brandEmoji: {
    fontSize: 36,
  },
  brandName: {
    fontSize: 32,
    fontWeight: '800',
    color: brand.white,
    letterSpacing: -0.5,
  },
  authHeading: {
    fontSize: 24,
    fontWeight: '700',
    color: brand.white,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.title,
    color: brand.white,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.subtitle,
    color: brand.green100,
    marginBottom: spacing.xxxl,
  },
  label: {
    ...typography.label,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: brand.white,
    borderWidth: border.width,
    borderColor: border.colorStrong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: 16,
    color: brand.text,
    marginBottom: spacing.lg,
  },
  primaryButton: {
    backgroundColor: brand.green700,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginTop: spacing.sm,
    ...cardShadow(),
  },
  primaryButtonPressed: {
    opacity: 0.85,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: brand.white,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    paddingVertical: spacing.lg,
  },
  link: {
    color: brand.green700,
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
