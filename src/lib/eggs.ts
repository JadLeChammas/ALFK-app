import AsyncStorage from '@react-native-async-storage/async-storage';

import type { User } from '@/data/types';

/**
 * Easter eggs (the full list with how to find them is in EASTER_EGGS.md).
 * A tiny event bus lets a search box or the footer trigger an effect drawn at the root.
 */
export type EggEvent = 'sandstorm' | 'credits';

const listeners = new Map<EggEvent, Set<() => void>>();
/** Credits shown once instead of the saved ones (admin preview of unsaved changes). */
let creditsPreview: unknown = null;
export function previewCredits(config: unknown) {
  creditsPreview = config;
  eggs.emit('credits');
}
export function takeCreditsPreview<T>(): T | null {
  const c = creditsPreview as T | null;
  creditsPreview = null;
  return c;
}

export const eggs = {
  on(e: EggEvent, fn: () => void) {
    if (!listeners.has(e)) listeners.set(e, new Set());
    listeners.get(e)!.add(fn);
    return () => {
      listeners.get(e)!.delete(fn);
    };
  },
  emit(e: EggEvent) {
    listeners.get(e)?.forEach((fn) => fn());
  },
};

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** « chameau », « 50°C » or « shamal » (the hot sand wind of Kuwait) → sandstorm. */
export function isSandWord(q: string) {
  const n = norm(q).replace(/\s+/g, '');
  return n === 'chameau' || n === 'shamal' || n === '50°c' || n === '50c' || n === '50°';
}

/**
 * Legends: searching one of these full names (any case, accents or spacing) shows their special card —
 * the site's creator, and the Amicale's legendary ambassador. `kind` picks the texts (`eggs.legends`).
 */
export const LEGENDS = [
  { name: 'Jad El Chammas', kind: 'developer', emoji: '🏆' },
  { name: 'Adriano Sfeir', kind: 'ambassador', emoji: '🎖️' },
] as const;
export type Legend = (typeof LEGENDS)[number];
export const CREATOR = LEGENDS[0].name;
/** The legend whose full name was typed, if any. */
export function legendQuery(q: string): Legend | undefined {
  const n = norm(q).replace(/\s+/g, ' ');
  return LEGENDS.find((l) => norm(l.name) === n);
}

/** Birthday today, and allowed to be seen by this viewer. */
export function birthdayToday(u: Pick<User, 'id' | 'birthDate' | 'privacy'>, viewer?: Pick<User, 'id' | 'role'> | null) {
  if (!u.birthDate) return false;
  if (!u.privacy.showBirthday && viewer?.id !== u.id && viewer?.role !== 'admin') return false;
  const [, m, d] = u.birthDate.split('-').map(Number);
  const t = new Date();
  return t.getMonth() + 1 === m && t.getDate() === d;
}

// ——— Logo taps: 5 in a row = retro mode, 7 = Pirate ———
// Kept outside React: the first tap may change page and remount the header that was tapped.
let burst = 0;
let burstTimer: ReturnType<typeof setTimeout> | null = null;
export function logoTap(handlers: { first?: () => void; five: () => void; seven: () => void }) {
  burst += 1;
  if (burst === 1) handlers.first?.();
  if (burstTimer) clearTimeout(burstTimer);
  burstTimer = setTimeout(() => {
    const n = burst;
    burst = 0;
    if (n >= 7) handlers.seven();
    else if (n >= 5) handlers.five();
  }, 700);
}

/** The language to come back to when leaving Pirate. */
const PREV_LANG = 'lfk.prevLang';
export const rememberLang = (l: string) => AsyncStorage.setItem(PREV_LANG, l).catch(() => {});
export const previousLang = async () => (await AsyncStorage.getItem(PREV_LANG).catch(() => null)) ?? 'fr';
