import { zodResolver } from '@hookform/resolvers/zod';
import { createAnnouncementSchema, type CreateAnnouncementInput } from '@pickleballcx/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { FormErrorSummary, type FieldLabels } from '@/components/ui/FormErrorSummary';
import {
  ErrorText,
  FieldLabel,
  PrimaryButton,
  TextField,
  invalidInputStyle,
} from '@/components/ui/Screen';
import { brand } from '@/constants/brand';
import { useCreateGroupAnnouncement } from '@/hooks/useGroupAnnouncements';
import { groupAnnouncementsRoute } from '@/lib/routes';

const FIELD_LABELS: FieldLabels = {
  title: 'Title',
  body: 'Message',
};

export default function NewGroupAnnouncementScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const groupId = id!;
  const [formError, setFormError] = useState<string>();
  const createAnnouncement = useCreateGroupAnnouncement(groupId);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<CreateAnnouncementInput>({
    resolver: zodResolver(createAnnouncementSchema),
    defaultValues: { title: '', body: '', pinned: false },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(undefined);

    try {
      await createAnnouncement.mutateAsync(values);
      router.replace(groupAnnouncementsRoute(groupId));
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not post announcement');
    }
  });

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <FormErrorSummary formError={formError} errors={errors} labels={FIELD_LABELS} />

      <FieldLabel invalid={Boolean(errors.title)}>Title</FieldLabel>
      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <TextField
            value={value}
            onChangeText={onChange}
            placeholder="Court change this week"
            autoCapitalize="sentences"
            error={error?.message}
            accessibilityLabel="Title"
          />
        )}
      />

      <FieldLabel invalid={Boolean(errors.body)}>Message</FieldLabel>
      <Controller
        control={control}
        name="body"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <>
            <TextInput
              style={[styles.bodyInput, Boolean(error) && invalidInputStyle]}
              value={value}
              onChangeText={onChange}
              placeholder="Share details with your group…"
              placeholderTextColor={brand.muted}
              multiline
              maxLength={2000}
              textAlignVertical="top"
              accessibilityLabel="Message"
            />
            <ErrorText message={error?.message} />
          </>
        )}
      />

      <Controller
        control={control}
        name="pinned"
        render={({ field: { onChange, value } }) => (
          <Pressable style={styles.pinRow} onPress={() => onChange(!value)}>
            <View style={styles.pinCopy}>
              <Text style={styles.pinLabel}>Pin to top</Text>
              <Text style={styles.pinHint}>Pinned announcements show first on the group home screen.</Text>
            </View>
            <Switch
              value={value}
              onValueChange={onChange}
              trackColor={{ false: brand.borderStrong, true: brand.accent }}
            />
          </Pressable>
        )}
      />

      <PrimaryButton
        label={isSubmitting || createAnnouncement.isPending ? 'Posting…' : 'Post announcement'}
        onPress={onSubmit}
        disabled={isSubmitting || createAnnouncement.isPending}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: brand.background,
    flexGrow: 1,
  },
  bodyInput: {
    backgroundColor: brand.surface,
    borderWidth: 1,
    borderColor: brand.borderStrong,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: brand.text,
    minHeight: 140,
    marginBottom: 16,
  },
  pinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: brand.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: brand.border,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  pinCopy: {
    flex: 1,
    gap: 4,
  },
  pinLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: brand.text,
  },
  pinHint: {
    fontSize: 13,
    lineHeight: 18,
    color: brand.muted,
  },
});
