import type { SkillLevel } from '@pickleballcx/shared';

import type { EventRow } from '@/hooks/useEvents';
import {
  type Coordinates,
  haversineDistanceKm,
  hasValidCoordinates,
} from '@/lib/geo';

const SKILL_RANK: Record<SkillLevel, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

export const DISCOVERY_RADIUS_OPTIONS_MI = [25, 50, 100] as const;
export type DiscoveryRadiusMi = (typeof DISCOVERY_RADIUS_OPTIONS_MI)[number];

export interface UpcomingEventsFilter {
  userId?: string;
  userSkill?: SkillLevel | null;
  location?: Coordinates | null;
  radiusMi?: DiscoveryRadiusMi;
}

function skillMatchesEvent(
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

function isPublicStandalone(event: EventRow): boolean {
  return event.group_id == null && event.visibility === 'public';
}

export function filterUpcomingEvents(
  events: EventRow[],
  filter: UpcomingEventsFilter,
): EventRow[] {
  const radiusKm =
    filter.radiusMi != null ? filter.radiusMi / 0.621371 : undefined;

  return events.filter((event) => {
    if (event.group_id) return true;
    if (filter.userId && event.created_by === filter.userId) return true;
    if (!isPublicStandalone(event)) return false;

    if (!skillMatchesEvent(filter.userSkill, event.skill_min, event.skill_max)) {
      return false;
    }

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
