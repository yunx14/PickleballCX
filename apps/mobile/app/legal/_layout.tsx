import { Stack } from 'expo-router';

import { stackScreenOptions } from '@/constants/navigation';

export default function LegalLayout() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="privacy" options={{ title: 'Privacy Policy' }} />
      <Stack.Screen name="terms" options={{ title: 'Terms of Service' }} />
    </Stack>
  );
}
