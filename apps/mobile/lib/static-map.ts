import { hasValidCoordinates, type Coordinates } from './geo';
import { getGoogleMapsApiKey } from './google-maps';

const MAP_PIN_COLOR = '0xA3FF00';

/** Google Maps Static API — used on web and as fallback when MapView is unavailable. */
export function getGoogleStaticMapUrl(
  coords: Coordinates,
  options?: { width?: number; height?: number; zoom?: number },
): string | null {
  if (!hasValidCoordinates(coords)) return null;

  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) return null;

  const width = options?.width ?? 600;
  const height = options?.height ?? 280;
  const zoom = options?.zoom ?? 14;
  const { lat, lng } = coords;

  const params = new URLSearchParams({
    center: `${lat},${lng}`,
    zoom: String(zoom),
    size: `${width}x${height}`,
    scale: '2',
    markers: `color:${MAP_PIN_COLOR}|${lat},${lng}`,
    key: apiKey,
  });

  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
}

/** Overview map with one pin per court — used on web where MapView is unavailable. */
export function getGoogleStaticMapUrlForCourts(
  courts: Array<{ lat: number; lng: number }>,
  options?: { width?: number; height?: number; user?: Coordinates | null },
): string | null {
  const pins = courts.filter((court) => hasValidCoordinates(court)).slice(0, 25);
  if (!pins.length) return null;

  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) return null;

  const width = options?.width ?? 640;
  const height = options?.height ?? 400;
  const markerLocations = pins.map((court) => `${court.lat},${court.lng}`).join('|');

  const params = new URLSearchParams({
    size: `${width}x${height}`,
    scale: '2',
    markers: `color:${MAP_PIN_COLOR}|${markerLocations}`,
    key: apiKey,
  });

  const user = options?.user;
  if (user && hasValidCoordinates(user)) {
    params.append('markers', `color:0x4285F4|${user.lat},${user.lng}`);
  }

  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
}
