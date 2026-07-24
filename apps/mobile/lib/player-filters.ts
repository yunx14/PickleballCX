import type { PlayFormat, RankedPreference, SkillLevel } from '@pickleballcx/shared';

import { DISCOVERY_RADIUS_OPTIONS_MI, type DiscoveryRadiusMi } from '@/lib/event-filters';

export type { DiscoveryRadiusMi };
export { DISCOVERY_RADIUS_OPTIONS_MI };

export const SKILL_FILTER_ANY = 'any' as const;
export type SkillFilter = SkillLevel | typeof SKILL_FILTER_ANY;

export const FORMAT_FILTER_ANY = 'any' as const;
export type FormatFilter = PlayFormat | typeof FORMAT_FILTER_ANY;

export interface DiscoverPlayerRow {
  id: string;
  display_name: string;
  city: string | null;
  skill_level: SkillLevel;
  play_format: PlayFormat;
  ranked_preference: RankedPreference;
  available_now: boolean;
  distance_km: number | null;
}

export interface DiscoverPlayersFilter {
  search?: string;
  skill?: SkillFilter;
  format?: FormatFilter;
  radiusMi?: DiscoveryRadiusMi;
  viewerLat?: number | null;
  viewerLng?: number | null;
}

const SKILL_RANK: Record<SkillLevel, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

function formatsCompatible(viewer: PlayFormat, player: PlayFormat): boolean {
  if (viewer === 'either' || player === 'either') return true;
  if (viewer === player) return true;
  if (
    (viewer === 'doubles' || viewer === 'mixed') &&
    (player === 'doubles' || player === 'mixed')
  ) {
    return true;
  }
  return false;
}

/** Simple Phase A match score (0–100) using skill bands, format, distance, availability. */
export function computeMatchFit(
  viewer: {
    skill_level: SkillLevel | null;
    play_format: PlayFormat;
  },
  player: DiscoverPlayerRow,
  radiusMi: DiscoveryRadiusMi,
): number {
  let score = 0;

  if (viewer.skill_level && player.skill_level) {
    const delta = Math.abs(SKILL_RANK[viewer.skill_level] - SKILL_RANK[player.skill_level]);
    if (delta === 0) score += 40;
    else if (delta === 1) score += 28;
    else score += 12;
  } else {
    score += 20;
  }

  score += formatsCompatible(viewer.play_format, player.play_format) ? 30 : 10;

  if (player.distance_km != null && radiusMi > 0) {
    const maxKm = radiusMi / 0.621371;
    const distanceScore = Math.max(0, 1 - player.distance_km / maxKm) * 30;
    score += distanceScore;
  } else {
    score += 15;
  }

  if (player.available_now) score += 10;

  return Math.min(100, Math.round(score));
}

export function formatPlayerLocation(player: DiscoverPlayerRow): string {
  const city = player.city?.trim();
  if (!city) return 'City not set';
  if (player.distance_km == null) return city;
  const miles = player.distance_km * 0.621371;
  const distance =
    miles < 10 ? `${miles.toFixed(1)} miles away` : `${Math.round(miles)} miles away`;
  return `${city} · ${distance}`;
}
