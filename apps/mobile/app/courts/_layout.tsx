import { Stack } from 'expo-router';

import { stackScreenOptions } from '@/constants/navigation';

export default function CourtsLayout() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="index" options={{ title: 'Courts' }} />
      <Stack.Screen name="new" options={{ title: 'Add court' }} />
      <Stack.Screen name="[courtId]" options={{ title: 'Court' }} />
    </Stack>
  );
}
