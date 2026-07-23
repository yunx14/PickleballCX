import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { brand } from '@/constants/brand';

export function ScreenContainer({ children }: { children: React.ReactNode }) {
  return <View style={styles.container}>{children}</View>;
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
  container: {
    flex: 1,
    backgroundColor: brand.sand,
    paddingHorizontal: 24,
    paddingTop: 72,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: brand.green900,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: brand.muted,
    marginBottom: 32,
    lineHeight: 22,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: brand.text,
    marginBottom: 8,
  },
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
  primaryButton: {
    backgroundColor: brand.green700,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
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
    paddingVertical: 16,
  },
  link: {
    color: brand.green700,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 20,
  },
  error: {
    color: brand.danger,
    marginBottom: 12,
  },
});
