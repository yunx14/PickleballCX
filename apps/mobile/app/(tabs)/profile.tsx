import { zodResolver } from '@hookform/resolvers/zod';
import { profileSetupSchema, type ProfileSetupInput } from '@pickleballcx/shared';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, ScrollView, StyleSheet, Text, View, Linking } from 'react-native';

import { Card } from '@/components/ui/Card';
import {
  ErrorText,
  FieldLabel,
  PrimaryButton,
  TextField,
} from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SkillPicker } from '@/components/ui/SkillPicker';
import { brand } from '@/constants/brand';
import { SUPPORT_EMAIL, supportMailtoUrl } from '@/constants/support';
import { spacing, typography } from '@/constants/theme';
import { courtsRoute, privacyPolicyRoute, termsOfServiceRoute } from '@/lib/routes';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export default function ProfileScreen() {
  const { profile, signOut, refreshProfile } = useAuth();
  const isAppAdmin = profile?.is_app_admin ?? false;
  const [formError, setFormError] = useState<string>();
  const [saveMessage, setSaveMessage] = useState<string>();

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors, isDirty },
  } = useForm<ProfileSetupInput>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: {
      displayName: profile?.display_name ?? '',
      skillLevel: profile?.skill_level ?? undefined,
    },
  });

  useEffect(() => {
    if (!profile) return;
    reset({
      displayName: profile.display_name?.trim() ? profile.display_name : '',
      skillLevel: profile.skill_level ?? undefined,
    });
  }, [profile, reset]);

  const initials = (profile?.display_name ?? 'P')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const onSubmit = handleSubmit(
    async (values) => {
      if (!profile?.id) {
        setFormError('Sign in to update your profile.');
        return;
      }

      setFormError(undefined);
      setSaveMessage(undefined);

      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: values.displayName.trim(),
          skill_level: values.skillLevel,
        })
        .eq('id', profile.id);

      if (error) {
        setFormError(error.message);
        return;
      }

      await refreshProfile();
      setSaveMessage('Profile saved.');
    },
    () => {
      setFormError('Please enter a display name and pick your skill level.');
    },
  );

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <View style={styles.avatarRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.avatarMeta}>
          <Text style={styles.displayName}>{profile?.display_name ?? 'Player'}</Text>
          <Text style={styles.skillLine}>Self-reported skill shows on RSVP lists</Text>
        </View>
      </View>

      <ScreenHeader
        eyebrow="Account"
        title="Your profile"
        subtitle="Update how your group sees you and your skill level."
      />

      <Card>
        {isAppAdmin ? (
          <>
            <Text style={styles.label}>Role</Text>
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>App admin</Text>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.label}>Member</Text>
            <Text style={styles.value}>Standard account</Text>
          </>
        )}
      </Card>

      <ErrorText message={formError} />
      <ErrorText message={errors.displayName?.message ?? errors.skillLevel?.message} />
      {saveMessage ? <Text style={styles.saveMessage}>{saveMessage}</Text> : null}

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
        label={isSubmitting ? 'Saving…' : 'Save profile'}
        onPress={onSubmit}
        disabled={isSubmitting || !isDirty}
      />

      {isAppAdmin ? (
        <PrimaryButton label="Manage courts" onPress={() => router.push(courtsRoute)} />
      ) : null}

      <PrimaryButton label="Sign out" onPress={signOut} />

      <View style={styles.legalLinks}>
        <Pressable onPress={() => router.push(privacyPolicyRoute)} style={styles.legalLink}>
          <Text style={styles.legalLinkText}>Privacy Policy</Text>
        </Pressable>
        <Pressable onPress={() => router.push(termsOfServiceRoute)} style={styles.legalLink}>
          <Text style={styles.legalLinkText}>Terms of Service</Text>
        </Pressable>
        <Pressable
          accessibilityRole="link"
          onPress={() => void Linking.openURL(supportMailtoUrl)}
          style={styles.legalLink}>
          <Text style={styles.legalLinkText}>{SUPPORT_EMAIL}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    backgroundColor: brand.background,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: brand.accentSurface,
    borderWidth: 2,
    borderColor: brand.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: brand.accent,
  },
  avatarMeta: {
    flex: 1,
    gap: 4,
  },
  displayName: {
    fontSize: 22,
    fontWeight: '800',
    color: brand.text,
  },
  skillLine: {
    ...typography.caption,
    fontSize: 14,
  },
  label: {
    ...typography.eyebrow,
    color: brand.muted,
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: 17,
    color: brand.text,
    fontWeight: '600',
  },
  adminBadge: {
    alignSelf: 'flex-start',
    backgroundColor: brand.accentSurface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: brand.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  adminBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: brand.accent,
    letterSpacing: 0.5,
  },
  saveMessage: {
    fontSize: 14,
    fontWeight: '600',
    color: brand.accent,
  },
  legalLinks: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  legalLink: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  legalLinkText: {
    fontSize: 15,
    fontWeight: '600',
    color: brand.accent,
  },
});
