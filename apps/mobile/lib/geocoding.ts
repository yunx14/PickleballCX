import type { Coordinates } from '@/lib/geo';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

export class GeocodingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeocodingError';
  }
}

async function geocodeWithMapbox(address: string, token: string): Promise<Coordinates | null> {
  const encoded = encodeURIComponent(address.trim());
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${token}&limit=1`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new GeocodingError('Mapbox geocoding request failed');
  }

  const payload = (await response.json()) as {
    features?: Array<{ center?: [number, number] }>;
  };

  const center = payload.features?.[0]?.center;
  if (!center) return null;

  return { lng: center[0], lat: center[1] };
}

async function geocodeWithNominatim(address: string): Promise<Coordinates | null> {
  const params = new URLSearchParams({
    q: address.trim(),
    format: 'json',
    limit: '1',
  });

  const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'PickleballCX/1.0 (mobile app)',
    },
  });

  if (!response.ok) {
    throw new GeocodingError('OpenStreetMap geocoding request failed');
  }

  const results = (await response.json()) as Array<{ lat: string; lon: string }>;
  const first = results[0];
  if (!first) return null;

  return {
    lat: Number(first.lat),
    lng: Number(first.lon),
  };
}

/** Resolve a street address to WGS84 coordinates. */
export async function geocodeAddress(address: string): Promise<Coordinates> {
  const trimmed = address.trim();
  if (!trimmed) {
    throw new GeocodingError('Enter an address to geocode');
  }

  const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim();

  let coords: Coordinates | null = null;

  if (mapboxToken) {
    coords = await geocodeWithMapbox(trimmed, mapboxToken);
  }

  if (!coords) {
    coords = await geocodeWithNominatim(trimmed);
  }

  if (!coords || !Number.isFinite(coords.lat) || !Number.isFinite(coords.lng)) {
    throw new GeocodingError(
      'Could not find coordinates for that address. Try a more specific address.',
    );
  }

  return coords;
}
