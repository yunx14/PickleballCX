import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { subscribePostgresChanges } from '@/lib/supabase-realtime';
import { useAuth } from '@/providers/AuthProvider';

import { queryKeys } from './query-keys';

async function fetchConversationId(matchRequestId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('player_conversations')
    .select('id')
    .eq('match_request_id', matchRequestId)
    .maybeSingle();

  if (error) throw error;
  return data?.id ?? null;
}

export function usePlayerConversation(matchRequestId: string) {
  return useQuery({
    queryKey: queryKeys.playerMessages.byMatchRequest(matchRequestId),
    queryFn: () => fetchConversationId(matchRequestId),
    enabled: !!matchRequestId,
  });
}

export interface PlayerMessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  sender_display_name: string;
  is_own: boolean;
}

async function fetchPlayerMessages(
  conversationId: string,
  viewerId: string,
): Promise<PlayerMessageRow[]> {
  const { data, error } = await supabase
    .from('player_messages')
    .select(
      `
      id,
      conversation_id,
      sender_id,
      body,
      created_at,
      profiles ( display_name )
    `,
    )
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const profile = row.profiles;
    const displayName =
      profile && !Array.isArray(profile) ? profile.display_name : 'Player';

    return {
      id: row.id,
      conversation_id: row.conversation_id,
      sender_id: row.sender_id,
      body: row.body,
      created_at: row.created_at,
      sender_display_name: displayName?.trim() || 'Player',
      is_own: row.sender_id === viewerId,
    };
  });
}

export function usePlayerMessages(conversationId?: string | null) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;

    return subscribePostgresChanges(
      `player-messages:${conversationId}`,
      {
        event: '*',
        schema: 'public',
        table: 'player_messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      () => {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.playerMessages.conversation(conversationId),
        });
      },
    );
  }, [conversationId, queryClient]);

  return useQuery({
    queryKey: queryKeys.playerMessages.conversation(conversationId ?? undefined),
    queryFn: () => fetchPlayerMessages(conversationId!, userId!),
    enabled: !!conversationId && !!userId,
  });
}

export function useSendPlayerMessage(conversationId: string) {
  const { session, profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: string) => {
      if (!session?.user.id) throw new Error('Not authenticated');

      const trimmed = body.trim();
      if (!trimmed) throw new Error('Write a message');

      const { data, error } = await supabase
        .from('player_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: session.user.id,
          body: trimmed,
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id as string;
    },
    onMutate: async (body) => {
      if (!session?.user.id) return;

      await queryClient.cancelQueries({
        queryKey: queryKeys.playerMessages.conversation(conversationId),
      });
      const previous = queryClient.getQueryData<PlayerMessageRow[]>(
        queryKeys.playerMessages.conversation(conversationId),
      );

      const optimistic: PlayerMessageRow = {
        id: `optimistic-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: session.user.id,
        body: body.trim(),
        created_at: new Date().toISOString(),
        sender_display_name: profile?.display_name?.trim() || 'You',
        is_own: true,
      };

      queryClient.setQueryData<PlayerMessageRow[]>(
        queryKeys.playerMessages.conversation(conversationId),
        [...(previous ?? []), optimistic],
      );

      return { previous };
    },
    onError: (_error, _body, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          queryKeys.playerMessages.conversation(conversationId),
          context.previous,
        );
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.playerMessages.conversation(conversationId),
      });
    },
  });
}
