import { useEffect, useMemo, useState } from 'react';

import { supabase } from '@/lib/supabase';
import { useStore } from './store';
import type { Db, Institution } from './types';

/**
 * What visitors without an account may see: totals only (never member profiles), the Bureau
 * and honorary members, and the partner institutions. With Supabase it comes from the
 * `public_overview()` function (migration 004); in the demo it is computed from local data.
 */
export type PublicPerson = { name: string; role: 'admin' | 'honneur'; fonction?: string; avatar?: string };
export type PublicOverview = {
  alumni: number;
  countries: number;
  promos: number;
  universities: number;
  /** Countries by number of former students, most first. */
  destinations: { code: string; n: number }[];
  /** Institutions where former students study, most represented first. */
  schools: string[];
  bureau: PublicPerson[];
  institutions: Institution[];
};

const EMPTY: PublicOverview = { alumni: 0, countries: 0, promos: 0, universities: 0, destinations: [], schools: [], bureau: [], institutions: [] };

/** Bureau order: the president first, then the other admins, then honorary members. */
const rank = (p: PublicPerson) => (p.role === 'admin' ? (/pr[ée]sident/i.test(p.fonction ?? '') ? 0 : 1) : 2);

function fromDb(db: Db): PublicOverview {
  const grads = db.users.filter((u) => u.approved && (u.role === 'alumni' || u.role === 'admin'));
  const count = (values: (string | number | undefined)[]) => {
    const m = new Map<string, number>();
    for (const v of values) if (v !== undefined && v !== '') m.set(String(v), (m.get(String(v)) ?? 0) + 1);
    return [...m].sort((a, b) => b[1] - a[1]);
  };
  const countries = count(grads.map((u) => u.country));
  const schools = count(grads.map((u) => u.school));
  const bureau = db.users
    .filter((u) => u.approved && (u.role === 'admin' || u.role === 'honneur'))
    .map((u): PublicPerson => ({ name: `${u.firstName} ${u.lastName}`, role: u.role as 'admin' | 'honneur', fonction: u.fonction, avatar: u.avatar }))
    .sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
  return {
    alumni: grads.length,
    countries: countries.length,
    promos: new Set(grads.map((u) => u.promo).filter(Boolean)).size,
    universities: schools.length,
    destinations: countries.map(([code, n]) => ({ code, n })),
    schools: schools.map(([s]) => s).slice(0, 30),
    bureau,
    institutions: [...db.institutions].sort((a, b) => a.order - b.order),
  };
}

export function usePublicOverview(): PublicOverview {
  const { db, isRemote, me } = useStore();
  // Approved members already have the data (row-level security lets them read it).
  const fromLocal = !isRemote || !!me?.approved;
  const local = useMemo(() => (fromLocal ? fromDb(db) : null), [db, fromLocal]);
  const [remote, setRemote] = useState<PublicOverview | null>(null);

  useEffect(() => {
    if (fromLocal || !supabase) return;
    let alive = true;
    supabase.rpc('public_overview').then(({ data, error }) => {
      if (!alive || error || !data) return;
      const o = data as Omit<PublicOverview, 'institutions' | 'bureau'> & {
        bureau: { name: string; role: 'admin' | 'honneur'; fonction: string | null; avatar: string | null }[];
        institutions: { id: string; name: string; description: string; logo: string | null; website: string | null; sort_order: number }[];
      };
      setRemote({
        ...EMPTY,
        ...o,
        destinations: o.destinations ?? [],
        schools: o.schools ?? [],
        bureau: (o.bureau ?? []).map((p) => ({ ...p, fonction: p.fonction ?? undefined, avatar: p.avatar ?? undefined })).sort((a, b) => rank(a) - rank(b)),
        institutions: (o.institutions ?? []).map((i) => ({ id: i.id, name: i.name, description: i.description, logo: i.logo ?? undefined, website: i.website ?? undefined, order: i.sort_order })),
      });
    });
    return () => {
      alive = false;
    };
  }, [fromLocal]);

  return local ?? remote ?? EMPTY;
}
