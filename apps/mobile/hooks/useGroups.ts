import type { GroupMemberRole } from '@pickleballcx/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

import { queryKeys } from './query-keys';

export interface UserGroup {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
  created_by: string;
  role: GroupMemberRole;
  joined_at: string;
}

async function fetchUserGroups(userId: string): Promise<UserGroup[]> {
  const { data, error } = await supabase
    .from('group_members')
    .select(
      `
      group_id,
      role,
      joined_at,
      groups (
        id,
        name,
        invite_code,
        created_at,
        created_by
      )
    `,
    )
    .eq('user_id', userId)
    .order('joined_at', { ascending: false });

  if (error) throw error;

  return (data ?? [])
    .map((row) => {
      const group = row.groups;
      if (!group || Array.isArray(group)) return null;
      return {
        id: group.id,
        name: group.name,
        invite_code: group.invite_code,
        created_at: group.created_at,
        created_by: group.created_by,
        role: row.role,
        joined_at: row.joined_at,
      };
    })
    .filter((group): group is UserGroup => group !== null);
}

export function useGroups() {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: queryKeys.groups.list(userId),
    queryFn: () => fetchUserGroups(userId!),
    enabled: !!userId,
  });
}

export function useInvalidateGroups() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.groups.list(session?.user.id) });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async ({ name, inviteCode }: { name: string; inviteCode: string }) => {
      if (!session?.user.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('groups')
        .insert({
          name,
          invite_code: inviteCode,
          created_by: session.user.id,
        })
        .select('id, name, invite_code, created_at, created_by')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.groups.list(session?.user.id) });
    },
  });
}

export function useJoinGroup() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      const { data, error } = await supabase.rpc('join_group_by_invite_code', {
        p_invite_code: inviteCode,
      });

      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.groups.list(session?.user.id) });
    },
  });
}

export function useGroupPreview(inviteCode: string) {
  const normalized = inviteCode.trim().toUpperCase();

  return useQuery({
    queryKey: [...queryKeys.groups.all, 'preview', normalized] as const,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_group_preview_by_invite_code', {
        p_invite_code: normalized,
      });

      if (error) throw error;
      return data?.[0] ?? null;
    },
    enabled: normalized.length >= 4,
  });
}

export function useGroup(groupId: string) {
  return useQuery({
    queryKey: queryKeys.groups.detail(groupId),
    queryFn: async () => {
      const { data, error } = await supabase.from('groups').select('*').eq('id', groupId).single();

      if (error) throw error;
      return data;
    },
    enabled: !!groupId,
  });
}
