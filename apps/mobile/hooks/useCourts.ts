import type { CourtType } from '@pickleballcx/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

import { queryKeys } from './query-keys';

export interface Court {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  court_type: CourtType;
  num_courts: number;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

async function fetchCourts(): Promise<Court[]> {
  const { data, error } = await supabase
    .from('courts')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

async function fetchCourt(courtId: string): Promise<Court | null> {
  const { data, error } = await supabase.from('courts').select('*').eq('id', courtId).maybeSingle();

  if (error) throw error;
  return data;
}

export function useCourts() {
  return useQuery({
    queryKey: queryKeys.courts.list(),
    queryFn: fetchCourts,
  });
}

export function useCourt(courtId: string) {
  return useQuery({
    queryKey: queryKeys.courts.detail(courtId),
    queryFn: () => fetchCourt(courtId),
    enabled: !!courtId,
  });
}

export function useCreateCourt() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      name: string;
      address: string;
      courtType: CourtType;
      numCourts: number;
      notes?: string;
    }) => {
      if (!session?.user.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('courts')
        .insert({
          name: input.name,
          address: input.address,
          lat: 0,
          lng: 0,
          court_type: input.courtType,
          num_courts: input.numCourts,
          notes: input.notes?.trim() || null,
          created_by: session.user.id,
        })
        .select('*')
        .single();

      if (error) throw error;
      return data as Court;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.courts.list() });
    },
  });
}

export function useUpdateCourt(courtId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      name: string;
      address: string;
      courtType: CourtType;
      numCourts: number;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('courts')
        .update({
          name: input.name,
          address: input.address,
          court_type: input.courtType,
          num_courts: input.numCourts,
          notes: input.notes?.trim() || null,
        })
        .eq('id', courtId)
        .select('*')
        .single();

      if (error) throw error;
      return data as Court;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.courts.list() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.courts.detail(courtId) });
    },
  });
}
