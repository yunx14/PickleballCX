import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { geocodeCity } from '@/lib/geocoding';
import type { Coordinates } from '@/lib/geo';
import { hasValidCoordinates } from '@/lib/geo';
import { useAuth } from '@/providers/AuthProvider';

import { useDebouncedValue } from './useDebouncedValue';
import { useUserLocation } from './useUserLocation';

export type SearchLocationMode = 'near_me' | 'city';

export interface SearchLocationState {
  mode: SearchLocationMode;
  /** Coordinates to search around, or null when none could be resolved. */
  coords: Coordinates | null;
  /** Human readable description of where we are searching. */
  label: string;
  city: string;
  setCity: (city: string) => void;
  useNearMe: () => void;
  useCityMode: () => void;
  isResolving: boolean;
  error?: string;
}

/**
 * Resolves where to search for games: the device's GPS, or a typed city geocoded
 * to coordinates. Falls back to the profile's saved city when GPS is unavailable,
 * so denying location permission still yields distances.
 */
export function useSearchLocation(): SearchLocationState {
  const { profile } = useAuth();
  const [mode, setMode] = useState<SearchLocationMode>('near_me');
  const [city, setCity] = useState('');

  const { data: locationResult } = useUserLocation();
  const gpsCoords = locationResult?.coords ?? null;

  const profileCoords = useMemo<Coordinates | null>(() => {
    if (profile?.city_lat == null || profile?.city_lng == null) return null;
    const coords = { lat: profile.city_lat, lng: profile.city_lng };
    return hasValidCoordinates(coords) ? coords : null;
  }, [profile?.city_lat, profile?.city_lng]);

  // Debounced so typing a city does not fire a billable geocode per keystroke.
  const debouncedCity = useDebouncedValue(city.trim(), 500);
  const cityQueryEnabled = mode === 'city' && debouncedCity.length >= 3;

  const {
    data: cityCoords,
    isFetching: isGeocoding,
    error: geocodeError,
  } = useQuery({
    // Keyed on the normalized city so repeat searches reuse the cached result.
    queryKey: ['geocode', 'city', debouncedCity.toLowerCase()],
    queryFn: () => geocodeCity(debouncedCity),
    enabled: cityQueryEnabled,
    staleTime: 24 * 60 * 60 * 1000,
    retry: false,
  });

  if (mode === 'city') {
    return {
      mode,
      coords: cityCoords ?? null,
      label: debouncedCity || 'Choose a city',
      city,
      setCity,
      useNearMe: () => {
        setMode('near_me');
        setCity('');
      },
      useCityMode: () => setMode('city'),
      isResolving: isGeocoding,
      error: geocodeError
        ? 'We could not find that city. Try "Austin, TX" or "Mobile, AL".'
        : undefined,
    };
  }

  const coords = gpsCoords ?? profileCoords;
  const label = gpsCoords
    ? 'Near me'
    : profileCoords
      ? `${profile?.city ?? 'Your city'} (profile)`
      : 'Location unavailable';

  return {
    mode,
    coords,
    label,
    city,
    setCity,
    useNearMe: () => setMode('near_me'),
    useCityMode: () => setMode('city'),
    isResolving: false,
    error: undefined,
  };
}
