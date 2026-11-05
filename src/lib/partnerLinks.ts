import { router } from 'expo-router';

import { isHiDev } from '@/data/partners';
import type { Institution } from '@/data/types';
import { openExternal } from './links';

/** Hi Dev Mobile, the studio that builds the platform, has its own page on the site. */
export const HIDEV_PAGE = '/hi-dev-mobile';

type PartnerLike = Pick<Institution, 'name' | 'logo' | 'website'>;

/** A partner card or logo: Hi Dev opens its page here, the others their own website. */
export function openPartner(x: PartnerLike) {
  if (isHiDev(x)) router.push(HIDEV_PAGE as never);
  else if (x.website) openExternal(x.website);
}

export const hasPartnerLink = (x: PartnerLike) => isHiDev(x) || !!x.website;
