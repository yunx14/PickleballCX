import { router, useLocalSearchParams } from 'expo-router';

import {
  AuthBrandMark,
  AuthHeading,
  PrimaryButton,
  ScreenContainer,
  Subtitle,
} from '@/components/ui/Screen';

export default function ConfirmEmailScreen() {
  const { email } = useLocalSearchParams<{ email?: string }>();

  return (
    <ScreenContainer>
      <AuthBrandMark />
      <AuthHeading>Check your email</AuthHeading>
      <Subtitle>
        {email
          ? `We sent a confirmation link to ${email}. Open it to activate your account, then sign in to finish setting up your profile.`
          : 'We sent a confirmation link to your email. Open it to activate your account, then sign in to finish setting up your profile.'}
      </Subtitle>
      <PrimaryButton label="Go to sign in" onPress={() => router.replace('/(auth)/login')} />
    </ScreenContainer>
  );
}
