import type { RealtimeChannel } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

type PostgresChangesFilter = {
  event: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  schema: string;
  table: string;
  filter?: string;
};

type SubscriptionEntry = {
  channel: RealtimeChannel;
  listeners: Set<() => void>;
};

const activeSubscriptions = new Map<string, SubscriptionEntry>();

export function subscribePostgresChanges(
  channelKey: string,
  filter: PostgresChangesFilter,
  onChange: () => void,
): () => void {
  let entry = activeSubscriptions.get(channelKey);

  if (entry) {
    entry.listeners.add(onChange);
    return () => releasePostgresSubscription(channelKey, onChange);
  }

  const listeners = new Set<() => void>([onChange]);
  const channel = supabase
    .channel(channelKey)
    .on('postgres_changes', filter, () => {
      listeners.forEach((listener) => listener());
    })
    .subscribe();

  activeSubscriptions.set(channelKey, { channel, listeners });

  return () => releasePostgresSubscription(channelKey, onChange);
}

function releasePostgresSubscription(channelKey: string, onChange: () => void) {
  const entry = activeSubscriptions.get(channelKey);
  if (!entry) return;

  entry.listeners.delete(onChange);

  if (entry.listeners.size === 0) {
    void supabase.removeChannel(entry.channel);
    activeSubscriptions.delete(channelKey);
  }
}
