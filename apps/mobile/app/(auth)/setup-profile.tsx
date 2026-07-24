import { zodResolver } from '@hookform/resolvers/zod';
import {
  profileSetupSchema,
  type ProfileSetupInput,
} from '@pickleballcx/shared';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  AuthBrandMark,
  AuthHeading,
  ErrorText,
  FieldLabel,
  PrimaryButton,
  ScreenContainer,
  Subtitle,
  TextField,
} from '@/components/ui/Screen';
import { SkillPicker } from '@/components/ui/SkillPicker';
import { brand } from '@/constants/brand';
import { spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export default function SetupProfileScreen() {
  const { session, profile, refreshProfile } = useAuth();
  const [formError, setFormError] = useState<string>();
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<ProfileSetupInput>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: { displayName: '', skillLevel: undefined },
  });

  useEffect(() => {
    if (!profile) return;
    reset({
      displayName: profile.display_name?.trim() ? profile.display_name : '',
      skillLevel: profile.skill_level ?? undefined,
    });
  }, [profile, reset]);

  const onSubmit = handleSubmit(
    async (values) => {
      if (!session?.user.id) {
        setFormError('Sign in after confirming your email to finish setting up your profile.');
        router.replace('/(auth)/login');
        return;
      }

      setFormError(undefined);

      const { data, error } = await supabase
        .from('profiles')
        .upsert(
          {
            id: session.user.id,
            display_name: values.displayName.trim(),
            skill_level: values.skillLevel,
          },
          { onConflict: 'id' },
        )
        .select('id, display_name, skill_level')
        .single();

      if (error) {
        setFormError(error.message);
        return;
      }

      if (!data?.skill_level) {
        setFormError('Profile could not be saved. Please try again.');
        return;
      }

      await refreshProfile();
      router.replace('/(tabs)');
    },
    () => {
      setFormError('Please enter a display name and pick your skill level.');
    },
  );

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
      style={styles.scrollView}>
      <ScreenContainer>
        <AuthBrandMark />
        <AuthHeading>Set up your profile</AuthHeading>
        <Subtitle>
          Your skill level shows on RSVP lists so groups can match games. It is self-reported.
        </Subtitle>
        <ErrorText message={formError} />
        <ErrorText message={errors.displayName?.message ?? errors.skillLevel?.message} />

        <FieldLabel>Display name</FieldLabel>
        <Controller
          control={control}
          name="displayName"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <>
              <TextField
                value={value}
                onChangeText={onChange}
                placeholder="How your group knows you"
                autoCapitalize="words"
              />
              <ErrorText message={error?.message} />
            </>
          )}
        />

        <FieldLabel>Pickleball skill (self-reported)</FieldLabel>
        <Controller
          control={control}
          name="skillLevel"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <>
              <SkillPicker value={value} onChange={onChange} />
              <ErrorText message={error?.message} />
            </>
          )}
        />

        <PrimaryButton
          label={isSubmitting ? 'Saving…' : 'Continue'}
          onPress={onSubmit}
          disabled={isSubmitting}
        />
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
