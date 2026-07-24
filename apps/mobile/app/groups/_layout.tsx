import { Stack } from 'expo-router';

import { stackScreenOptions } from '@/constants/navigation';

export default function GroupDetailLayout() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="[id]/announcements/index" options={{ title: 'Announcements' }} />
      <Stack.Screen name="[id]/announcements/new" options={{ title: 'New announcement' }} />
    </Stack>
  );
}
