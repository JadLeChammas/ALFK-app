import { useMemo } from 'react';

import { useI18n } from '@/i18n';
import { COUNTRIES, type Country } from './countries';
import { usePublicOverview } from './public';

/**
 * Aggregate, non-personal figures about the network, in the shape the site blocks expect.
 * Built on `usePublicOverview()`: members read their own data, visitors get totals only
 * (Supabase function `public_overview`, migration 004).
 */
export function useCommunity() {
  const o = usePublicOverview();
  return useMemo(() => {
    const destinations: { country: Country; n: number }[] = o.destinations
      .map((x) => ({ country: COUNTRIES.find((c) => c.code === x.code), n: x.n }))
      .filter((x): x is { country: Country; n: number } => !!x.country);
    return {
      alumni: o.alumni,
      members: o.members,
      pupils: o.pupils ?? 0,
      countries: o.countries,
      promos: o.promos,
      universities: o.universities,
      nationalities: o.nationalities ?? 0,
      destinations,
      schools: o.schools.map((name) => ({ name, country: undefined as string | undefined })),
    };
  }, [o]);
}

/** The president's word (shown once an admin has the role title « Président »). */
export function usePublishedQuotes() {
  const { d } = useI18n();
  const o = usePublicOverview();
  return useMemo(() => {
    const president = o.bureau.find((p) => p.role === 'admin' && /pr[ée]sident/i.test(p.fonction ?? ''));
    if (!president) return [];
    return [{ quote: d.site.home.quote, author: president.name, image: president.avatar, fonction: president.fonction, isPresident: true, role: 'admin' as const }];
  }, [o, d]);
}
