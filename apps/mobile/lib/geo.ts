export interface Coordinates {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance in kilometers between two WGS84 points. */
export function haversineDistanceKm(a: Coordinates, b: Coordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function kmToMiles(km: number): number {
  return km * 0.621371;
}

export function milesToKm(miles: number): number {
  return miles / 0.621371;
}

export function formatDistanceMiles(km: number): string {
  const miles = kmToMiles(km);
  if (miles < 10) return `${miles.toFixed(1)} mi away`;
  return `${Math.round(miles)} mi away`;
}

export function hasValidCoordinates(coords: Coordinates | null | undefined): boolean {
  if (!coords) return false;
  if (coords.lat === 0 && coords.lng === 0) return false;
  return Number.isFinite(coords.lat) && Number.isFinite(coords.lng);
}
