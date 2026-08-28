import type { EventVisibility, SessionType, SkillLevel } from '@pickleballcx/shared';

import type { EventRow } from '@/hooks/useEvents';
import { DISCOVERY_RADIUS_OPTIONS_MI, type DiscoveryRadiusMi } from '@/lib/event-filters';
import { SKILL_FILTER_ANY, type SkillFilter } from '@/lib/player-filters';
import type { Coordinates } from '@/lib/geo';

export { DISCOVERY_RADIUS_OPTIONS_MI, SKILL_FILTER_ANY };
export type { DiscoveryRadiusMi, SkillFilter };

export const SESSION_TYPE_FILTER_ANY = 'any' as const;
export type SessionTypeFilter = SessionType | typeof SESSION_TYPE_FILTER_ANY;

/** Courts are sparse today, so an unbounded search is the sane default. */
export const RADIUS_FILTER_ANY = 'any' as const;
export type RadiusFilter = DiscoveryRadiusMi | typeof RADIUS_FILTER_ANY;

export interface EventSearchFilter {
  search?: string;
  skill?: SkillFilter;
  sessionType?: SessionTypeFilter;
  radius?: RadiusFilter;
  location?: Coordinates | null;
  /** Hides games this user created or already responded to. */
  excludeUserId?: string;
}

/** Flat row shape returned by the search_events RPC. */
export interface SearchEventsRpcRow {
  id: string;
  group_id: string | null;
  court_id: string;
  visibility: EventVisibility;
  starts_at: string;
  max_players: number | null;
  session_type: SessionType;
  skill_min: SkillLevel | null;
  skill_max: SkillLevel | null;
  description: string | null;
  lat: number | null;
  lng: number | null;
  created_by: string;
  created_at: string;
  court_name: string | null;
  court_address: string | null;
  court_num_courts: number | null;
  going_count: number;
  distance_km: number | null;
}

/** EventRow plus the values the RPC computes server-side. */
export type EventSearchRow = EventRow & {
  going_count: number;
  distance_km: number | null;
};

/** Reshapes the RPC's flat court columns into the nested form SessionCard expects. */
export function toEventSearchRow(row: SearchEventsRpcRow): EventSearchRow {
  return {
    id: row.id,
    group_id: row.group_id,
    court_id: row.court_id,
    visibility: row.visibility,
    starts_at: row.starts_at,
    max_players: row.max_players,
    session_type: row.session_type,
    skill_min: row.skill_min,
    skill_max: row.skill_max,
    description: row.description,
    lat: row.lat,
    lng: row.lng,
    created_by: row.created_by,
    created_at: row.created_at,
    courts: row.court_name
      ? {
          name: row.court_name,
          address: row.court_address ?? '',
          num_courts: row.court_num_courts ?? 1,
        }
      : null,
    groups: null,
    going_count: row.going_count,
    distance_km: row.distance_km,
  };
}

export function hasActiveEventFilters(filter: EventSearchFilter): boolean {
  return Boolean(
    filter.search?.trim() ||
      (filter.skill && filter.skill !== SKILL_FILTER_ANY) ||
      (filter.sessionType && filter.sessionType !== SESSION_TYPE_FILTER_ANY) ||
      (filter.radius && filter.radius !== RADIUS_FILTER_ANY),
  );
}
