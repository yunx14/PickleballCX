import { zodResolver } from '@hookform/resolvers/zod';
import { createAnnouncementSchema, type CreateAnnouncementInput } from '@pickleballcx/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import {
  ErrorText,
  FieldLabel,
  PrimaryButton,
  TextField,
} from '@/components/ui/Screen';
import { brand } from '@/constants/brand';
import { useCreateGroupAnnouncement } from '@/hooks/useGroupAnnouncements';
import { groupAnnouncementsRoute } from '@/lib/routes';

export default function NewGroupAnnouncementScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const groupId = id!;
  const [formError, setFormError] = useState<string>();
  const createAnnouncement = useCreateGroupAnnouncement(groupId);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
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
      <ErrorText message={formError} />

      <FieldLabel>Title</FieldLabel>
      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <>
            <TextField
              value={value}
              onChangeText={onChange}
              placeholder="Court change this week"
              autoCapitalize="sentences"
            />
            <ErrorText message={error?.message} />
          </>
        )}
      />

      <FieldLabel>Message</FieldLabel>
      <Controller
        control={control}
        name="body"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <>
            <TextInput
              style={styles.bodyInput}
              value={value}
              onChangeText={onChange}
              placeholder="Share details with your group…"
              placeholderTextColor={brand.muted}
              multiline
              maxLength={2000}
              textAlignVertical="top"
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
              trackColor={{ false: '#DEE2E6', true: brand.green700 }}
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
  },
  bodyInput: {
    backgroundColor: brand.white,
    borderWidth: 1,
    borderColor: '#DEE2E6',
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
    backgroundColor: brand.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
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
