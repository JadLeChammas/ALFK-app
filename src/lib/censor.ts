import { BUILT_IN_BANNED_WORDS } from '@/data/badwords';

/**
 * Banned words, masked « ***** » when a text is shown (publications, bios, the circle, ads, questions,
 * clubs… — not private messages). The text itself is kept: a word added to the list is masked in old
 * texts too, a word taken off shows again. Matching ignores case and accents, and only whole words
 * (« con » is masked, « contact » is not); Japanese and Chinese words, written without spaces, match
 * anywhere.
 *
 * The admins' changes (Admin → Mots interdits) are the setting « bannedWords »:
 * { "added": [...], "removed": [...] }.
 */
export type BannedWords = { added: string[]; removed: string[] };

export const MASK = '*****';

export function parseBannedWords(raw?: string | null): BannedWords {
  try {
    const v = raw ? JSON.parse(raw) : null;
    return { added: Array.isArray(v?.added) ? v.added.filter((w: unknown) => typeof w === 'string') : [], removed: Array.isArray(v?.removed) ? v.removed.filter((w: unknown) => typeof w === 'string') : [] };
  } catch {
    return { added: [], removed: [] };
  }
}

/** Lower case, accents off — one character for one character, so that positions stay the same. */
function foldChar(ch: string) {
  const f = ch.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  if (f.length === ch.length) return f;
  const l = ch.toLowerCase();
  return l.length === ch.length ? l : ch;
}
export function fold(text: string) {
  let out = '';
  for (const ch of text) out += foldChar(ch);
  return out;
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const NO_SPACES = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;

/** Every built-in word, folded and without duplicates. */
export const builtInWords = () => [...new Set(Object.values(BUILT_IN_BANNED_WORDS).flat().map((w) => fold(w.trim())).filter(Boolean))];

/** The list in force: the built-in words, minus the ones the admins took off, plus theirs. */
export function activeWords(settings: BannedWords) {
  const removed = new Set(settings.removed.map((w) => fold(w.trim())));
  const words = new Set(builtInWords().filter((w) => !removed.has(w)));
  for (const w of settings.added) {
    const f = fold(w.trim());
    if (f) words.add(f);
  }
  return [...words];
}

/** A function that masks the banned words of a text. */
export function makeCensor(settings: BannedWords): (text?: string | null) => string {
  const words = activeWords(settings).sort((a, b) => b.length - a.length);
  // A space or a hyphen inside a phrase matches any run of spaces or hyphens.
  const pattern = (w: string) => escape(w).replace(/(\\-|\s)+/g, '[\\s\\-]+');
  const spaced = words.filter((w) => !NO_SPACES.test(w)).map(pattern);
  const unspaced = words.filter((w) => NO_SPACES.test(w)).map(pattern);
  const regexes = [
    spaced.length ? new RegExp(`(?<![\\p{L}\\p{N}])(?:${spaced.join('|')})(?![\\p{L}\\p{N}])`, 'gu') : null,
    unspaced.length ? new RegExp(`(?:${unspaced.join('|')})`, 'gu') : null,
  ].filter((r): r is RegExp => !!r);

  return (text) => {
    if (!text) return text ?? '';
    const folded = fold(text);
    const ranges: [number, number][] = [];
    for (const re of regexes) {
      re.lastIndex = 0;
      for (const m of folded.matchAll(re)) ranges.push([m.index ?? 0, (m.index ?? 0) + m[0].length]);
    }
    if (!ranges.length) return text;
    ranges.sort((a, b) => a[0] - b[0]);
    let out = '';
    let at = 0;
    for (const [start, end] of ranges) {
      if (start < at) continue; // overlapping match, already masked
      out += text.slice(at, start) + MASK;
      at = end;
    }
    return out + text.slice(at);
  };
}
