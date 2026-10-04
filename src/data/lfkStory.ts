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

export type StorySection = { heading?: string; paragraphs: string[] };

/**
 * The intro written by the admins, as an article: a short line on its own (80 characters at most, no
 * final punctuation, with text after it) is a heading; when the text opens with two headings in a
 * row, the first is the article's title. Every other line is a paragraph.
 */
export function parseStoryText(text: string): { title?: string; sections: StorySection[] } {
  const lines = text.replace(/\r/g, '').split('\n').map((l) => l.trim()).filter(Boolean);
  const heading = (k: number) => k < lines.length - 1 && lines[k].length <= 80 && !/[.!?:;…,»"”)]$/.test(lines[k]);
  let start = 0;
  let title: string | undefined;
  if (lines.length > 2 && heading(0) && heading(1)) {
    title = lines[0];
    start = 1;
  }
  const sections: StorySection[] = [];
  for (let k = start; k < lines.length; k++) {
    if (heading(k)) sections.push({ heading: lines[k], paragraphs: [] });
    else if (sections.length) sections[sections.length - 1].paragraphs.push(lines[k]);
    else sections.push({ paragraphs: [lines[k]] });
  }
  return { title, sections };
}

/** The founding year: the first year written in the intro, or else the timeline's first one. */
export function foundingYear(story: LfkStory): string | undefined {
  const inText = story.intro?.match(/\b(1[89]\d{2}|20\d{2})\b/)?.[1];
  return inText ?? story.timeline.find((e) => /^\d{4}$/.test(e.year.trim()))?.year.trim();
}

/** The saved page; years in order on the timeline. */
export function useLfkStory() {
  const raw = usePublicSetting('lfkStory');
  return useMemo(() => {
    const saved = parseStory(raw);
    const story = saved ?? EMPTY_STORY;
    // « 2002 », « avril 2002 », « 1989–1995 »: the first year written; a word (« Aujourd'hui ») comes last.
    const yearOf = (y: string) => Number(y.match(/\d{4}/)?.[0] ?? Infinity);
    return { story: { ...story, timeline: [...story.timeline].sort((a, b) => yearOf(a.year) - yearOf(b.year)) }, custom: !!saved };
  }, [raw]);
}
