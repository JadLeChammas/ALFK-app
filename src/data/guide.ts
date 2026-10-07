import { useMemo } from 'react';

import { useStore } from './store';

/**
 * Country guides (« Arriver en France », later other countries): the steps before leaving and after
 * arriving (visa, residence permit, social security…). Admins manage them in the dashboard; they are
 * saved as JSON in app_settings (`guides`) — the content lives only in the database, not in the code
 * (or, from before, the France-only guide under `guideFrance`).
 */
export type GuidePhase = 'before' | 'arrival' | 'months' | 'year';
/** `…En`: the English version, read in every language but French (see `bi` in i18n). */
export type GuideStep = { id: string; phase: GuidePhase; title: string; body: string; url?: string; urlLabel?: string; titleEn?: string; bodyEn?: string; urlLabelEn?: string };
export type CountryGuide = {
  id: string;
  /** ISO code, see countries.ts */
  country: string;
  /** Written by the admins; empty = « Guide — {country} » in the reader's language. */
  title?: string;
  intro?: string;
  titleEn?: string;
  introEn?: string;
  /** Drafts are only visible to admins. */
  published: boolean;
  steps: GuideStep[];
  /** From when guides were built in: a deleted one, kept so that it did not come back. Ignored. */
  hidden?: boolean;
};

export const PHASES: GuidePhase[] = ['before', 'arrival', 'months', 'year'];

const parse = <T,>(raw?: string): T | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

/** All country guides (drafts included; filter on `published` for members). */
export function useGuides() {
  const { db } = useStore();
  const raw = db.settings.guides;
  const legacy = db.settings.guideFrance;
  return useMemo(() => {
    const saved = parse<CountryGuide[]>(raw);
    if (Array.isArray(saved)) return { guides: saved.filter((g) => !g.hidden) };
    // The France-only guide saved before there were several countries.
    const france = parse<GuideStep[]>(legacy);
    return { guides: Array.isArray(france) ? [{ id: 'guide-fr', country: 'FR', title: 'Arriver en France', published: true, steps: france }] : [] };
  }, [raw, legacy]);
}
