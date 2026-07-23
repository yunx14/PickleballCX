import type { GroupMemberRole, SkillLevel } from '@pickleballcx/shared';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

import { queryKeys } from './query-keys';

export interface GroupMember {
  user_id: string;
  role: GroupMemberRole;
  joined_at: string;
  display_name: string;
  skill_level: SkillLevel | null;
  avatar_url: string | null;
}

async function fetchGroupMembers(groupId: string): Promise<GroupMember[]> {
  const { data, error } = await supabase
    .from('group_members')
    .select(
      `
      user_id,
      role,
      joined_at,
      profiles (
        display_name,
        skill_level,
        avatar_url
      )
    `,
    )
    .eq('group_id', groupId)
    .order('joined_at', { ascending: true });

  if (error) throw error;

  return (data ?? [])
    .map((row) => {
      const profile = row.profiles;
      if (!profile || Array.isArray(profile)) return null;
      return {
        user_id: row.user_id,
        role: row.role,
        joined_at: row.joined_at,
        display_name: profile.display_name,
        skill_level: profile.skill_level,
        avatar_url: profile.avatar_url,
      };
    })
    .filter((member): member is GroupMember => member !== null);
}

export function useGroupMembers(groupId: string) {
  return useQuery({
    queryKey: queryKeys.groups.members(groupId),
    queryFn: () => fetchGroupMembers(groupId),
    enabled: !!groupId,
  });
}
