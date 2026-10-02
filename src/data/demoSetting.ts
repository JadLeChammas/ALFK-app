import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import { useStore } from './store';

/**
 * Whether the « Voir la démo » invitation is shown to visitors (home and sign-in pages).
 * Admins switch it in the dashboard; saved in app_settings (`showDemo`: 'on' | 'off', default on),
 * readable by visitors (migration 014). Hidden while it loads, so it never flashes when switched off.
 */
export function useDemoVisible() {
  const { db, me } = useStore();
  const local = db.settings.showDemo;
  const [remote, setRemote] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    if (me || !supabase) return;
    let alive = true;
    supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'showDemo')
      .maybeSingle()
      .then(({ data, error }) => alive && setRemote(error ? null : (data?.value ?? null)));
    return () => {
      alive = false;
    };
  }, [me]);
  const value = me || !supabase ? local : remote;
  if (value === undefined && !me && supabase) return false;
  return value !== 'off';
}
