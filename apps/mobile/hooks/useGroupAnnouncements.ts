import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { subscribePostgresChanges } from '@/lib/supabase-realtime';
import { useAuth } from '@/providers/AuthProvider';

import { queryKeys } from './query-keys';

export interface GroupAnnouncementRow {
  id: string;
  group_id: string;
  author_id: string;
  title: string;
  body: string;
  pinned: boolean;
  created_at: string;
  author_name: string;
}

async function fetchGroupAnnouncements(groupId: string): Promise<GroupAnnouncementRow[]> {
  const { data, error } = await supabase
    .from('group_announcements')
    .select(
      `
      id,
      group_id,
      author_id,
      title,
      body,
      pinned,
      created_at,
      profiles ( display_name )
    `,
    )
    .eq('group_id', groupId)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const profile = row.profiles;
    const authorName =
      profile && !Array.isArray(profile) ? profile.display_name : 'Admin';

    return {
      id: row.id,
      group_id: row.group_id,
      author_id: row.author_id,
      title: row.title,
      body: row.body,
      pinned: row.pinned,
      created_at: row.created_at,
      author_name: authorName?.trim() || 'Admin',
    };
  });
}

export function useGroupAnnouncements(groupId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!groupId) return;

    return subscribePostgresChanges(
      `group-announcements:${groupId}`,
      {
        event: '*',
        schema: 'public',
        table: 'group_announcements',
        filter: `group_id=eq.${groupId}`,
      },
      () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.announcements.group(groupId) });
      },
    );
  }, [groupId, queryClient]);

  return useQuery({
    queryKey: queryKeys.announcements.group(groupId),
    queryFn: () => fetchGroupAnnouncements(groupId),
    enabled: !!groupId,
  });
}

export function useCreateGroupAnnouncement(groupId: string) {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async (input: { title: string; body: string; pinned?: boolean }) => {
      if (!session?.user.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('group_announcements')
        .insert({
          group_id: groupId,
          author_id: session.user.id,
          title: input.title.trim(),
          body: input.body.trim(),
          pinned: input.pinned ?? false,
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.announcements.group(groupId) });
    },
  });
}

export function useDeleteGroupAnnouncement(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (announcementId: string) => {
      const { error } = await supabase
        .from('group_announcements')
        .delete()
        .eq('id', announcementId);

      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.announcements.group(groupId) });
    },
  });
}
