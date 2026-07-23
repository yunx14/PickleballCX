import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../types/database';

export type PickleballSupabaseClient = SupabaseClient<Database>;

export interface SupabaseStorageAdapter {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

export interface CreateSupabaseClientOptions {
  url: string;
  publishableKey: string;
  storage?: SupabaseStorageAdapter;
}

export function createSupabaseClient({
  url,
  publishableKey,
  storage,
}: CreateSupabaseClientOptions): PickleballSupabaseClient {
  return createClient<Database>(url, publishableKey, {
    auth: {
      storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

export function isProfileComplete(profile: { display_name: string; skill_level: string | null } | null) {
  return Boolean(profile?.display_name && profile?.skill_level);
}
