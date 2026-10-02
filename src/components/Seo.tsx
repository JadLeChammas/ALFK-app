import { usePathname } from 'expo-router';
import Head from 'expo-router/head';

const SITE = 'https://www.alfk.org';
const BRAND = 'ALFK Alumni';
const DEFAULT_TITLE = `${BRAND} — Amicale des anciens élèves du Lycée Français de Koweït`;
const DEFAULT_DESCRIPTION =
  'Le réseau des anciens élèves du Lycée Français de Koweït : annuaire, carte des universités, événements et entraide, du Koweït au monde entier.';

/**
 * Per-page title, description and canonical address for search engines (and the browser tab).
 * Link previews that do not run JavaScript use the shared tags of public/index.html instead.
 */
export function Seo({ title, description }: { title?: string; description?: string }) {
  const pathname = usePathname();
  const path = pathname === '/bienvenue' ? '/' : pathname;
  const fullTitle = title ? `${title} · ${BRAND}` : DEFAULT_TITLE;
  const text = (description || DEFAULT_DESCRIPTION).replace(/\s+/g, ' ').trim();
  const desc = text.length > 160 ? `${text.slice(0, 157).replace(/\s+\S*$/, '')}…` : text;
  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={`${SITE}${path}`} />
    </Head>
  );
}
