import { zodResolver } from '@hookform/resolvers/zod';
import { signUpSchema, type SignUpInput } from '@pickleballcx/shared';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, StyleSheet } from 'react-native';

import { FormErrorSummary, type FieldLabels } from '@/components/ui/FormErrorSummary';
import {
  AuthBrandMark,
  AuthHeading,
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
  confirmPassword: 'Confirm password',
};

export default function SignUpScreen() {
  const [formError, setFormError] = useState<string>();
  const {
    control,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(undefined);

    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setFormError(error.message);
      return;
    }

    if (!data.user) {
      setFormError('Could not create your account. Please try again.');
      return;
    }

    if (!data.session) {
      router.replace({
        pathname: '/(auth)/confirm-email',
        params: { email: values.email },
      });
      return;
    }

    router.replace('/(auth)/setup-profile');
  });

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
      style={styles.scrollView}>
      <ScreenContainer>
        <AuthBrandMark />
        <AuthHeading>Create account</AuthHeading>
        <Subtitle>Find nearby sessions, RSVP, and see courts on the map.</Subtitle>
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
              placeholder="At least 8 characters"
              secureTextEntry
              error={error?.message}
              accessibilityLabel="Password"
            />
          )}
        />

        <FieldLabel invalid={Boolean(errors.confirmPassword)}>Confirm password</FieldLabel>
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <TextField
              value={value}
              onChangeText={onChange}
              placeholder="Repeat password"
              secureTextEntry
              error={error?.message}
              accessibilityLabel="Confirm password"
            />
          )}
        />

        <PrimaryButton
          label={isSubmitting ? 'Creating account…' : 'Sign up'}
          onPress={onSubmit}
          disabled={isSubmitting}
        />

        <Link href="/(auth)/login" asChild>
          <LinkText label="Already have an account? Sign in" onPress={() => router.push('/(auth)/login')} />
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
