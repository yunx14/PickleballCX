import type { PlayFormat, SkillLevel } from '@pickleballcx/shared';
import { useQuery } from '@tanstack/react-query';

import type { DiscoverPlayersFilter } from '@/lib/player-filters';
import { FORMAT_FILTER_ANY, SKILL_FILTER_ANY } from '@/lib/player-filters';
import { supabase } from '@/lib/supabase';

import { queryKeys } from './query-keys';

export function useDiscoverPlayers(filter: DiscoverPlayersFilter) {
  return useQuery({
    queryKey: queryKeys.players.discover({
      search: filter.search,
      skill: filter.skill,
      format: filter.format,
      radiusMi: filter.radiusMi,
      viewerLat: filter.viewerLat,
      viewerLng: filter.viewerLng,
    }),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('discover_players', {
        viewer_lat: filter.viewerLat ?? undefined,
        viewer_lng: filter.viewerLng ?? undefined,
        radius_mi: filter.radiusMi ?? undefined,
        search_query: filter.search?.trim() || undefined,
        skill_filter:
          filter.skill && filter.skill !== SKILL_FILTER_ANY
            ? (filter.skill as SkillLevel)
            : undefined,
        format_filter:
          filter.format && filter.format !== FORMAT_FILTER_ANY
            ? (filter.format as PlayFormat)
            : undefined,
      });

      if (error) throw error;
      return data ?? [];
    },
  });
}
