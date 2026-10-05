import type { Institution } from './types';

/**
 * Partner institutions, in the order the admins give them (arrows on the Partners page) — Hi Dev
 * Mobile Inc, the studio that builds the platform, included.
 */
const LOGOS: Record<string, number> = {
  lfk: require('@/assets/images/institution-lfk.png'),
  hidev: require('@/assets/images/partner-hidev.png'),
};

type PartnerLike = Pick<Institution, 'name' | 'logo'>;

export const isHiDev = (i: PartnerLike) => i.logo === 'hidev' || /^\s*hi\s*dev\b/i.test(i.name);

/** By the admins' order; on a tie (never ordered yet), Hi Dev comes after the others. */
export function sortPartners<T extends Institution>(list: T[]): T[] {
  return [...list].sort((a, b) => a.order - b.order || Number(isHiDev(a)) - Number(isHiDev(b)));
}

/** The Lycée Français du Koweït's own logo (partners, the « Le LFK » page). */
export const LFK_LOGO = LOGOS.lfk;

/** A bundled logo (`lfk`, `hidev`), an image URL, or nothing. */
export function partnerLogo(i: PartnerLike) {
  const key = i.logo ?? (isHiDev(i) ? 'hidev' : undefined);
  return key ? (LOGOS[key] ?? { uri: key }) : undefined;
}
