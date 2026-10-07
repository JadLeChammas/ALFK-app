import { usePublicSetting } from './publicSettings';

/**
 * The legal texts the admins write and publish themselves (Admin → Textes légaux): the terms of use
 * (CGU), the privacy policy and the legal notice, in French and English. Kept in app_settings
 * (« legalTexts », readable by visitors since migration 046). Until one is published, the site
 * shows its built-in text (the terms of use page says they are coming).
 *
 * Format of a text: « ## Title » and « ### Sub-title » lines, « - » list items, paragraphs separated
 * by an empty line, « **bold** », and table rows « | a | b | ».
 */
export type LegalDoc = 'cgu' | 'privacy' | 'mentions';
export const LEGAL_DOCS: LegalDoc[] = ['cgu', 'privacy', 'mentions'];
export type LegalLocale = 'fr' | 'en';
export type LegalTexts = Partial<Record<LegalDoc, { fr?: string; en?: string; updatedAt?: string }>>;

export function parseLegalTexts(raw?: string | null): LegalTexts {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw);
    return v && typeof v === 'object' ? (v as LegalTexts) : {};
  } catch {
    return {};
  }
}

/** The published text of `doc` in the reader's language (French when there is no English one), if any. */
export function useLegalText(doc: LegalDoc, lang: string): { text?: string; updatedAt?: string } {
  const entry = parseLegalTexts(usePublicSetting('legalTexts'))[doc];
  if (!entry) return {};
  const text = (lang === 'en' ? entry.en?.trim() || entry.fr?.trim() : entry.fr?.trim() || entry.en?.trim()) || undefined;
  return { text, updatedAt: text ? entry.updatedAt : undefined };
}

/** One block of a legal text, for display. */
export type LegalBlock =
  | { kind: 'h2'; text: string }
  | { kind: 'h3'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'table'; rows: string[][] };

/** Splits a text into headings, paragraphs, lists and tables. */
export function legalBlocks(text: string): LegalBlock[] {
  const blocks: LegalBlock[] = [];
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  let para: string[] = [];
  const flush = () => {
    if (para.length) blocks.push({ kind: 'p', text: para.join(' ').trim() });
    para = [];
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    if (line.startsWith('### ')) {
      flush();
      blocks.push({ kind: 'h3', text: line.slice(4) });
    } else if (line.startsWith('## ') || line.startsWith('# ')) {
      flush();
      blocks.push({ kind: 'h2', text: line.replace(/^#+\s*/, '') });
    } else if (/^[-*•]\s+/.test(line) || /^- \[[ x]\]\s+/i.test(line)) {
      flush();
      const item = line.replace(/^- \[[ x]\]\s+/i, '').replace(/^[-*•]\s+/, '');
      const last = blocks[blocks.length - 1];
      if (last?.kind === 'list') last.items.push(item);
      else blocks.push({ kind: 'list', items: [item] });
    } else if (line.startsWith('|')) {
      flush();
      const cells = line.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue; // the |---| separator
      const last = blocks[blocks.length - 1];
      if (last?.kind === 'table') last.rows.push(cells);
      else blocks.push({ kind: 'table', rows: [cells] });
    } else {
      para.push(line);
    }
  }
  flush();
  return blocks;
}
