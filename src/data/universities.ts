import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { placeKey } from './places';

/**
 * Universities / higher-education establishments by country, built from OpenAlex by
 * scripts/build-universities.mjs into public/universities/{CC}.json. Each row: [name, city, acronyms].
 * A file is fetched only when its country is picked, then kept in memory.
 */
export type University = { name: string; city: string; acronyms: string[]; rank: number };

const SITE = process.env.EXPO_PUBLIC_SITE_URL ?? 'https://www.alfk.org';
const base = Platform.OS === 'web' ? '' : SITE;
const cache = new Map<string, Promise<University[]>>();

export function loadUniversities(country: string): Promise<University[]> {
  const cc = country.toUpperCase();
  let p = cache.get(cc);
  if (!p) {
    p = fetch(`${base}/universities/${cc}.json`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: [string, string, string?][]) => rows.map(([name, city, a], rank) => ({ name, city: city ?? '', acronyms: a ? a.split('|') : [], rank })))
      .catch(() => {
        cache.delete(cc);
        return [];
      });
    cache.set(cc, p);
  }
  return p;
}

/** The establishments of a country (empty while loading or when the list is unavailable). */
export function useUniversities(country?: string) {
  // Last loaded country; while another one loads, `list` is empty and `loading` true.
  const [state, setState] = useState<{ cc?: string; list: University[] }>({ list: [] });
  useEffect(() => {
    if (!country) return;
    let alive = true;
    loadUniversities(country).then((list) => alive && setState({ cc: country, list }));
    return () => {
      alive = false;
    };
  }, [country]);
  const ready = state.cc === country;
  const list = ready ? state.list : [];
  const cities = [...new Set(list.map((u) => u.city).filter(Boolean))];
  return { list, cities, loading: !!country && !ready };
}

/** True when the typed text matches the start of a word of the name, or an acronym. */
export function matchesUniversity(u: University, typed: string) {
  const q = placeKey(typed);
  if (!q) return true;
  if (u.acronyms.some((a) => placeKey(a).startsWith(q))) return true;
  const name = placeKey(u.name);
  return name.startsWith(q) || name.includes(' ' + q);
}

/** Order of relevance for what was typed: name starts with it, then an acronym, then another word. */
export function matchRank(u: University, typed: string) {
  const q = placeKey(typed);
  if (!q) return 0;
  if (placeKey(u.name).startsWith(q)) return 0;
  if (u.acronyms.some((a) => placeKey(a).startsWith(q))) return 1;
  return 2;
}

export const sameCity = (a?: string, b?: string) => !!a && !!b && placeKey(a) === placeKey(b);
