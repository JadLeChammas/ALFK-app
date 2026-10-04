import type { Institution } from './types';

/**
 * Partner institutions. Hi Dev Mobile Inc — the studio that builds the platform — always closes
 * the list, whatever order the admins give the others.
 */
const LOGOS: Record<string, number> = {
  lfk: require('@/assets/images/institution-lfk.png'),
  hidev: require('@/assets/images/partner-hidev.png'),
};

type PartnerLike = Pick<Institution, 'name' | 'logo'>;

export const isHiDev = (i: PartnerLike) => i.logo === 'hidev' || /^\s*hi\s*dev\b/i.test(i.name);

export function sortPartners<T extends Institution>(list: T[]): T[] {
  return [...list].sort((a, b) => Number(isHiDev(a)) - Number(isHiDev(b)) || a.order - b.order);
}

/** The Lycée Français du Koweït's own logo (partners, the « Le LFK » page). */
export const LFK_LOGO = LOGOS.lfk;

/** A bundled logo (`lfk`, `hidev`), an image URL, or nothing. */
export function partnerLogo(i: PartnerLike) {
  const key = i.logo ?? (isHiDev(i) ? 'hidev' : undefined);
  return key ? (LOGOS[key] ?? { uri: key }) : undefined;
}
