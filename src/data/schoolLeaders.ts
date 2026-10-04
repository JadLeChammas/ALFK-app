import { useMemo } from 'react';

import { usePublicSetting } from './publicSettings';

/**
 * The heads of the LFK through the years: the lycée's proviseurs, the primary school's directors and
 * the CPE (conseillers principaux d'éducation), shown as timelines of round portraits (Partners / honorary members page, public).
 * Saved by the admins as JSON in app_settings (`schoolLeaders`), readable by visitors (migration 028).
 */
export type LeaderKind = 'proviseur' | 'directeur' | 'cpe';
export const LEADER_KINDS: LeaderKind[] = ['proviseur', 'directeur', 'cpe'];
export type SchoolLeader = {
  id: string;
  kind: LeaderKind;
  name: string;
  /** First and last school year in office (`to` empty = in office now). */
  from?: number;
  to?: number;
  photo?: string;
  /** A few words under the name (optional): career, memories, what they brought to the LFK. */
  description?: string;
};

/** The timelines, oldest first (people without dates at the start). */
export function useSchoolLeaders() {
  const raw = usePublicSetting('schoolLeaders');
  return useMemo(() => {
    let list: SchoolLeader[] = [];
    try {
      const parsed = JSON.parse(raw ?? '[]');
      if (Array.isArray(parsed)) list = parsed.filter((x) => x && typeof x.name === 'string');
    } catch {}
    const sorted = [...list].sort((a, b) => (a.from ?? 0) - (b.from ?? 0) || (a.to ?? 9999) - (b.to ?? 9999));
    return { all: list, byKind: (k: LeaderKind) => sorted.filter((x) => x.kind === k) };
  }, [raw]);
}
