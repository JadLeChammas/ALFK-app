import { placeKey, resolvePlace } from './placeKey';

/**
 * Finds a university's logo from open data (no React — shared by the app and api/uni-logo.ts):
 * OpenAlex, the open catalogue of institutions (its image is usually the logo or seal from
 * Wikidata), otherwise the university website's own icon. A match is only accepted when the
 * names really correspond; local short names OpenAlex would confuse are pinned to their website.
 */

/** Places whose short name OpenAlex would confuse (key from resolvePlace → official website). */
const KNOWN_SITES: Record<string, string> = {
  gust: 'gust.edu.kw',
  'kuwait university': 'ku.edu.kw',
  'american university kuwait': 'auk.edu.kw',
  'australian university': 'au.edu.kw',
  'sciences po': 'sciencespo.fr',
  'essec business school': 'essec.edu',
  'hec paris': 'hec.edu',
  isep: 'isep.fr',
  'ecole polytechnique': 'polytechnique.edu',
};

export const favicon = (host: string) => `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`;

const hostOf = (url?: string | null) => {
  try {
    return url ? new URL(url).hostname.replace(/^www\./, '') : null;
  } catch {
    return null;
  }
};

/** Share of the query's words found in the candidate (accents, case and small words ignored). */
function closeness(query: string, candidate: string) {
  const q = placeKey(query).split(' ').filter(Boolean);
  const c = new Set(placeKey(candidate).split(' '));
  if (!q.length) return 0;
  return q.filter((w) => c.has(w)).length / q.length;
}

type Institution = { display_name: string; homepage_url?: string | null; image_thumbnail_url?: string | null; display_name_acronyms?: string[]; display_name_alternatives?: string[] };

/** Logo URL, or null when no reliable match exists. Throws when OpenAlex cannot be reached. */
export async function findUniLogo(name: string, fetcher: typeof fetch = fetch): Promise<string | null> {
  const key = resolvePlace(name, {});
  if (KNOWN_SITES[key]) return favicon(KNOWN_SITES[key]);
  const url = `https://api.openalex.org/institutions?search=${encodeURIComponent(name)}&filter=type:education&per-page=5&select=display_name,homepage_url,image_thumbnail_url,display_name_acronyms,display_name_alternatives`;
  const res = await fetcher(url, { headers: { 'User-Agent': 'ALFK-site (https://www.alfk.org)' } });
  if (!res.ok) throw new Error(`openalex ${res.status}`);
  const { results = [] } = (await res.json()) as { results?: Institution[] };
  let best: Institution | null = null;
  let score = 0;
  for (const r of results) {
    const names = [r.display_name, ...(r.display_name_acronyms ?? []), ...(r.display_name_alternatives ?? [])];
    const s = Math.max(...names.map((n) => Math.min(closeness(name, n), closeness(n, name) + 0.25)));
    if (s > score) [best, score] = [r, s];
  }
  if (!best || score < 0.6) return null;
  if (best.image_thumbnail_url) return best.image_thumbnail_url;
  const host = hostOf(best.homepage_url);
  return host ? favicon(host) : null;
}
