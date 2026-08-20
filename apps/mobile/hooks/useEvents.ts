import type {
  EventVisibility,
  RsvpStatus,
  SessionType,
  SkillLevel,
} from '@pickleballcx/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { UpcomingEventsFilter } from '@/lib/event-filters';
import { filterUpcomingEvents } from '@/lib/event-filters';
import { useAuth } from '@/providers/AuthProvider';

import { queryKeys } from './query-keys';

export interface EventCourt {
  name: string;
  address: string;
  num_courts: number;
}

export interface EventGroup {
  name: string;
}

export interface EventRow {
  id: string;
  group_id: string | null;
  court_id: string;
  visibility: EventVisibility;
  starts_at: string;
  max_players: number | null;
  session_type: SessionType;
  skill_min: SkillLevel | null;
  skill_max: SkillLevel | null;
  description: string | null;
  lat: number | null;
  lng: number | null;
  created_by: string;
  created_at: string;
  courts: EventCourt | null;
  groups: EventGroup | null;
}

export interface EventRsvpRow {
  event_id: string;
  user_id: string;
  status: RsvpStatus;
  display_name: string;
  skill_level: SkillLevel | null;
  avatar_url: string | null;
}

async function fetchUpcomingEvents(): Promise<EventRow[]> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('events')
    .select(
      `
      id,
      group_id,
      court_id,
      visibility,
      starts_at,
      max_players,
      session_type,
      skill_min,
      skill_max,
      description,
      lat,
      lng,
      created_by,
      created_at,
      courts ( name, address, num_courts ),
      groups ( name )
    `,
    )
    .gte('starts_at', now)
    .is('group_id', null)
    .eq('visibility', 'public')
    .order('starts_at', { ascending: true });

  if (error) throw error;

  return (data ?? []).map(normalizeEventRow);
}

async function fetchCourtEvents(courtId: string): Promise<EventRow[]> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('events')
    .select(
      `
      id,
      group_id,
      court_id,
      visibility,
      starts_at,
      max_players,
      session_type,
      skill_min,
      skill_max,
      description,
      lat,
      lng,
      created_by,
      created_at,
      courts ( name, address, num_courts ),
      groups ( name )
    `,
    )
    .eq('court_id', courtId)
    .gte('starts_at', now)
    .is('group_id', null)
    .eq('visibility', 'public')
    .order('starts_at', { ascending: true });

  if (error) throw error;

  return (data ?? []).map(normalizeEventRow);
}

async function fetchGroupEvents(groupId: string): Promise<EventRow[]> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('events')
    .select(
      `
      id,
      group_id,
      court_id,
      visibility,
      starts_at,
      max_players,
      session_type,
      skill_min,
      skill_max,
      description,
      lat,
      lng,
      created_by,
      created_at,
      courts ( name, address, num_courts ),
      groups ( name )
    `,
    )
    .eq('group_id', groupId)
    .gte('starts_at', now)
    .order('starts_at', { ascending: true });

  if (error) throw error;

  return (data ?? []).map(normalizeEventRow);
}

async function fetchEvent(eventId: string): Promise<EventRow | null> {
  const { data, error } = await supabase
    .from('events')
    .select(
      `
      id,
      group_id,
      court_id,
      visibility,
      starts_at,
      max_players,
      session_type,
      skill_min,
      skill_max,
      description,
      lat,
      lng,
      created_by,
      created_at,
      courts ( name, address, num_courts ),
      groups ( name )
    `,
    )
    .eq('id', eventId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return normalizeEventRow(data);
}

async function fetchMyEvents(
  userId: string,
  timeframe: 'upcoming' | 'past',
): Promise<EventRow[]> {
  const now = new Date().toISOString();

  const { data: rsvps, error: rsvpError } = await supabase
    .from('event_rsvps')
    .select('event_id')
    .eq('user_id', userId)
    .in('status', ['going', 'maybe', 'waitlist']);

  if (rsvpError) throw rsvpError;

  const rsvpIds = (rsvps ?? []).map((row) => row.event_id);

  let query = supabase.from('events').select(
    `
      id,
      group_id,
      court_id,
      visibility,
      starts_at,
      max_players,
      session_type,
      skill_min,
      skill_max,
      description,
      lat,
      lng,
      created_by,
      created_at,
      courts ( name, address, num_courts ),
      groups ( name )
    `,
  );

  if (timeframe === 'upcoming') {
    query = query.gte('starts_at', now).order('starts_at', { ascending: true });
  } else {
    query = query.lt('starts_at', now).order('starts_at', { ascending: false });
  }

  if (rsvpIds.length > 0) {
    query = query.or(`created_by.eq.${userId},id.in.(${rsvpIds.join(',')})`);
  } else {
    query = query.eq('created_by', userId);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map(normalizeEventRow);
}

async function fetchMyHostedUpcomingEvents(userId: string): Promise<EventRow[]> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('events')
    .select(
      `
      id,
      group_id,
      court_id,
      visibility,
      starts_at,
      max_players,
      session_type,
      skill_min,
      skill_max,
      description,
      lat,
      lng,
      created_by,
      created_at,
      courts ( name, address, num_courts ),
      groups ( name )
    `,
    )
    .eq('created_by', userId)
    .gte('starts_at', now)
    .order('starts_at', { ascending: true });

  if (error) throw error;

  return (data ?? []).map(normalizeEventRow);
}

async function fetchGoingCounts(eventIds: string[]): Promise<Record<string, number>> {
  if (!eventIds.length) return {};

  const { data, error } = await supabase
    .from('event_rsvps')
    .select('event_id')
    .in('event_id', eventIds)
    .eq('status', 'going');

  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.event_id] = (counts[row.event_id] ?? 0) + 1;
  }
  return counts;
}

async function fetchEventRsvps(eventId: string): Promise<EventRsvpRow[]> {
  const { data, error } = await supabase
    .from('event_rsvps')
    .select(
      `
      event_id,
      user_id,
      status,
      profiles ( display_name, skill_level, avatar_url )
    `,
    )
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data ?? [])
    .map((row) => {
      const profile = row.profiles;
      if (!profile || Array.isArray(profile)) return null;
      return {
        event_id: row.event_id,
        user_id: row.user_id,
        status: row.status,
        display_name: profile.display_name,
        skill_level: profile.skill_level,
        avatar_url: profile.avatar_url,
      };
    })
    .filter((row): row is EventRsvpRow => row !== null);
}

function normalizeEventRow(row: Record<string, unknown>): EventRow {
  const courts = row.courts;
  const groups = row.groups;

  return {
    id: row.id as string,
    group_id: row.group_id as string | null,
    court_id: row.court_id as string,
    visibility: row.visibility as EventVisibility,
    starts_at: row.starts_at as string,
    max_players: row.max_players as number | null,
    session_type: row.session_type as SessionType,
    skill_min: row.skill_min as SkillLevel | null,
    skill_max: row.skill_max as SkillLevel | null,
    description: row.description as string | null,
    lat: row.lat as number | null,
    lng: row.lng as number | null,
    created_by: row.created_by as string,
    created_at: row.created_at as string,
    courts: courts && !Array.isArray(courts) ? (courts as EventCourt) : null,
    groups: groups && !Array.isArray(groups) ? (groups as EventGroup) : null,
  };
}

export function useUpcomingEvents(filter: UpcomingEventsFilter = {}) {
  const { session, profile } = useAuth();
  const userId = filter.userId ?? session?.user.id;
  const userSkill = filter.userSkill ?? profile?.skill_level ?? null;

  const queryFilter = {
    userId,
    userSkill,
    lat: filter.location?.lat,
    lng: filter.location?.lng,
    radiusMi: filter.radiusMi,
  };

  return useQuery({
    queryKey: queryKeys.events.upcoming(queryFilter),
    queryFn: async () => {
      const events = await fetchUpcomingEvents();
      return filterUpcomingEvents(events, {
        userId,
        userSkill,
        location: filter.location,
        radiusMi: filter.radiusMi,
      });
    },
  });
}

export function useGroupEvents(groupId: string) {
  return useQuery({
    queryKey: queryKeys.events.group(groupId),
    queryFn: () => fetchGroupEvents(groupId),
    enabled: !!groupId,
  });
}

export function useCourtEvents(courtId: string) {
  return useQuery({
    queryKey: queryKeys.events.court(courtId),
    queryFn: () => fetchCourtEvents(courtId),
    enabled: !!courtId,
  });
}

export function useEvent(eventId: string) {
  return useQuery({
    queryKey: queryKeys.events.detail(eventId),
    queryFn: () => fetchEvent(eventId),
    enabled: !!eventId,
  });
}

export function useEventRsvps(eventId: string) {
  return useQuery({
    queryKey: queryKeys.events.rsvps(eventId),
    queryFn: () => fetchEventRsvps(eventId),
    enabled: !!eventId,
  });
}

export function useMyHostedUpcomingEvents() {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: queryKeys.events.hostedUpcoming(userId),
    queryFn: async () => {
      const events = await fetchMyHostedUpcomingEvents(userId!);
      const goingByEventId = await fetchGoingCounts(events.map((event) => event.id));
      return { events, goingByEventId };
    },
    enabled: !!userId,
  });
}

export function useMyUpcomingEvents() {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: queryKeys.events.mine(userId, 'upcoming'),
    queryFn: () => fetchMyEvents(userId!, 'upcoming'),
    enabled: !!userId,
  });
}

export function useMyPastEvents() {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: queryKeys.events.mine(userId, 'past'),
    queryFn: () => fetchMyEvents(userId!, 'past'),
    enabled: !!userId,
  });
}

export function useMyEventRsvps() {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: queryKeys.events.myRsvps(userId),
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('event_rsvps')
        .select('event_id, status')
        .eq('user_id', userId)
        .in('status', ['going', 'maybe', 'waitlist']);

      if (error) throw error;
      return (data ?? []) as Array<{ event_id: string; status: RsvpStatus }>;
    },
    enabled: !!userId,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      courtId: string;
      startsAt: Date;
      sessionType: SessionType;
      maxPlayers?: number;
      skillMin?: SkillLevel;
      skillMax?: SkillLevel;
      description?: string;
    }) => {
      if (!session?.user.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('events')
        .insert({
          group_id: null,
          court_id: input.courtId,
          visibility: 'public' satisfies EventVisibility,
          starts_at: input.startsAt.toISOString(),
          session_type: input.sessionType,
          max_players: input.maxPlayers ?? null,
          skill_min: input.skillMin ?? null,
          skill_max: input.skillMax ?? null,
          description: input.description?.trim() || null,
          created_by: session.user.id,
        })
        .select('id')
        .single();

      if (error) throw error;
      return { id: data.id as string, courtId: input.courtId };
    },
    onSuccess: ({ courtId }) => {
      void queryClient.invalidateQueries({ queryKey: [...queryKeys.events.all, 'upcoming'] });
      void queryClient.invalidateQueries({ queryKey: [...queryKeys.events.all, 'mine'] });
      void queryClient.invalidateQueries({ queryKey: [...queryKeys.events.all, 'hostedUpcoming'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.events.court(courtId) });
    },
  });
}

export function useUpdateEvent(eventId: string, groupId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      courtId: string;
      startsAt: Date;
      sessionType: SessionType;
      maxPlayers?: number;
      skillMin?: SkillLevel;
      skillMax?: SkillLevel;
      description?: string;
    }) => {
      const { error } = await supabase
        .from('events')
        .update({
          court_id: input.courtId,
          starts_at: input.startsAt.toISOString(),
          session_type: input.sessionType,
          max_players: input.maxPlayers ?? null,
          skill_min: input.skillMin ?? null,
          skill_max: input.skillMax ?? null,
          description: input.description?.trim() || null,
        })
        .eq('id', eventId);

      if (error) throw error;
    },
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) });
      if (groupId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.events.group(groupId) });
      }
      void queryClient.invalidateQueries({ queryKey: [...queryKeys.events.all, 'upcoming'] });
      void queryClient.invalidateQueries({ queryKey: [...queryKeys.events.all, 'mine'] });
      void queryClient.invalidateQueries({ queryKey: [...queryKeys.events.all, 'hostedUpcoming'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.events.court(input.courtId) });
    },
  });
}

export function useDeleteEvent(eventId: string, groupId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('events').delete().eq('id', eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: queryKeys.events.detail(eventId) });
      queryClient.removeQueries({ queryKey: queryKeys.events.rsvps(eventId) });
      if (groupId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.events.group(groupId) });
      }
      void queryClient.invalidateQueries({ queryKey: [...queryKeys.events.all, 'upcoming'] });
      void queryClient.invalidateQueries({ queryKey: [...queryKeys.events.all, 'mine'] });
      void queryClient.invalidateQueries({ queryKey: [...queryKeys.events.all, 'hostedUpcoming'] });
    },
  });
}

export function useRsvp(eventId: string) {
  const queryClient = useQueryClient();
  const { session, profile } = useAuth();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: async (status: RsvpStatus) => {
      if (!userId) throw new Error('Not authenticated');

      const { data: existing, error: fetchError } = await supabase
        .from('event_rsvps')
        .select('event_id, user_id, status')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existing) {
        const { error } = await supabase
          .from('event_rsvps')
          .update({ status })
          .eq('event_id', eventId)
          .eq('user_id', userId);
        if (error) throw error;
        return;
      }

      const { error } = await supabase.from('event_rsvps').insert({
        event_id: eventId,
        user_id: userId,
        status,
      });
      if (error) throw error;
    },
    onMutate: async (status) => {
      if (!userId || !session?.user) return;

      await queryClient.cancelQueries({ queryKey: queryKeys.events.rsvps(eventId) });
      const previous = queryClient.getQueryData<EventRsvpRow[]>(queryKeys.events.rsvps(eventId));

      const displayName = profile?.display_name?.trim() || 'You';

      const optimistic: EventRsvpRow[] = [
        ...(previous ?? []).filter((row) => row.user_id !== userId),
        {
          event_id: eventId,
          user_id: userId,
          status,
          display_name: displayName,
          skill_level: profile?.skill_level ?? null,
          avatar_url: profile?.avatar_url ?? null,
        },
      ];

      queryClient.setQueryData(queryKeys.events.rsvps(eventId), optimistic);
      return { previous };
    },
    onError: (_error, _status, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.events.rsvps(eventId), context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.events.rsvps(eventId) });
      void queryClient.invalidateQueries({ queryKey: [...queryKeys.events.all, 'upcoming'] });
      void queryClient.invalidateQueries({ queryKey: [...queryKeys.events.all, 'myRsvps'] });
      void queryClient.invalidateQueries({ queryKey: [...queryKeys.events.all, 'mine'] });
      void queryClient.invalidateQueries({ queryKey: [...queryKeys.events.all, 'hostedUpcoming'] });
    },
  });
}

export function countGoing(rsvps: EventRsvpRow[]): number {
  return rsvps.filter((row) => row.status === 'going').length;
}

export function skillBreakdown(rsvps: EventRsvpRow[]): Record<SkillLevel, number> {
  const counts: Record<SkillLevel, number> = {
    beginner: 0,
    intermediate: 0,
    advanced: 0,
  };

  for (const row of rsvps) {
    if (row.status !== 'going' || !row.skill_level) continue;
    counts[row.skill_level] += 1;
  }

  return counts;
}
