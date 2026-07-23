import { Stack } from 'expo-router';

import { brand } from '@/constants/brand';

export default function SessionsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: brand.sand },
        headerTintColor: brand.green900,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: brand.sand },
      }}
    />
  );
}
