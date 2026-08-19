import { Redirect } from 'expo-router';

import { mapTabRoute } from '@/lib/routes';

export default function CourtsScreen() {
  return <Redirect href={mapTabRoute} />;
}
