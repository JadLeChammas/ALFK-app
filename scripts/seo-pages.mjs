// After `expo export -p web`: one real HTML file per public page, so search engines index each page.
//
// The site is a single-page app: without this, every address returned the same empty index.html
// (same title, no text), and Google treated /association, /histoire, /adherer… as copies of one page.
// Each file below is that same index.html (same app, same scripts) with the page's own title,
// description, canonical address and social tags, plus the page's text and links inside #root. The
// app replaces that text as soon as it starts, so visitors see exactly the same site; search engines
// and link previews read a distinct, meaningful page for each address.
//
// Vercel serves an existing file before the SPA rewrite (cleanUrls: /association → association.html).

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve(process.argv[2] || 'dist');
const SITE = 'https://www.alfk.org';

/** Links shown on every page (internal linking helps discovery). */
const NAV = [
  ['/', 'Accueil'],
  ['/association', 'L’Amicale'],
  ['/histoire', 'Le LFK'],
  ['/bureau', 'Le bureau'],
  ['/partenaires', 'Partenaires'],
  ['/actualites', 'Actualités'],
  ['/adherer', 'Adhérer'],
  ['/contact', 'Contact'],
  ['/inscription', 'Créer un compte'],
  ['/connexion', 'Se connecter'],
];

/**
 * src/data/seo-pages.json: text that matches what each page shows (French, the site's default
 * language), shared with the app's <Seo> so titles match. `file`: the HTML file written in dist
 * (cleanUrls serves /x from x.html; "/" is index.html); `same`/`canonical`: an alias of another page.
 */
const PAGES = JSON.parse(fs.readFileSync(new URL('../src/data/seo-pages.json', import.meta.url), 'utf8'));


const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

let template = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
if (!template.includes('<div id="root"></div>')) throw new Error('seo-pages: <div id="root"></div> not found in dist/index.html');

/** A built file's address (its name carries a content hash, so it is found in dist after the export). */
function findAsset(dir, re) {
  const base = path.join(DIST, dir);
  if (!fs.existsSync(base)) return null;
  const stack = [base];
  while (stack.length) {
    const d = stack.pop();
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) stack.push(full);
      else if (re.test(e.name)) return '/' + path.relative(DIST, full).split(path.sep).join('/');
    }
  }
  return null;
}

// Speed: the fonts every page waits for start downloading with the HTML, not after the scripts ran
// (same files the app loads, so nothing changes on screen).
const FONTS = [/^Inter_400Regular\.[0-9a-f]+\.ttf$/, /^Inter_500Medium\.[0-9a-f]+\.ttf$/, /^Inter_600SemiBold\.[0-9a-f]+\.ttf$/, /^Inter_700Bold\.[0-9a-f]+\.ttf$/,
  /^InstrumentSerif_400Regular\.[0-9a-f]+\.ttf$/, /^InstrumentSerif_400Regular_Italic\.[0-9a-f]+\.ttf$/, /^BebasNeue_400Regular\.[0-9a-f]+\.ttf$/];
const fontLinks = FONTS.map((re) => findAsset('assets', re))
  .filter(Boolean)
  .map((href) => `<link rel="preload" href="${href}" as="font" type="font/ttf" crossorigin />`);
template = template.replace('</head>', `    ${fontLinks.join('\n    ')}\n  </head>`);
// The home page's first photo (its largest image): fetched at once, with high priority.
const heroPhoto = findAsset('assets', /^lfk-campus\.[0-9a-f]+\.webp$/);
const HOME = new Set(['/', '/bienvenue']);

function render(page) {
  const src = page.same ? PAGES.find((p) => p.path === page.same) : page;
  const canonical = `${SITE}${page.canonical ?? page.path}`;
  const title = esc(src.title);
  const desc = esc(src.description);
  let html = template;
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
  // drop the shared tags this page overrides, then add its own
  html = html
    .replace(/\s*<meta name="description"[^>]*>/g, '')
    .replace(/\s*<link rel="canonical"[^>]*>/g, '')
    .replace(/\s*<meta property="og:(title|description|url)"[^>]*>/g, '')
    .replace(/\s*<meta name="twitter:(title|description)"[^>]*>/g, '');
  if (page.noindex) html = html.replace(/<meta name="robots"[^>]*>/, '<meta name="robots" content="noindex, follow" />');
  const head = [
    ...(HOME.has(page.path) && heroPhoto ? [`<link rel="preload" href="${heroPhoto}" as="image" fetchpriority="high" />`] : []),
    `<meta name="description" content="${desc}" />`,
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${desc}" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${desc}" />`,
  ].join('\n    ');
  html = html.replace('</head>', `    ${head}\n  </head>`);
  // the page's text and links, replaced by the app when it starts
  const links = NAV.filter(([href]) => href !== (page.canonical ?? page.path))
    .map(([href, label]) => `<a href="${href}">${esc(label)}</a>`)
    .join(' · ');
  const content =
    `<div id="root"><main class="seo-static"><header><a href="/">Amicale LFK — ALFK Alumni</a></header>` +
    `<h1>${esc(src.h1)}</h1>` +
    src.body.map((p) => `<p>${esc(p)}</p>`).join('') +
    `<nav aria-label="Pages">${links}</nav></main></div>` +
    // outside #root: stays until the app has drawn its first screen, then fades out (app/_layout.tsx)
    `<div id="boot-splash" aria-hidden="true"><img src="/apple-touch-icon.png" alt="" width="72" height="72" /></div>`;
  return html.replace('<div id="root"></div>', content);
}

// Visitors never see that text: for the split second before the app starts they get a navy screen
// with the logo (the site's opening animation starts on the same navy and logo, so it hands over
// seamlessly). The text stays in the page for search engines and screen readers (visually hidden,
// the standard accessible pattern) and is replaced by the app's own content when it starts.
const STYLE = `<style id="seo-static">#boot-splash{position:fixed;inset:0;background:#0E2A47;display:flex;align-items:center;justify-content:center;z-index:2147483647;transition:opacity .25s ease}#boot-splash img{border-radius:50%}.seo-static{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}</style>`;

let written = 0;
for (const page of PAGES) {
  const out = path.join(DIST, page.file);
  const html = render(page).replace('</head>', `  ${STYLE}\n  </head>`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  written++;
}

// sitemap from the same list (canonical pages, not the ones search engines should not list). lastmod:
// the last commit that changed the page's file (its text in seo-pages.json counts too), else today.
const today = new Date().toISOString().slice(0, 10);
const SOURCE = { '/': 'src/app/(auth)/bienvenue.tsx', '/actualites': 'src/app/actualites/index.tsx' };
function lastChange(p) {
  const file = SOURCE[p.path] ?? `src/app${p.path}.tsx`;
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', file], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(out) ? out : today;
  } catch {
    return today;
  }
}
const prio = { '/': '1.0', '/association': '0.9', '/adherer': '0.9', '/histoire': '0.8', '/bureau': '0.7', '/partenaires': '0.7', '/actualites': '0.8', '/contact': '0.6', '/inscription': '0.6' };
const urls = PAGES.filter((p) => !p.canonical && !p.noindex)
  .map((p) => `  <url><loc>${SITE}${p.path}</loc><lastmod>${lastChange(p)}</lastmod><priority>${prio[p.path] ?? '0.3'}</priority></url>`)
  .join('\n');
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);

console.log(`seo-pages: ${written} pages + sitemap.xml written to ${DIST} (${fontLinks.length} fonts preloaded${heroPhoto ? ', hero photo preloaded' : ''})`);
