import type { Coordinates } from '@/lib/geo';
import { haversineDistanceKm, hasValidCoordinates, milesToKm } from '@/lib/geo';

export function distanceToCoordsKm(
  location: Coordinates | null | undefined,
  coords: { lat: number; lng: number },
): number | null {
  if (!location || !hasValidCoordinates(coords)) return null;
  return haversineDistanceKm(location, coords);
}

export function isWithinRadiusMi(
  location: Coordinates | null | undefined,
  coords: { lat: number; lng: number },
  radiusMi: number,
): boolean {
  if (!location) return true;
  if (!hasValidCoordinates(coords)) return false;
  return haversineDistanceKm(location, coords) <= milesToKm(radiusMi);
}
