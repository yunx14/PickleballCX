import { router, useLocalSearchParams } from 'expo-router';

import {
  PrimaryButton,
  ScreenContainer,
  Subtitle,
  Title,
} from '@/components/ui/Screen';

export default function ConfirmEmailScreen() {
  const { email } = useLocalSearchParams<{ email?: string }>();

  return (
    <ScreenContainer>
      <Title>Check your email</Title>
      <Subtitle>
        {email
          ? `We sent a confirmation link to ${email}. Open it to activate your account, then sign in to finish setting up your profile.`
          : 'We sent a confirmation link to your email. Open it to activate your account, then sign in to finish setting up your profile.'}
      </Subtitle>
      <PrimaryButton label="Go to sign in" onPress={() => router.replace('/(auth)/login')} />
    </ScreenContainer>
  );
}
