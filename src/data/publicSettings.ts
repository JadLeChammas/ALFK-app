import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import { useStore } from './store';

/**
 * Settings that visitors may also read (the end credits, the « Le LFK » page): members already have
 * every setting; visitors fetch the one row (policy in migrations 011 and 013).
 */
export function usePublicSetting(key: 'credits' | 'lfkStory', enabled = true) {
  const { db, me } = useStore();
  const raw = db.settings[key];
  const [publicRaw, setPublicRaw] = useState<string | null>(null);
  useEffect(() => {
    if (!enabled || raw || me || !supabase) return;
    let alive = true;
    supabase
      .from('app_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle()
      .then(({ data }) => alive && setPublicRaw(data?.value ?? null));
    return () => {
      alive = false;
    };
  }, [enabled, raw, me, key]);
  return raw ?? publicRaw;
}

