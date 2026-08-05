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
