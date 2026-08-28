import { zodResolver } from '@hookform/resolvers/zod';
import { signInSchema, type SignInInput } from '@pickleballcx/shared';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, StyleSheet } from 'react-native';

import { FormErrorSummary, type FieldLabels } from '@/components/ui/FormErrorSummary';
import {
  AuthBrandMark,
  FieldLabel,
  LinkText,
  PrimaryButton,
  ScreenContainer,
  Subtitle,
  TextField,
} from '@/components/ui/Screen';
import { brand } from '@/constants/brand';
import { supabase } from '@/lib/supabase';

const FIELD_LABELS: FieldLabels = {
  email: 'Email',
  password: 'Password',
};

export default function LoginScreen() {
  const [formError, setFormError] = useState<string>();
  const {
    control,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(undefined);
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      setFormError(error.message);
    }
  });

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
      style={styles.scrollView}>
      <ScreenContainer>
        <AuthBrandMark />
        <Subtitle>Sign in to find nearby sessions and courts.</Subtitle>
        <FormErrorSummary formError={formError} errors={errors} labels={FIELD_LABELS} />

        <FieldLabel invalid={Boolean(errors.email)}>Email</FieldLabel>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <TextField
              value={value}
              onChangeText={onChange}
              placeholder="you@example.com"
              keyboardType="email-address"
              error={error?.message}
              accessibilityLabel="Email"
            />
          )}
        />

        <FieldLabel invalid={Boolean(errors.password)}>Password</FieldLabel>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <TextField
              value={value}
              onChangeText={onChange}
              placeholder="Your password"
              secureTextEntry
              error={error?.message}
              accessibilityLabel="Password"
            />
          )}
        />

        <PrimaryButton
          label={isSubmitting ? 'Signing in…' : 'Sign in'}
          onPress={onSubmit}
          disabled={isSubmitting}
        />

        <Link href="/(auth)/signup" asChild>
          <LinkText label="Need an account? Sign up" onPress={() => router.push('/(auth)/signup')} />
        </Link>
      </ScreenContainer>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: brand.background,
  },
  scroll: {
    flexGrow: 1,
  },
});
