import { zodResolver } from '@hookform/resolvers/zod';
import { profileEditSchema, type ProfileEditInput } from '@pickleballcx/shared';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { FormErrorSummary, type FieldLabels } from '@/components/ui/FormErrorSummary';
import {
  ErrorText,
  FieldLabel,
  PrimaryButton,
  TextField,
} from '@/components/ui/Screen';
import { SkillPicker } from '@/components/ui/SkillPicker';
import { brand } from '@/constants/brand';
import { SUPPORT_EMAIL, supportMailtoUrl } from '@/constants/support';
import { spacing, typography } from '@/constants/theme';
import { removeProfileAvatar, uploadProfileAvatar } from '@/lib/avatar-upload';
import { mapTabRoute, privacyPolicyRoute, termsOfServiceRoute } from '@/lib/routes';
import { saveProfile } from '@/lib/profile-save';
import { useAuth } from '@/providers/AuthProvider';

const FIELD_LABELS: FieldLabels = {
  displayName: 'Display name',
  city: 'City',
  skillLevel: 'Pickleball skill',
};

export default function ProfileScreen() {
  const { profile, signOut, refreshProfile } = useAuth();
  const isAppAdmin = profile?.is_app_admin ?? false;
  const [formError, setFormError] = useState<string>();
  const [saveMessage, setSaveMessage] = useState<string>();
  const [avatarBusy, setAvatarBusy] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors, isDirty },
  } = useForm<ProfileEditInput>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      displayName: '',
      skillLevel: undefined,
      city: '',
    },
  });

  useEffect(() => {
    if (!profile) return;
    reset({
      displayName: profile.display_name?.trim() ? profile.display_name : '',
      skillLevel: profile.skill_level ?? undefined,
      city: profile.city ?? '',
    });
  }, [profile, reset]);

  const onChangePhoto = async () => {
    if (!profile?.id || avatarBusy) return;
    setFormError(undefined);
    setSaveMessage(undefined);
    setAvatarBusy(true);
    const result = await uploadProfileAvatar(profile.id);
    setAvatarBusy(false);
    if (result.error) {
      setFormError(result.error);
      return;
    }
    if (result.url) {
      await refreshProfile();
      setSaveMessage('Profile photo updated.');
    }
  };

  const onRemovePhoto = async () => {
    if (!profile?.id || avatarBusy) return;
    setFormError(undefined);
    setSaveMessage(undefined);
    setAvatarBusy(true);
    const result = await removeProfileAvatar(profile.id);
    setAvatarBusy(false);
    if (result.error) {
      setFormError(result.error);
      return;
    }
    await refreshProfile();
    setSaveMessage('Profile photo removed.');
  };

  const onSubmit = handleSubmit(
    async (values) => {
      if (!profile?.id) {
        setFormError('Sign in to update your profile.');
        return;
      }

      setFormError(undefined);
      setSaveMessage(undefined);

      const result = await saveProfile(profile.id, values);
      if (result.error) {
        setFormError(result.error);
        return;
      }

      await refreshProfile();
      setSaveMessage('Profile saved.');
    },
    () => {
      // Field-level messages are listed by the summary, so drop any stale save error.
      setFormError(undefined);
      setSaveMessage(undefined);
    },
  );

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <View style={styles.avatarRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Change profile photo"
          onPress={() => void onChangePhoto()}
          disabled={avatarBusy}
          style={({ pressed }) => [pressed && styles.avatarPressed]}>
          <Avatar uri={profile?.avatar_url} name={profile?.display_name} size={72} />
        </Pressable>
        <View style={styles.avatarMeta}>
          <Text style={styles.displayName}>{profile?.display_name ?? 'Player'}</Text>
          <Pressable onPress={() => void onChangePhoto()} disabled={avatarBusy}>
            <Text style={styles.photoLink}>
              {avatarBusy ? 'Updating photo…' : profile?.avatar_url ? 'Change photo' : 'Add photo'}
            </Text>
          </Pressable>
          {profile?.avatar_url ? (
            <Pressable onPress={() => void onRemovePhoto()} disabled={avatarBusy}>
              <Text style={styles.removePhotoLink}>Remove photo</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

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

      <FormErrorSummary formError={formError} errors={errors} labels={FIELD_LABELS} />
      {saveMessage ? <Text style={styles.saveMessage}>{saveMessage}</Text> : null}

      <FieldLabel invalid={Boolean(errors.displayName)}>Display name</FieldLabel>
      <Controller
        control={control}
        name="displayName"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <TextField
            value={value}
            onChangeText={onChange}
            placeholder="How other players know you"
            autoCapitalize="words"
            error={error?.message}
            accessibilityLabel="Display name"
          />
        )}
      />

      <FieldLabel invalid={Boolean(errors.city)}>City</FieldLabel>
      <Controller
        control={control}
        name="city"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <TextField
            value={value ?? ''}
            onChangeText={onChange}
            placeholder="Mobile, AL"
            autoCapitalize="words"
            error={error?.message}
            accessibilityLabel="City"
          />
        )}
      />

      <FieldLabel invalid={Boolean(errors.skillLevel)}>
        Pickleball skill (self-reported)
      </FieldLabel>
      <Controller
        control={control}
        name="skillLevel"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <>
            <SkillPicker value={value} onChange={onChange} invalid={Boolean(error)} />
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
        <PrimaryButton label="Manage courts" onPress={() => router.push(mapTabRoute)} />
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
  avatarPressed: {
    opacity: 0.8,
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
  photoLink: {
    fontSize: 15,
    fontWeight: '700',
    color: brand.accent,
  },
  removePhotoLink: {
    fontSize: 14,
    fontWeight: '600',
    color: brand.muted,
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
