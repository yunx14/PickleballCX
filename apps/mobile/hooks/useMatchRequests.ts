import type { MatchRequest } from '@pickleballcx/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getOtherUserId } from '@/lib/match-request-state';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

import { queryKeys } from './query-keys';

export interface MatchRequestRow extends MatchRequest {
  other_user_id: string;
  other_display_name: string;
  direction: 'incoming' | 'outgoing';
}

async function fetchMatchRequests(userId: string): Promise<MatchRequestRow[]> {
  const { data: requests, error } = await supabase
    .from('match_requests')
    .select('*')
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!requests?.length) return [];

  const otherIds = [
    ...new Set(
      requests.map((request) =>
        request.from_user_id === userId ? request.to_user_id : request.from_user_id,
      ),
    ),
  ];

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', otherIds);

  if (profilesError) throw profilesError;

  const nameById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile.display_name || 'Player']),
  );

  return requests.map((request) => {
    const otherUserId = getOtherUserId(request, userId);
    return {
      ...request,
      other_user_id: otherUserId,
      other_display_name: nameById.get(otherUserId) ?? 'Player',
      direction: request.to_user_id === userId ? 'incoming' : 'outgoing',
    };
  });
}

export function useMatchRequests() {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: queryKeys.matchRequests.all(userId),
    queryFn: () => fetchMatchRequests(userId!),
    enabled: !!userId,
  });
}

export function useIncomingMatchRequestCount() {
  const { data } = useMatchRequests();
  return (data ?? []).filter(
    (request) => request.direction === 'incoming' && request.status === 'pending',
  ).length;
}

function invalidateMatchRequests(queryClient: ReturnType<typeof useQueryClient>, userId?: string) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.matchRequests.all(userId) });
}

export function useCreateMatchRequest() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ toUserId, message }: { toUserId: string; message?: string }) => {
      const trimmedMessage = message?.trim();
      const { data, error } = await supabase
        .from('match_requests')
        .insert({
          from_user_id: session!.user.id,
          to_user_id: toUserId,
          message: trimmedMessage || null,
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => {
      invalidateMatchRequests(queryClient, session?.user.id);
    },
  });
}

export function useRespondToMatchRequest() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      accept,
    }: {
      requestId: string;
      accept: boolean;
    }) => {
      const { error } = await supabase
        .from('match_requests')
        .update({
          status: accept ? 'accepted' : 'declined',
          responded_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateMatchRequests(queryClient, session?.user.id);
    },
  });
}

export function useCancelMatchRequest() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('match_requests')
        .update({
          status: 'declined',
          responded_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateMatchRequests(queryClient, session?.user.id);
    },
  });
}
