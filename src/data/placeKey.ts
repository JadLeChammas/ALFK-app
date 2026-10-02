/* Pure place-name helpers (no React): shared by the app (data/places.ts) and the server (api/uni-logo.ts). */

/**
 * Universities and companies are typed freely, so the same place comes in many spellings
 * (« ISEP », « Isep », « Institut supérieur d'électronique de Paris »). They are grouped by a key:
 *   1. case, accents, punctuation and small words (de, d', of, the…) are ignored;
 *   2. known acronyms and full names point to the same place (built-in list below);
 *   3. admins can merge two places that still differ (stored in app_settings.placeAliases).
 * The label shown for a group is its most common spelling.
 */

const SMALL_WORDS = new Set(['de', 'du', 'des', 'd', 'la', 'le', 'les', 'l', 'of', 'the', 'at', 'in', 'et', 'and', 'a', 'en', 'y']);

/** « Institut Supérieur d'Électronique de Paris » → « institut superieur electronique paris ». */
export function placeKey(name?: string | null): string {
  if (!name) return '';
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((w) => w && !SMALL_WORDS.has(w))
    .join(' ');
}

/** Other names → the key of the place they mean (both sides already normalised with placeKey). */
const BUILT_IN: Record<string, string> = {
  'institut superieur electronique paris': 'isep',
  'isep paris': 'isep',
  'institut etudes politiques paris': 'sciences po',
  'iep paris': 'sciences po',
  sciencespo: 'sciences po',
  'sciences po paris': 'sciences po',
  'ecole polytechnique federale lausanne': 'epfl',
  'hautes etudes commerciales paris': 'hec paris',
  'ecole hautes etudes commerciales paris': 'hec paris',
  hec: 'hec paris',
  essec: 'essec business school',
  'ecole superieure sciences economiques commerciales': 'essec business school',
  'institut national sciences appliquees lyon': 'insa lyon',
  aub: 'american university beirut',
  auk: 'american university kuwait',
  usj: 'universite saint joseph',
  'universite saint joseph beyrouth': 'universite saint joseph',
  'gulf university science technology': 'gust',
  ku: 'kuwait university',
  'universite koweit': 'kuwait university',
  ucl: 'university college london',
  kcl: 'king s college london',
  'kings college london': 'king s college london',
  nyu: 'new york university',
  mcgill: 'mcgill university',
  'universite mcgill': 'mcgill university',
  udem: 'universite montreal',
  ulb: 'universite libre bruxelles',
  'universite catholique louvain': 'uclouvain',
  'ecole polytechnique paris': 'ecole polytechnique',
  'x polytechnique': 'ecole polytechnique',
  sorbonne: 'sorbonne universite',
  'paris sorbonne': 'sorbonne universite',
  'universite paris 1': 'paris 1 pantheon sorbonne',
  'pantheon sorbonne': 'paris 1 pantheon sorbonne',
  amu: 'aix marseille universite',
  unige: 'universite geneve',
  'university geneva': 'universite geneve',
  columbia: 'columbia university',
  'university edinburgh': 'university edinburgh',
  edinburgh: 'university edinburgh',
};

export type PlaceAliases = Record<string, string>;

/** Admin merges are saved as JSON in app_settings (`placeAliases`). */
export function parseAliases(raw?: string): PlaceAliases {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw);
    return v && typeof v === 'object' ? (v as PlaceAliases) : {};
  } catch {
    return {};
  }
}

/** The group a name belongs to, following aliases (admin merges win over the built-in list). */
export function resolvePlace(name: string | null | undefined, aliases: PlaceAliases): string {
  let k = placeKey(name);
  for (let i = 0; i < 5 && k; i++) {
    const next = aliases[k] ?? BUILT_IN[k];
    if (!next || next === k) break;
    k = next;
  }
  return k;
}
