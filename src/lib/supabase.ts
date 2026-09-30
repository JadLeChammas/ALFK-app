import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

// Native: gives the app a persistent localStorage (expo-sqlite). Web already has one.
import './storage-install';


const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Supabase client, or null when the app runs without a backend (local demo mode).
 * Configure with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY (see .env.example).
 */
export const supabase: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
        auth: {
          storage: typeof localStorage !== 'undefined' ? localStorage : undefined,
          autoRefreshToken: true,
          persistSession: true,
          // On web, password-reset links land on the site with the session in the URL.
          detectSessionInUrl: Platform.OS === 'web',
        },
      })
    : null;

export const isRemote = supabase !== null;

if (supabase && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

/** Base URL of the server functions in api/ (same origin on web; set EXPO_PUBLIC_API_URL for phones). */
export const apiBase = process.env.EXPO_PUBLIC_API_URL ?? '';
