import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

// Native: gives the app a persistent localStorage (expo-sqlite). Web already has one.
import './storage-install';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** True when this build is configured with a real Supabase backend. */
export const hasBackend = !!(url && key);

// ——— Demo mode on a real deployment ———
// Visitors can explore the app with fictional data (src/data/seed.ts) without an account.
// It is a per-browser switch: `?demo` in the URL or the « Découvrir la démo » button turns it on.
// Nothing done in demo mode reaches the real database.
const DEMO_FLAG = 'lfk.forceDemo';
const storage = typeof localStorage !== 'undefined' ? localStorage : undefined;

function readDemoFlag() {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.has('demo')) {
        storage?.setItem(DEMO_FLAG, '1');
        params.delete('demo');
        const rest = params.toString();
        window.history.replaceState(null, '', window.location.pathname + (rest ? `?${rest}` : '') + window.location.hash);
      }
    }
    return storage?.getItem(DEMO_FLAG) === '1';
  } catch {
    return false;
  }
}

/** True when a visitor chose the demo on a site that also has a real backend. */
export const isDemoForced = hasBackend && readDemoFlag();

/** Switches this browser to the demo (web reloads the app). */
export function enterDemo() {
  try {
    storage?.setItem(DEMO_FLAG, '1');
  } catch {}
  if (Platform.OS === 'web' && typeof window !== 'undefined') window.location.assign('/connexion');
}

/** Leaves the demo and returns to the real site. */
export function exitDemo() {
  try {
    storage?.removeItem(DEMO_FLAG);
  } catch {}
  if (Platform.OS === 'web' && typeof window !== 'undefined') window.location.assign('/');
}

/**
 * Supabase client, or null when the app runs on local demo data (no backend configured, or demo chosen).
 * Configure with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY (see .env.example).
 */
export const supabase: SupabaseClient | null =
  hasBackend && !isDemoForced
    ? createClient(url!, key!, {
        auth: {
          storage,
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
