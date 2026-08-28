import type { SessionType, SkillLevel } from '@pickleballcx/shared';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import {
  RADIUS_FILTER_ANY,
  SESSION_TYPE_FILTER_ANY,
  SKILL_FILTER_ANY,
  toEventSearchRow,
  type EventSearchFilter,
  type EventSearchRow,
  type SearchEventsRpcRow,
} from '@/lib/event-search';
import { supabase } from '@/lib/supabase';

import { queryKeys } from './query-keys';

export function useSearchEvents(filter: EventSearchFilter) {
  const search = filter.search?.trim() || undefined;
  const skill = filter.skill && filter.skill !== SKILL_FILTER_ANY ? filter.skill : undefined;
  const sessionType =
    filter.sessionType && filter.sessionType !== SESSION_TYPE_FILTER_ANY
      ? filter.sessionType
      : undefined;
  // A radius is meaningless without an origin to measure from.
  const radiusMi =
    filter.radius && filter.radius !== RADIUS_FILTER_ANY && filter.location
      ? filter.radius
      : undefined;

  return useQuery<EventSearchRow[]>({
    queryKey: queryKeys.events.search({
      search,
      skill,
      sessionType,
      radiusMi,
      lat: filter.location?.lat,
      lng: filter.location?.lng,
      excludeUserId: filter.excludeUserId,
    }),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('search_events', {
        viewer_lat: filter.location?.lat ?? undefined,
        viewer_lng: filter.location?.lng ?? undefined,
        radius_mi: radiusMi,
        search_query: search,
        skill_filter: skill as SkillLevel | undefined,
        session_type_filter: sessionType as SessionType | undefined,
        exclude_user_id: filter.excludeUserId ?? undefined,
      });

      if (error) throw error;
      return ((data ?? []) as SearchEventsRpcRow[]).map(toEventSearchRow);
    },
    // Each filter change is a new cache key; keep showing the last results so the
    // feed does not collapse to a spinner and steal focus from the search input.
    placeholderData: keepPreviousData,
  });
}
