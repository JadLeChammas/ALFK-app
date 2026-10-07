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

const template = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
if (!template.includes('<div id="root"></div>')) throw new Error('seo-pages: <div id="root"></div> not found in dist/index.html');

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
  const head = [
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

// sitemap from the same list (canonical pages only)
const today = new Date().toISOString().slice(0, 10);
const prio = { '/': '1.0', '/association': '0.9', '/adherer': '0.9', '/histoire': '0.8', '/bureau': '0.7', '/partenaires': '0.7', '/actualites': '0.8', '/contact': '0.6', '/inscription': '0.6' };
const urls = PAGES.filter((p) => !p.canonical)
  .map((p) => `  <url><loc>${SITE}${p.path}</loc><lastmod>${today}</lastmod><priority>${prio[p.path] ?? '0.3'}</priority></url>`)
  .join('\n');
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);

console.log(`seo-pages: ${written} pages + sitemap.xml written to ${DIST}`);
