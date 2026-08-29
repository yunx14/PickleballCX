import type { SessionType, SkillLevel } from '@pickleballcx/shared';

import type { EventRow } from '@/hooks/useEvents';
import {
  DISCOVERY_RADIUS_OPTIONS_MI,
  SKILL_FILTER_ANY,
  type DiscoveryRadiusMi,
  type SkillFilter,
} from '@/lib/event-filters';
import type { Coordinates } from '@/lib/geo';

export { DISCOVERY_RADIUS_OPTIONS_MI, SKILL_FILTER_ANY };
export type { DiscoveryRadiusMi, SkillFilter };

export const SESSION_TYPE_FILTER_ANY = 'any' as const;
export type SessionTypeFilter = SessionType | typeof SESSION_TYPE_FILTER_ANY;

/** Courts are sparse today, so an unbounded search is the sane default. */
export const RADIUS_FILTER_ANY = 'any' as const;
export type RadiusFilter = DiscoveryRadiusMi | typeof RADIUS_FILTER_ANY;

/** Everything the search sheet edits, and what the feed applies. */
export interface EventSearchFormState {
  skill: SkillFilter;
  sessionType: SessionTypeFilter;
  radius: RadiusFilter;
  /** Blank means search around the viewer instead of a named place. */
  city: string;
}

export const DEFAULT_EVENT_SEARCH_FORM: EventSearchFormState = {
  skill: SKILL_FILTER_ANY,
  sessionType: SESSION_TYPE_FILTER_ANY,
  radius: RADIUS_FILTER_ANY,
  city: '',
};

/** Drives the badge on the search button, so hidden filters stay visible. */
export function countActiveEventFilters(form: EventSearchFormState): number {
  let count = 0;
  if (form.city.trim()) count += 1;
  if (form.skill !== SKILL_FILTER_ANY) count += 1;
  if (form.sessionType !== SESSION_TYPE_FILTER_ANY) count += 1;
  if (form.radius !== RADIUS_FILTER_ANY) count += 1;
  return count;
}

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
  court_id: string;
  starts_at: string;
  duration_minutes: number;
  ends_at: string;
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
    court_id: row.court_id,
    starts_at: row.starts_at,
    duration_minutes: row.duration_minutes,
    ends_at: row.ends_at,
    max_players: row.max_players,
    session_type: row.session_type,
    skill_min: row.skill_min,
    skill_max: row.skill_max,
    description: row.description,
    lat: row.lat,
    lng: row.lng,
    created_by: row.created_by,
    created_at: row.created_at,
    // Discovery never returns cancelled sessions, so these are always clear here.
    cancelled_at: null,
    cancellation_reason: null,
    // Search only returns sessions that have not finished, so attendance is never
    // confirmed for anything in this list.
    attendance_confirmed_at: null,
    courts: row.court_name
      ? {
          name: row.court_name,
          address: row.court_address ?? '',
          num_courts: row.court_num_courts ?? 1,
        }
      : null,
    going_count: row.going_count,
    distance_km: row.distance_km,
  };
}

/** Maps the form the sheet edits onto the arguments the RPC takes. */
export function toEventSearchFilter(
  form: EventSearchFormState,
  location: Coordinates | null,
  excludeUserId?: string,
): EventSearchFilter {
  return {
    skill: form.skill,
    sessionType: form.sessionType,
    radius: form.radius,
    location,
    excludeUserId,
  };
}
