/**
 * Builds the list of universities / higher-education establishments used when members pick
 * their school: one small file per country in public/universities/{CC}.json, loaded only when
 * that country is chosen.
 *
 * Source: OpenAlex (https://openalex.org, open data, CC0): every institution of type "education", plus
 * those of type "other" / "facility" whose name looks like a school (ESSEC and Sciences Po are filed there).
 * Each entry: [name, city, acronyms joined by "|"], sorted by importance (works count).
 *
 * Run again to refresh:   node scripts/build-universities.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = join(process.cwd(), 'public', 'universities');
const FIELDS = 'display_name,display_name_acronyms,geo,works_count';
const byCountry = new Map();
const SCHOOL_LIKE = /universit|[ée]cole|school|coll[eè]ge|hochschule|universidad|universidade|universit[àa]|polytechn|[ée]tudes politiques|sciences po|academy|acad[ée]mie|conservatoi|business|institut national des sciences appliqu|grande [ée]cole/i;
const NOT_SCHOOL = /laborat|research cent|centre de recherche|hospital|h[oô]pital|unit[ée] mixte|umr|museum|mus[ée]e/i;

let total = 0;
for (const [type, keep] of [['education', () => true], ['other|facility', (n) => SCHOOL_LIKE.test(n) && !NOT_SCHOOL.test(n)]]) {
let cursor = '*';
let page = 0;
while (cursor) {
  const url = `https://api.openalex.org/institutions?filter=type:${type}&select=${FIELDS}&per_page=200&cursor=${encodeURIComponent(cursor)}`;
  let res;
  for (let attempt = 0; attempt < 5; attempt++) {
    res = await fetch(url);
    if (res.ok) break;
    await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
  }
  if (!res.ok) throw new Error(`OpenAlex ${res.status} on page ${page}`);
  const data = await res.json();
  for (const r of data.results) {
    const cc = r.geo?.country_code;
    if (!cc || !r.display_name || !keep(r.display_name)) continue;
    const list = byCountry.get(cc) ?? [];
    list.push({ n: r.display_name.trim(), c: (r.geo.city ?? '').trim(), a: (r.display_name_acronyms ?? []).join('|'), w: r.works_count ?? 0 });
    byCountry.set(cc, list);
    total++;
  }
  cursor = data.meta.next_cursor;
  page++;
  if (page % 20 === 0) console.log(`${type}: ${total} establishments…`);
}
}

mkdirSync(OUT, { recursive: true });
const index = {};
for (const [cc, list] of byCountry) {
  list.sort((x, y) => y.w - x.w);
  const rows = list.map((x) => (x.a ? [x.n, x.c, x.a] : [x.n, x.c]));
  writeFileSync(join(OUT, `${cc}.json`), JSON.stringify(rows));
  index[cc] = rows.length;
}
writeFileSync(join(OUT, 'index.json'), JSON.stringify(index));
console.log(`Done: ${total} establishments in ${byCountry.size} countries → public/universities/`);
