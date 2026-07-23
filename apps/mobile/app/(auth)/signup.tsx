import { zodResolver } from '@hookform/resolvers/zod';
import { signUpSchema, type SignUpInput } from '@pickleballcx/shared';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView } from 'react-native';

import {
  ErrorText,
  FieldLabel,
  LinkText,
  PrimaryButton,
  ScreenContainer,
  Subtitle,
  TextField,
  Title,
} from '@/components/ui/Screen';
import { supabase } from '@/lib/supabase';

export default function SignUpScreen() {
  const [formError, setFormError] = useState<string>();
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(undefined);
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
    });
    if (error) {
      setFormError(error.message);
      return;
    }
    router.replace('/(auth)/setup-profile');
  });

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <ScreenContainer>
        <Title>Create account</Title>
        <Subtitle>Join your pickleball group with structured sessions and RSVPs.</Subtitle>
        <ErrorText message={formError} />

        <FieldLabel>Email</FieldLabel>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <>
              <TextField
                value={value}
                onChangeText={onChange}
                placeholder="you@example.com"
                keyboardType="email-address"
              />
              <ErrorText message={error?.message} />
            </>
          )}
        />

        <FieldLabel>Password</FieldLabel>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <>
              <TextField
                value={value}
                onChangeText={onChange}
                placeholder="At least 8 characters"
                secureTextEntry
              />
              <ErrorText message={error?.message} />
            </>
          )}
        />

        <FieldLabel>Confirm password</FieldLabel>
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <>
              <TextField
                value={value}
                onChangeText={onChange}
                placeholder="Repeat password"
                secureTextEntry
              />
              <ErrorText message={error?.message} />
            </>
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
