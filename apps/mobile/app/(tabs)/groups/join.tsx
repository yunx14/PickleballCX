import { zodResolver } from '@hookform/resolvers/zod';
import { joinGroupSchema, type JoinGroupInput } from '@pickleballcx/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { FormErrorSummary, type FieldLabels } from '@/components/ui/FormErrorSummary';
import {
  AuthHeading,
  FieldLabel,
  PrimaryButton,
  ScreenContainer,
  Subtitle,
  TextField,
} from '@/components/ui/Screen';
import { brand } from '@/constants/brand';
import { useGroupPreview, useJoinGroup } from '@/hooks/useGroups';
import { groupRoute } from '@/lib/routes';

const FIELD_LABELS: FieldLabels = {
  inviteCode: 'Invite code',
};

export default function JoinGroupScreen() {
  const [formError, setFormError] = useState<string>();
  const joinGroup = useJoinGroup();
  const {
    control,
    handleSubmit,
    watch,
    formState: { isSubmitting, errors },
  } = useForm<JoinGroupInput>({
    resolver: zodResolver(joinGroupSchema),
    defaultValues: { inviteCode: '' },
  });

  const inviteCode = watch('inviteCode');
  const { data: preview, isFetching: isPreviewLoading } = useGroupPreview(inviteCode);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(undefined);

    try {
      const groupId = await joinGroup.mutateAsync(values.inviteCode);
      router.replace(groupRoute(groupId));
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not join group');
    }
  });

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
      style={styles.scrollView}>
      <ScreenContainer>
        <AuthHeading>Join a group</AuthHeading>
        <Subtitle>Enter the invite code from your group admin to join their pickleball crew.</Subtitle>
        <FormErrorSummary formError={formError} errors={errors} labels={FIELD_LABELS} />

        <FieldLabel invalid={Boolean(errors.inviteCode)}>Invite code</FieldLabel>
        <Controller
          control={control}
          name="inviteCode"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <TextField
              value={value}
              onChangeText={(text) => onChange(text.toUpperCase())}
              placeholder="ABCD1234"
              autoCapitalize="characters"
              error={error?.message}
              accessibilityLabel="Invite code"
            />
          )}
        />

        {inviteCode.trim().length >= 4 && (
          <View style={styles.previewCard}>
            {isPreviewLoading ? (
              <Text style={styles.previewText}>Looking up group…</Text>
            ) : preview ? (
              <>
                <Text style={styles.previewLabel}>You are joining</Text>
                <Text style={styles.previewName}>{preview.name}</Text>
              </>
            ) : (
              <Text style={styles.previewError}>No group found for that code</Text>
            )}
          </View>
        )}

        <PrimaryButton
          label={isSubmitting || joinGroup.isPending ? 'Joining…' : 'Join group'}
          onPress={onSubmit}
          disabled={isSubmitting || joinGroup.isPending || !preview}
        />
      </ScreenContainer>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  previewCard: {
    backgroundColor: brand.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: brand.border,
    padding: 16,
    marginBottom: 8,
  },
  previewLabel: {
    fontSize: 13,
    color: brand.muted,
    marginBottom: 4,
  },
  previewName: {
    fontSize: 18,
    fontWeight: '700',
    color: brand.text,
  },
  previewText: {
    fontSize: 15,
    color: brand.muted,
  },
  previewError: {
    fontSize: 15,
    color: brand.danger,
  },
  scrollView: {
    backgroundColor: brand.background,
  },
  scroll: {
    flexGrow: 1,
  },
});
