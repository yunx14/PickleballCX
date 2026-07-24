import { Stack } from 'expo-router';

import { brand } from '@/constants/brand';

export default function GroupsStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: brand.background },
        headerShadowVisible: false,
        headerTintColor: brand.text,
        headerTitleStyle: { fontWeight: '800', color: brand.text },
        contentStyle: { backgroundColor: brand.background },
      }}>
      <Stack.Screen name="index" options={{ title: 'Groups' }} />
      <Stack.Screen name="create" options={{ title: 'Create group' }} />
      <Stack.Screen name="join" options={{ title: 'Join group' }} />
    </Stack>
  );
}
