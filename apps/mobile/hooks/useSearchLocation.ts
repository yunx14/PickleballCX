import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { geocodeCity } from '@/lib/geocoding';
import type { Coordinates } from '@/lib/geo';
import { hasValidCoordinates } from '@/lib/geo';
import { useAuth } from '@/providers/AuthProvider';

import { useDebouncedValue } from './useDebouncedValue';
import { useUserLocation } from './useUserLocation';

export interface ResolvedSearchLocation {
  /** Coordinates to search around, or null when none could be resolved. */
  coords: Coordinates | null;
  /** Human readable description of where we are searching. */
  label: string;
  /** True when a typed place is being resolved to coordinates. */
  isResolving: boolean;
  error?: string;
}

/**
 * Resolves where to search for games. A non-empty city is geocoded; a blank one
 * falls back to the device's GPS, then to the profile's saved city, so denying
 * location permission still yields distances.
 *
 * The city is owned by the caller so a draft (the search sheet) and the applied
 * set (the feed) can be resolved side by side off one geocode cache.
 */
export function useSearchLocation({ city }: { city: string }): ResolvedSearchLocation {
  const { profile } = useAuth();

  const { data: locationResult } = useUserLocation();
  const gpsCoords = locationResult?.coords ?? null;

  const profileCoords = useMemo<Coordinates | null>(() => {
    if (profile?.city_lat == null || profile?.city_lng == null) return null;
    const coords = { lat: profile.city_lat, lng: profile.city_lng };
    return hasValidCoordinates(coords) ? coords : null;
  }, [profile?.city_lat, profile?.city_lng]);

  const trimmedCity = city.trim();
  // Debounced so typing a city does not fire a billable geocode per keystroke.
  const debouncedCity = useDebouncedValue(trimmedCity, 500);
  const cityQueryEnabled = debouncedCity.length >= 3;

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

  if (trimmedCity) {
    return {
      coords: cityCoords ?? null,
      label: debouncedCity || trimmedCity,
      isResolving: isGeocoding || debouncedCity !== trimmedCity,
      error: geocodeError
        ? 'We could not find that city. Try "Austin, TX" or "Mobile, AL".'
        : undefined,
    };
  }

  return {
    coords: gpsCoords ?? profileCoords,
    // Phrased to read inside "search around ...".
    label: gpsCoords
      ? 'your current location'
      : profileCoords
        ? (profile?.city?.trim() ?? 'your saved city')
        : 'no location yet',
    isResolving: false,
  };
}
