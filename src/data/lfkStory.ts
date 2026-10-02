import { useMemo } from 'react';

import { usePublicSetting } from './publicSettings';

/**
 * « Le LFK » page: the history of the lycée as a timeline, and fun facts. Written by admins in the
 * dashboard and saved as JSON in app_settings (`lfkStory`), readable by visitors (migration 013).
 * It starts empty: the content comes from the admins, not from the code.
 */
export type StoryEvent = { id: string; year: string; title: string; text?: string };
export type FunFact = { id: string; emoji?: string; title?: string; text: string };
export type LfkStory = { intro?: string; timeline: StoryEvent[]; facts: FunFact[] };

export const EMPTY_STORY: LfkStory = { timeline: [], facts: [] };

export function parseStory(raw?: string | null): LfkStory | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    return v && Array.isArray(v.timeline) && Array.isArray(v.facts) ? (v as LfkStory) : null;
  } catch {
    return null;
  }
}

/** The saved page; years in order on the timeline. */
export function useLfkStory() {
  const raw = usePublicSetting('lfkStory');
  return useMemo(() => {
    const saved = parseStory(raw);
    const story = saved ?? EMPTY_STORY;
    const yearOf = (y: string) => parseInt(y, 10) || 0;
    return { story: { ...story, timeline: [...story.timeline].sort((a, b) => yearOf(a.year) - yearOf(b.year)) }, custom: !!saved };
  }, [raw]);
}
