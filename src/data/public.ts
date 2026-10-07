import { useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { sortPartners } from './partners';

import { supabase } from '@/lib/supabase';
import { countNationalities } from './nationalities';
import { groupByPlace, parseAliases } from './places';
import { useStore } from './store';
import type { Db, Institution } from './types';
import { studyEntries } from './members';

/**
 * What visitors without an account may see: totals only (never member profiles), the Bureau
 * and honorary members, and the partner institutions. With Supabase it comes from the
 * `public_overview()` function (migration 004); in the demo it is computed from local data.
 */
export type PublicPerson = { name: string; role: 'admin' | 'honneur'; fonction?: string; avatar?: string };
export type PublicOverview = {
  alumni: number;
  /** All approved accounts, and the lycée's pupils among them (migration 044; missing before it). */
  members?: number;
  pupils?: number;
  countries: number;
  promos: number;
  universities: number;
  /** Different nationalities among approved members. */
  nationalities: number;
  /** Countries by number of former students, most first. */
  destinations: { code: string; n: number }[];
  /** Institutions where former students study, most represented first. */
  schools: string[];
  bureau: PublicPerson[];
  institutions: Institution[];
};

const EMPTY: PublicOverview = { alumni: 0, countries: 0, promos: 0, universities: 0, nationalities: 0, destinations: [], schools: [], bureau: [], institutions: [] };

/**
 * Bureau order: the administrators by Bureau code (1001 the president, 1002, 1003…), then honorary
 * members. The site gets them already in that order (public_overview, migration 025) without the
 * codes; the sort below is stable and only keeps admins before honorary members.
 */
const rank = (p: PublicPerson) => (p.role === 'admin' ? 0 : 1);

function fromDb(db: Db): PublicOverview {
  const grads = db.users.filter((u) => u.approved && (u.role === 'alumni' || u.role === 'admin'));
  const count = (values: (string | number | undefined)[]) => {
    const m = new Map<string, number>();
    for (const v of values) if (v !== undefined && v !== '') m.set(String(v), (m.get(String(v)) ?? 0) + 1);
    return [...m].sort((a, b) => b[1] - a[1]);
  };
  // Host countries: where each former student lives, plus the countries of their other universities
  // (exchange semester…), each country once per person.
  const countries = count(grads.flatMap((u) => [...new Set([u.country, ...(u.otherSchools ?? []).map((x) => x.country)].filter(Boolean))]));
  // The same university written differently counts once (data/places.ts).
  // Exchange and other universities count too.
  const aliases = parseAliases(db.settings.placeAliases);
  const schools = groupByPlace(studyEntries(grads, aliases), (u) => u.school, aliases).map((g) => [g.label, g.items.length] as const);
  const bureau = db.users
    .filter((u) => u.approved && (u.role === 'admin' || u.role === 'honneur'))
    .sort((a, b) => (a.role === b.role ? 0 : a.role === 'admin' ? -1 : 1) || (a.bureauCode ?? '9999').localeCompare(b.bureauCode ?? '9999') || a.lastName.localeCompare(b.lastName))
    .map((u): PublicPerson => ({ name: `${u.firstName} ${u.lastName.toLocaleUpperCase('fr')}`, role: u.role as 'admin' | 'honneur', fonction: u.fonction, avatar: u.avatar }));
  return {
    alumni: grads.length,
    members: db.users.filter((u) => u.approved).length,
    pupils: db.users.filter((u) => u.approved && u.role === 'eleve').length,
    countries: countries.length,
    promos: new Set(grads.map((u) => u.promo).filter(Boolean)).size,
    universities: schools.length,
    nationalities: countNationalities(db.users.filter((u) => u.approved)).length,
    destinations: countries.map(([code, n]) => ({ code, n })),
    schools: schools.map(([s]) => s).slice(0, 30),
    bureau,
    institutions: sortPartners(db.institutions.filter((i) => !i.hidden)),
  };
}

/*
 * Visitors' figures come from one Supabase call shared by every block of the page (the landing
 * mounts about eight of them) and kept for the session; the last answer is also stored in the
 * browser, so a returning visitor sees the figures at once while a fresh copy loads in the
 * background (at most one call every 10 minutes).
 */
const OVERVIEW_KEY = 'lfk.public.overview.v1';
const FRESH_MS = 10 * 60 * 1000;
let shared: { data: PublicOverview; at: number } | null = null;
let inflight: Promise<PublicOverview | null> | null = null;
const listeners = new Set<(o: PublicOverview) => void>();

function readStored(): { data: PublicOverview; at: number } | null {
  if (Platform.OS !== 'web') return null;
  try {
    const raw = localStorage.getItem(OVERVIEW_KEY);
    return raw ? (JSON.parse(raw) as { data: PublicOverview; at: number }) : null;
  } catch {
    return null;
  }
}

function fromRpc(data: unknown): PublicOverview {
  const o = data as Omit<PublicOverview, 'institutions' | 'bureau'> & {
    bureau: { name: string; role: 'admin' | 'honneur'; fonction: string | null; avatar: string | null }[];
    institutions: { id: string; name: string; description: string; description_en?: string | null; logo: string | null; website: string | null; sort_order: number }[];
  };
  return {
    ...EMPTY,
    ...o,
    destinations: o.destinations ?? [],
    schools: o.schools ?? [],
    bureau: (o.bureau ?? []).map((p) => ({ ...p, fonction: p.fonction ?? undefined, avatar: p.avatar ?? undefined })).sort((a, b) => rank(a) - rank(b)),
    institutions: sortPartners((o.institutions ?? []).map((i) => ({ id: i.id, name: i.name, description: i.description, descriptionEn: i.description_en ?? undefined, logo: i.logo ?? undefined, website: i.website ?? undefined, order: i.sort_order }))),
  };
}

function refreshOverview(): Promise<PublicOverview | null> {
  if (!supabase) return Promise.resolve(null);
  if (shared && Date.now() - shared.at < FRESH_MS) return Promise.resolve(shared.data);
  if (!inflight) {
    inflight = Promise.resolve(supabase.rpc('public_overview'))
      .then(({ data, error }) => {
        if (error || !data) return shared?.data ?? null;
        shared = { data: fromRpc(data), at: Date.now() };
        if (Platform.OS === 'web') {
          try {
            localStorage.setItem(OVERVIEW_KEY, JSON.stringify(shared));
          } catch {}
        }
        listeners.forEach((l) => l(shared!.data));
        return shared.data;
      })
      .catch(() => shared?.data ?? null)
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export function usePublicOverview(): PublicOverview {
  const { db, isRemote, me } = useStore();
  // Approved members already have the data (row-level security lets them read it).
  const fromLocal = !isRemote || !!me?.approved;
  const local = useMemo(() => (fromLocal ? fromDb(db) : null), [db, fromLocal]);
  const [remote, setRemote] = useState<PublicOverview | null>(() => {
    if (!shared) {
      const stored = readStored();
      // A stored copy is shown at once but still counts as stale, so a fresh one is fetched.
      if (stored) shared = { data: stored.data, at: 0 };
    }
    return shared?.data ?? null;
  });

  useEffect(() => {
    if (fromLocal || !supabase) return;
    listeners.add(setRemote);
    refreshOverview();
    return () => {
      listeners.delete(setRemote);
    };
  }, [fromLocal]);

  return local ?? remote ?? EMPTY;
}
