import 'react-native-url-polyfill/auto';

import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { createSupabaseClient } from '@pickleballcx/shared';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const webStorageAdapter = {
  getItem: async (key: string) => {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  },
  removeItem: async (key: string) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  },
};

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  Constants.expoConfig?.extra?.supabaseUrl ??
  '';
const supabasePublishableKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  Constants.expoConfig?.extra?.supabasePublishableKey ??
  '';

if (!supabaseUrl || !supabasePublishableKey) {
  console.warn(
    'Missing Supabase env vars. Copy .env.example to apps/mobile/.env and add your publishable key.',
  );
}

export const supabase = createSupabaseClient({
  url: supabaseUrl,
  publishableKey: supabasePublishableKey,
  storage: Platform.OS === 'web' ? webStorageAdapter : ExpoSecureStoreAdapter,
});
