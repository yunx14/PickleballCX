import { Stack } from 'expo-router';

import { stackScreenOptions } from '@/constants/navigation';

export default function PlayersLayout() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="requests" options={{ title: 'Match requests' }} />
      <Stack.Screen name="messages/[matchRequestId]" options={{ title: 'Message' }} />
      <Stack.Screen name="invite/[matchRequestId]" options={{ title: 'Invite to session' }} />
    </Stack>
  );
}
