import { Stack } from 'expo-router';

import { brand } from '@/constants/brand';

export default function GroupsStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: brand.sand },
        headerTintColor: brand.green900,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: brand.sand },
      }}>
      <Stack.Screen name="index" options={{ title: 'Groups' }} />
      <Stack.Screen name="create" options={{ title: 'Create group' }} />
      <Stack.Screen name="join" options={{ title: 'Join group' }} />
    </Stack>
  );
}
