import { zodResolver } from '@hookform/resolvers/zod';
import { createGroupSchema, generateInviteCode, type CreateGroupInput } from '@pickleballcx/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, StyleSheet } from 'react-native';

import {
  AuthHeading,
  ErrorText,
  FieldLabel,
  PrimaryButton,
  ScreenContainer,
  Subtitle,
  TextField,
} from '@/components/ui/Screen';
import { brand } from '@/constants/brand';
import { useCreateGroup } from '@/hooks/useGroups';
import { groupRoute } from '@/lib/routes';

export default function CreateGroupScreen() {
  const [formError, setFormError] = useState<string>();
  const createGroup = useCreateGroup();
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<CreateGroupInput>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: { name: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(undefined);

    try {
      const group = await createGroup.mutateAsync({
        name: values.name,
        inviteCode: generateInviteCode(),
      });
      router.replace(groupRoute(group.id));
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not create group');
    }
  });

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
      style={styles.scrollView}>
      <ScreenContainer>
        <AuthHeading>Create a group</AuthHeading>
        <Subtitle>
          Start a private crew for your regular pickleball sessions. You will get a shareable invite
          code right away.
        </Subtitle>
        <ErrorText message={formError} />

        <FieldLabel>Group name</FieldLabel>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <>
              <TextField
                value={value}
                onChangeText={onChange}
                placeholder="Tuesday Night Dinkers"
                autoCapitalize="words"
              />
              <ErrorText message={error?.message} />
            </>
          )}
        />

        <PrimaryButton
          label={isSubmitting || createGroup.isPending ? 'Creating…' : 'Create group'}
          onPress={onSubmit}
          disabled={isSubmitting || createGroup.isPending}
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
