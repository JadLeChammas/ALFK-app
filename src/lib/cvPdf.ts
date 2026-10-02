import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import type { Cv, CvEntry } from '@/data/types';

/** Everything the PDF shows, already translated by the caller. */
export type CvDoc = {
  name: string;
  headline?: string;
  avatar?: string;
  contact: string[];
  links: string[];
  cv: Cv;
  /** The LFK line added under Education. */
  lfk?: CvEntry;
  locale: string;
  labels: {
    experience: string; education: string; projects: string; associations: string;
    skills: string; languages: string; interests: string; present: string; levels: string[];
    footer: string;
  };
};

const esc = (s?: string) => (s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function formatYm(ym: string | undefined, locale: string) {
  if (!ym) return '';
  const [y, m] = ym.split('-').map(Number);
  if (!m) return String(y);
  return new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' }).format(new Date(y, m - 1, 1));
}

export function period(e: CvEntry, locale: string, present: string) {
  if (!e.start) return formatYm(e.end, locale);
  return `${formatYm(e.start, locale)} – ${e.end ? formatYm(e.end, locale) : present}`;
}

/** Most recent first: ongoing entries, then by end, then by start. */
export function sortEntries(list: CvEntry[] = []) {
  const key = (e: CvEntry) => (e.end ? e.end : '9999') + (e.start ?? '');
  return [...list].sort((a, b) => (key(a) < key(b) ? 1 : -1));
}

function section(title: string, entries: CvEntry[], doc: CvDoc) {
  if (!entries.length) return '';
  return `<h2>${esc(title)}</h2>${entries
    .map(
      (e) => `<div class="entry">
        <div class="row"><div class="t">${esc(e.title)}</div><div class="when">${esc(period(e, doc.locale, doc.labels.present))}</div></div>
        ${e.org || e.place ? `<div class="org">${esc([e.org, e.place].filter(Boolean).join(' · '))}</div>` : ''}
        ${e.description ? `<div class="desc">${esc(e.description).replace(/\n/g, '<br/>')}</div>` : ''}
        ${e.url ? `<div class="url">${esc(e.url)}</div>` : ''}
      </div>`,
    )
    .join('')}`;
}

export function cvHtml(doc: CvDoc) {
  const { cv, labels } = doc;
  const education = [...sortEntries(cv.education), ...(doc.lfk ? [doc.lfk] : [])];
  const dots = (n: number) => Array.from({ length: 5 }, (_, i) => `<span class="dot${i < n ? ' on' : ''}"></span>`).join('');
  const side = [
    cv.languages?.length
      ? `<h3>${esc(labels.languages)}</h3>${cv.languages.map((l) => `<div class="lang"><div>${esc(l.name)}<small>${esc(labels.levels[l.level - 1])}</small></div><div>${dots(l.level)}</div></div>`).join('')}`
      : '',
    cv.skills?.length ? `<h3>${esc(labels.skills)}</h3><div class="tags">${cv.skills.map((s) => `<span>${esc(s)}</span>`).join('')}</div>` : '',
    cv.interests?.length ? `<h3>${esc(labels.interests)}</h3><div class="tags">${cv.interests.map((s) => `<span>${esc(s)}</span>`).join('')}</div>` : '',
  ].join('');
  return `<!doctype html><html><head><meta charset="utf-8"/><title>${esc(doc.name)} — CV</title>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #14213d; font-size: 11pt; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { width: 210mm; min-height: 297mm; display: flex; flex-direction: column; }
  header { background: #0E2A47; color: #fff; padding: 14mm 14mm 10mm; display: flex; gap: 8mm; align-items: center; border-bottom: 3mm solid #C53B3E; }
  header img { width: 28mm; height: 28mm; border-radius: 50%; object-fit: cover; border: 1mm solid #fff; }
  header h1 { margin: 0; font-family: Georgia, 'Times New Roman', serif; font-weight: normal; font-size: 26pt; }
  header .hl { margin-top: 2mm; font-size: 12pt; color: #E7ECF2; }
  header .contact { margin-top: 3mm; font-size: 9pt; color: #E4EAF4; }
  .body { display: flex; flex: 1; }
  aside { width: 62mm; background: #E4EAF4; padding: 8mm 7mm; }
  main { flex: 1; padding: 8mm 12mm; }
  h2 { font-size: 10pt; letter-spacing: .12em; text-transform: uppercase; color: #C53B3E; border-bottom: .3mm solid #E7ECF2; padding-bottom: 1.5mm; margin: 6mm 0 3mm; }
  h2:first-child { margin-top: 0; }
  h3 { font-size: 9pt; letter-spacing: .12em; text-transform: uppercase; color: #0E2A47; margin: 5mm 0 2.5mm; }
  h3:first-child { margin-top: 0; }
  .entry { margin-bottom: 4mm; page-break-inside: avoid; }
  .row { display: flex; justify-content: space-between; gap: 4mm; }
  .t { font-weight: bold; }
  .when { color: #D7B46A; font-size: 9pt; white-space: nowrap; }
  .org { color: #0E2A47; font-size: 10pt; }
  .desc { margin-top: 1mm; font-size: 9.5pt; color: #33415c; line-height: 1.4; }
  .url { font-size: 8.5pt; color: #D7B46A; }
  .lang { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2mm; font-size: 9.5pt; }
  .lang small { display: block; color: #D7B46A; font-size: 8pt; }
  .dot { display: inline-block; width: 2.2mm; height: 2.2mm; border-radius: 50%; background: #E7ECF2; margin-left: .8mm; }
  .dot.on { background: #0E2A47; }
  .tags span { display: inline-block; background: #fff; border-radius: 3mm; padding: .8mm 2.4mm; margin: 0 1mm 1.4mm 0; font-size: 8.5pt; }
  .links { margin-top: 5mm; font-size: 8.5pt; color: #0E2A47; word-break: break-all; }
  footer { text-align: center; font-size: 7.5pt; color: #D7B46A; padding: 3mm; }
</style></head><body><div class="page">
<header>
  ${doc.avatar?.startsWith('http') ? `<img src="${esc(doc.avatar)}"/>` : ''}
  <div><h1>${esc(doc.name)}</h1>${doc.headline ? `<div class="hl">${esc(doc.headline)}</div>` : ''}<div class="contact">${doc.contact.map(esc).join(' &nbsp;·&nbsp; ')}</div></div>
</header>
<div class="body">
  <aside>${side}${doc.links.length ? `<div class="links">${doc.links.map(esc).join('<br/>')}</div>` : ''}</aside>
  <main>
    ${section(labels.experience, sortEntries(cv.experience), doc)}
    ${section(labels.education, education, doc)}
    ${section(labels.projects, sortEntries(cv.projects), doc)}
    ${section(labels.associations, sortEntries(cv.associations), doc)}
  </main>
</div>
<footer>${esc(labels.footer)}</footer>
</div></body></html>`;
}

/**
 * Web: opens the CV in a new tab and the print dialog (« Save as PDF »).
 * Phones: makes a PDF file and opens the share sheet (save, mail, WhatsApp…).
 */
export async function exportCvPdf(doc: CvDoc) {
  const html = cvHtml(doc);
  if (Platform.OS === 'web') {
    const w = window.open('', '_blank');
    if (!w) return false;
    w.document.open();
    w.document.write(html);
    w.document.close();
    // Once the photo has loaded; some browsers never fire onload for document.write, hence the fallback.
    let printed = false;
    const print = () => {
      if (printed) return;
      printed = true;
      w.focus();
      w.print();
    };
    w.onload = () => setTimeout(print, 250);
    setTimeout(print, 1200);
    return true;
  }
  const { uri } = await Print.printToFileAsync({ html, width: 595, height: 842 });
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { UTI: 'com.adobe.pdf', mimeType: 'application/pdf', dialogTitle: doc.name });
  return true;
}
