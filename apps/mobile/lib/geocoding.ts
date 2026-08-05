import type { Coordinates } from '@/lib/geo';

import { getGoogleMapsApiKey } from './google-maps';

export class GeocodingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeocodingError';
  }
}

interface GoogleGeocodeResponse {
  status: string;
  results?: Array<{
    geometry?: {
      location?: {
        lat?: number;
        lng?: number;
      };
    };
  }>;
  error_message?: string;
}

async function geocodeWithGoogle(address: string, apiKey: string): Promise<Coordinates | null> {
  const params = new URLSearchParams({
    address: address.trim(),
    key: apiKey,
  });

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`,
  );

  if (!response.ok) {
    throw new GeocodingError('Google geocoding request failed');
  }

  const payload = (await response.json()) as GoogleGeocodeResponse;

  if (payload.status === 'ZERO_RESULTS') {
    return null;
  }

  if (payload.status !== 'OK') {
    throw new GeocodingError(
      payload.error_message ?? `Google geocoding failed (${payload.status})`,
    );
  }

  const location = payload.results?.[0]?.geometry?.location;
  if (location?.lat == null || location?.lng == null) {
    return null;
  }

  return { lat: location.lat, lng: location.lng };
}

/** Resolve a street address to WGS84 coordinates. */
export async function geocodeAddress(address: string): Promise<Coordinates> {
  const trimmed = address.trim();
  if (!trimmed) {
    throw new GeocodingError('Enter an address to geocode');
  }

  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    throw new GeocodingError(
      'Google Maps API key is not configured. Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in apps/mobile/.env',
    );
  }

  const coords = await geocodeWithGoogle(trimmed, apiKey);

  if (!coords || !Number.isFinite(coords.lat) || !Number.isFinite(coords.lng)) {
    throw new GeocodingError(
      'Could not find coordinates for that address. Try a more specific address.',
    );
  }

  return coords;
}

/** Resolve a city name to approximate WGS84 coordinates (city center). */
export async function geocodeCity(city: string): Promise<Coordinates> {
  const trimmed = city.trim();
  if (!trimmed) {
    throw new GeocodingError('Enter a city to geocode');
  }

  return geocodeAddress(trimmed);
}
