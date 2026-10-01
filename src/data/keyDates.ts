import { useStore } from './store';
import type { KeyDate } from './types';

/**
 * Calendar dates can be a single day or a period (Parcoursup, competitive exams, applications…).
 * A period whose end comes before its start in the year runs into the next year.
 */
export type Occurrence = { k: KeyDate; start: Date; end: Date; range: boolean };

const DAY = 86_400_000;
const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** The occurrence of `k` starting in `year` (null for a one-off date of another year). */
export function occurrence(k: KeyDate, year: number): Occurrence | null {
  if (k.year && k.year !== year) return null;
  const start = new Date(year, k.month - 1, k.day);
  const range = !!k.endMonth && !!k.endDay;
  if (!range) return { k, start, end: start, range };
  const wraps = k.endMonth! * 100 + k.endDay! < k.month * 100 + k.day;
  return { k, start, end: new Date(year + (wraps ? 1 : 0), k.endMonth! - 1, k.endDay!), range };
}

/** Occurrences touching the given year (including periods that started the year before). */
export function occurrencesAround(k: KeyDate, year: number) {
  return [occurrence(k, year - 1), occurrence(k, year)].filter((o): o is Occurrence => !!o && o.end.getFullYear() >= year && o.start.getFullYear() <= year);
}

export const daysBetween = (from: Date, to: Date) => Math.round((midnight(to).getTime() - midnight(from).getTime()) / DAY);

/** Procedures (category « démarches ») in progress or coming up, soonest first. */
export function useUpcomingProcedures(limit = 5) {
  const { db } = useStore();
  const today = midnight(new Date());
  const y = today.getFullYear();
  const list: (Occurrence & { ongoing: boolean; inDays: number; leftDays: number })[] = [];
  for (const k of db.keyDates) {
    if (k.category !== 'demarches') continue;
    // Next occurrence that has not ended yet.
    const o = [occurrence(k, y - 1), occurrence(k, y), occurrence(k, y + 1)].find((x) => x && x.end >= today);
    if (!o) continue;
    list.push({ ...o, ongoing: o.start <= today, inDays: daysBetween(today, o.start), leftDays: daysBetween(today, o.end) });
  }
  return list.sort((a, b) => a.start.getTime() - b.start.getTime()).slice(0, limit);
}
