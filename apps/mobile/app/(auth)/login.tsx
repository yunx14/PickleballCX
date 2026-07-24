import { zodResolver } from '@hookform/resolvers/zod';
import { signInSchema, type SignInInput } from '@pickleballcx/shared';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView } from 'react-native';

import {
  AuthBrandMark,
  ErrorText,
  FieldLabel,
  LinkText,
  PrimaryButton,
  ScreenContainer,
  Subtitle,
  TextField,
} from '@/components/ui/Screen';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const [formError, setFormError] = useState<string>();
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
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
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <ScreenContainer>
        <AuthBrandMark />
        <Subtitle>Sign in to coordinate sessions with your group.</Subtitle>
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
                placeholder="Your password"
                secureTextEntry
              />
              <ErrorText message={error?.message} />
            </>
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
