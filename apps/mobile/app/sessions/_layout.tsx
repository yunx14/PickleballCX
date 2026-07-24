import { Stack } from 'expo-router';

import { stackScreenOptions } from '@/constants/navigation';

export default function SessionsLayout() {
  return <Stack screenOptions={stackScreenOptions} />;
}
