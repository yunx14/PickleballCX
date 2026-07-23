import * as Location from 'expo-location';
import { useQuery } from '@tanstack/react-query';

import type { Coordinates } from '@/lib/geo';

import { queryKeys } from './query-keys';

export type LocationStatus = 'granted' | 'denied' | 'unavailable';

export interface UserLocationResult {
  coords: Coordinates | null;
  status: LocationStatus;
}

async function fetchUserLocation(): Promise<UserLocationResult> {
  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) {
    return { coords: null, status: 'unavailable' };
  }

  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== Location.PermissionStatus.GRANTED) {
    return { coords: null, status: 'denied' };
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    coords: {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    },
    status: 'granted',
  };
}

export function useUserLocation() {
  return useQuery({
    queryKey: queryKeys.location.current(),
    queryFn: fetchUserLocation,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
