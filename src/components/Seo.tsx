import { usePathname } from 'expo-router';
import Head from 'expo-router/head';

import seoPages from '@/data/seo-pages.json';
import { useI18n } from '@/i18n';

const SITE = 'https://www.alfk.org';
const BRAND = 'Amicale LFK (ALFK)';
const DEFAULT_TITLE = 'Amicale LFK — Alumni du Lycée Français du Koweït (ALFK)';
const DEFAULT_DESCRIPTION =
  'Amicale LFK (ALFK) : le réseau des anciens élèves du Lycée Français du Koweït. Annuaire des alumni LFK, universités, orientation, événements et entraide.';

/**
 * Per-page title, description and canonical address for search engines (and the browser tab).
 * Search engines and link previews that do not run JavaScript read the per-page HTML written at build
 * time by scripts/seo-pages.mjs (same titles).
 */
export function Seo({ title, description }: { title?: string; description?: string }) {
  const pathname = usePathname();
  const { lang } = useI18n();
  const path = pathname === '/bienvenue' ? '/' : pathname;
  // In French (the default, and what search engines see) the public pages use the same title and
  // description as their pre-rendered HTML (src/data/seo-pages.json, scripts/seo-pages.mjs).
  const page = lang === 'fr' ? (seoPages as { path: string; title?: string; description?: string }[]).find((p) => p.path === path && p.title) : undefined;
  const fullTitle = page?.title ?? (title ? `${title} · ${BRAND}` : DEFAULT_TITLE);
  const text = (page?.description || description || DEFAULT_DESCRIPTION).replace(/\s+/g, ' ').trim();
  const desc = text.length > 160 ? `${text.slice(0, 157).replace(/\s+\S*$/, '')}…` : text;
  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={`${SITE}${path}`} />
    </Head>
  );
}
