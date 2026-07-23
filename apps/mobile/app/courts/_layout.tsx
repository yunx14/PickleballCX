import { Stack } from 'expo-router';

import { brand } from '@/constants/brand';

export default function CourtsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: brand.sand },
        headerTintColor: brand.green900,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: brand.sand },
      }}>
      <Stack.Screen name="index" options={{ title: 'Courts' }} />
      <Stack.Screen name="new" options={{ title: 'Add court' }} />
      <Stack.Screen name="[courtId]" options={{ title: 'Court' }} />
    </Stack>
  );
}
