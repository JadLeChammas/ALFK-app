import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

/**
 * Site visit counter (shown by the retro mode). One visit per browser session; with Supabase the
 * total lives in the database (`hit_counter()` / `read_counter()`, migration 007), in the demo on
 * the device.
 */
const SESSION_KEY = 'lfk.counted';
const DEMO_KEY = 'lfk.demo.visits';
let pending: Promise<number | null> | null = null;

function alreadyCountedThisSession() {
  if (Platform.OS !== 'web' || typeof sessionStorage === 'undefined') return false;
  try {
    if (sessionStorage.getItem(SESSION_KEY)) return true;
    sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    // Private mode: count anyway.
  }
  return false;
}

async function fetchCount(): Promise<number | null> {
  const counted = alreadyCountedThisSession();
  if (supabase) {
    const { data, error } = await supabase.rpc(counted ? 'read_counter' : 'hit_counter');
    return error || typeof data !== 'number' ? null : data;
  }
  const current = Number((await AsyncStorage.getItem(DEMO_KEY).catch(() => null)) ?? 4215);
  const next = counted ? current : current + 1;
  AsyncStorage.setItem(DEMO_KEY, String(next)).catch(() => {});
  return next;
}

/** Number of visits (null while loading or when the counter is unavailable). */
export function useVisitCount(enabled: boolean) {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    pending ??= fetchCount().catch(() => null);
    pending.then((n) => alive && setCount(n));
    return () => {
      alive = false;
    };
  }, [enabled]);
  return count;
}

/** Counts the visit as soon as the app opens, even when the counter is not shown. */
export function countVisit() {
  pending ??= fetchCount().catch(() => null);
}
