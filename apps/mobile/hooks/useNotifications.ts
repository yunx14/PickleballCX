import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UserNotification } from '@pickleballcx/shared';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

import { queryKeys } from './query-keys';

async function fetchNotifications(): Promise<UserNotification[]> {
  const { data, error } = await supabase
    .from('user_notifications')
    .select('id, user_id, type, title, body, event_id, read_at, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data ?? []) as UserNotification[];
}

async function fetchUnreadNotificationCount(): Promise<number> {
  const { count, error } = await supabase
    .from('user_notifications')
    .select('id', { count: 'exact', head: true })
    .is('read_at', null);

  if (error) throw error;
  return count ?? 0;
}

export function useNotifications() {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: queryKeys.notifications.list(userId),
    queryFn: fetchNotifications,
    enabled: !!userId,
  });
}

export function useUnreadNotificationCount() {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(userId),
    queryFn: fetchUnreadNotificationCount,
    enabled: !!userId,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('user_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .is('read_at', null);

      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list(userId) });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unreadCount(userId),
      });
    },
  });
}
