import type { SessionInvite } from '@pickleballcx/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { getOtherUserId } from '@/lib/match-request-state';
import { supabase } from '@/lib/supabase';
import { subscribePostgresChanges } from '@/lib/supabase-realtime';
import { useAuth } from '@/providers/AuthProvider';

import { queryKeys } from './query-keys';

export interface SessionInviteRow extends SessionInvite {
  other_user_id: string;
  other_display_name: string;
  direction: 'incoming' | 'outgoing';
  event_starts_at: string;
  court_name: string;
  group_name: string | null;
}

async function fetchSessionInvites(userId: string): Promise<SessionInviteRow[]> {
  const { data: invites, error } = await supabase
    .from('session_invites')
    .select(
      `
      *,
      events (
        starts_at,
        courts ( name ),
        groups ( name )
      )
    `,
    )
    .or(`invited_user_id.eq.${userId},invited_by.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!invites?.length) return [];

  const otherIds = [
    ...new Set(
      invites.map((invite) =>
        invite.invited_by === userId ? invite.invited_user_id : invite.invited_by,
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

  return invites.map((invite) => {
    const events = invite.events;
    const event = events && !Array.isArray(events) ? events : null;
    const courts = event?.courts;
    const court = courts && !Array.isArray(courts) ? courts : null;
    const groups = event?.groups;
    const group = groups && !Array.isArray(groups) ? groups : null;
    const otherUserId =
      invite.invited_by === userId ? invite.invited_user_id : invite.invited_by;

    return {
      id: invite.id,
      event_id: invite.event_id,
      invited_user_id: invite.invited_user_id,
      invited_by: invite.invited_by,
      status: invite.status,
      message: invite.message,
      created_at: invite.created_at,
      responded_at: invite.responded_at,
      other_user_id: otherUserId,
      other_display_name: nameById.get(otherUserId) ?? 'Player',
      direction: invite.invited_user_id === userId ? 'incoming' : 'outgoing',
      event_starts_at: event?.starts_at ?? '',
      court_name: court?.name?.trim() || 'Pickleball session',
      group_name: group?.name?.trim() || null,
    };
  });
}

export function useSessionInvites() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    return subscribePostgresChanges(
      `session-invites:${userId}`,
      {
        event: '*',
        schema: 'public',
        table: 'session_invites',
      },
      () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.sessionInvites.all(userId) });
      },
    );
  }, [userId, queryClient]);

  return useQuery({
    queryKey: queryKeys.sessionInvites.all(userId),
    queryFn: () => fetchSessionInvites(userId!),
    enabled: !!userId,
  });
}

export function useIncomingSessionInviteCount() {
  const { data } = useSessionInvites();
  return (data ?? []).filter(
    (invite) => invite.direction === 'incoming' && invite.status === 'pending',
  ).length;
}

function invalidateSessionInvites(
  queryClient: ReturnType<typeof useQueryClient>,
  userId?: string,
) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.sessionInvites.all(userId) });
}

export interface HostSessionOption {
  id: string;
  starts_at: string;
  court_name: string;
  group_name: string | null;
}

async function fetchHostSessions(userId: string): Promise<HostSessionOption[]> {
  const { data, error } = await supabase
    .from('events')
    .select(
      `
      id,
      starts_at,
      courts ( name ),
      groups ( name )
    `,
    )
    .eq('created_by', userId)
    .gt('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((event) => {
    const courts = event.courts;
    const court = courts && !Array.isArray(courts) ? courts : null;
    const groups = event.groups;
    const group = groups && !Array.isArray(groups) ? groups : null;

    return {
      id: event.id,
      starts_at: event.starts_at,
      court_name: court?.name?.trim() || 'Pickleball session',
      group_name: group?.name?.trim() || null,
    };
  });
}

export function useHostSessions() {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: queryKeys.hostSessions.upcoming(userId),
    queryFn: () => fetchHostSessions(userId!),
    enabled: !!userId,
  });
}

export function useCreateSessionInvite() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      invitedUserId,
      message,
    }: {
      eventId: string;
      invitedUserId: string;
      message?: string;
    }) => {
      const trimmedMessage = message?.trim();
      const { data, error } = await supabase
        .from('session_invites')
        .insert({
          event_id: eventId,
          invited_user_id: invitedUserId,
          invited_by: session!.user.id,
          message: trimmedMessage || null,
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => {
      invalidateSessionInvites(queryClient, session?.user.id);
    },
  });
}

export function useRespondToSessionInvite() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ inviteId, accept }: { inviteId: string; accept: boolean }) => {
      const { data: invite, error: inviteError } = await supabase
        .from('session_invites')
        .update({
          status: accept ? 'accepted' : 'declined',
          responded_at: new Date().toISOString(),
        })
        .eq('id', inviteId)
        .select('event_id')
        .single();

      if (inviteError) throw inviteError;

      if (accept && session?.user.id) {
        const { error: rsvpError } = await supabase.from('event_rsvps').upsert(
          {
            event_id: invite.event_id,
            user_id: session.user.id,
            status: 'going',
          },
          { onConflict: 'event_id,user_id' },
        );

        if (rsvpError) throw rsvpError;
      }

      return invite.event_id as string;
    },
    onSuccess: () => {
      invalidateSessionInvites(queryClient, session?.user.id);
      void queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
    },
  });
}

export function useCancelSessionInvite() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from('session_invites')
        .update({
          status: 'declined',
          responded_at: new Date().toISOString(),
        })
        .eq('id', inviteId);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateSessionInvites(queryClient, session?.user.id);
    },
  });
}
