import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { subscribePostgresChanges } from '@/lib/supabase-realtime';
import { useAuth } from '@/providers/AuthProvider';

import { queryKeys } from './query-keys';

export interface EventCommentRow {
  id: string;
  event_id: string;
  user_id: string;
  body: string;
  created_at: string;
  display_name: string;
}

async function fetchEventComments(eventId: string): Promise<EventCommentRow[]> {
  const { data, error } = await supabase
    .from('event_comments')
    .select(
      `
      id,
      event_id,
      user_id,
      body,
      created_at,
      profiles ( display_name )
    `,
    )
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const profile = row.profiles;
    const displayName =
      profile && !Array.isArray(profile) ? profile.display_name : 'Player';

    return {
      id: row.id,
      event_id: row.event_id,
      user_id: row.user_id,
      body: row.body,
      created_at: row.created_at,
      display_name: displayName?.trim() || 'Player',
    };
  });
}

export function useEventComments(eventId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!eventId) return;

    return subscribePostgresChanges(
      `event-comments:${eventId}`,
      {
        event: '*',
        schema: 'public',
        table: 'event_comments',
        filter: `event_id=eq.${eventId}`,
      },
      () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.comments.event(eventId) });
      },
    );
  }, [eventId, queryClient]);

  return useQuery({
    queryKey: queryKeys.comments.event(eventId),
    queryFn: () => fetchEventComments(eventId),
    enabled: !!eventId,
  });
}

export function useCreateEventComment(eventId: string) {
  const queryClient = useQueryClient();
  const { session, profile } = useAuth();

  return useMutation({
    mutationFn: async (body: string) => {
      if (!session?.user.id) throw new Error('Not authenticated');

      const trimmed = body.trim();
      if (!trimmed) throw new Error('Write a comment');

      const { data, error } = await supabase
        .from('event_comments')
        .insert({
          event_id: eventId,
          user_id: session.user.id,
          body: trimmed,
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id as string;
    },
    onMutate: async (body) => {
      if (!session?.user.id) return;

      await queryClient.cancelQueries({ queryKey: queryKeys.comments.event(eventId) });
      const previous = queryClient.getQueryData<EventCommentRow[]>(queryKeys.comments.event(eventId));

      const optimistic: EventCommentRow = {
        id: `optimistic-${Date.now()}`,
        event_id: eventId,
        user_id: session.user.id,
        body: body.trim(),
        created_at: new Date().toISOString(),
        display_name: profile?.display_name?.trim() || 'You',
      };

      queryClient.setQueryData<EventCommentRow[]>(queryKeys.comments.event(eventId), [
        ...(previous ?? []),
        optimistic,
      ]);

      return { previous };
    },
    onError: (_error, _body, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.comments.event(eventId), context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.comments.event(eventId) });
    },
  });
}

export function useDeleteEventComment(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from('event_comments').delete().eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.comments.event(eventId) });
    },
  });
}
