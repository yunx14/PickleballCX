import type { SkillLevel } from '@pickleballcx/shared';

import type { EventRow } from '@/hooks/useEvents';
import {
  type Coordinates,
  haversineDistanceKm,
  hasValidCoordinates,
  milesToKm,
} from '@/lib/geo';

const SKILL_RANK: Record<SkillLevel, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

export const DISCOVERY_RADIUS_OPTIONS_MI = [25, 50, 100] as const;
export type DiscoveryRadiusMi = (typeof DISCOVERY_RADIUS_OPTIONS_MI)[number];

export const SKILL_FILTER_ANY = 'any' as const;
export type SkillFilter = SkillLevel | typeof SKILL_FILTER_ANY;

export interface UpcomingEventsFilter {
  userId?: string;
  userSkill?: SkillLevel | null;
  location?: Coordinates | null;
  radiusMi?: DiscoveryRadiusMi;
}

export function skillMatchesEvent(
  userSkill: SkillLevel | null | undefined,
  skillMin: SkillLevel | null,
  skillMax: SkillLevel | null,
): boolean {
  if (!skillMin && !skillMax) return true;
  if (!userSkill) return true;

  const userRank = SKILL_RANK[userSkill];
  const minRank = skillMin ? SKILL_RANK[skillMin] : 0;
  const maxRank = skillMax ? SKILL_RANK[skillMax] : 2;
  return userRank >= minRank && userRank <= maxRank;
}

export function filterUpcomingEvents(
  events: EventRow[],
  filter: UpcomingEventsFilter,
): EventRow[] {
  const radiusKm =
    filter.radiusMi != null ? milesToKm(filter.radiusMi) : undefined;

  return events.filter((event) => {
    if (!filter.location || radiusKm == null) return true;

    if (event.lat == null || event.lng == null) return true;

    const eventCoords: Coordinates = { lat: event.lat, lng: event.lng };
    if (!hasValidCoordinates(eventCoords)) return true;

    return haversineDistanceKm(filter.location, eventCoords) <= radiusKm;
  });
}

export function distanceToEventKm(
  location: Coordinates | null | undefined,
  event: EventRow,
): number | null {
  if (!location || event.lat == null || event.lng == null) return null;
  const eventCoords: Coordinates = { lat: event.lat, lng: event.lng };
  if (!hasValidCoordinates(eventCoords)) return null;
  return haversineDistanceKm(location, eventCoords);
}
