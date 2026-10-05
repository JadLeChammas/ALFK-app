import type { IconName } from '@/components/ui/primitives';

/**
 * Ready-made reasons for an admin's urgent message (Admin → Messages urgents). Each one has its text in
 * every language (`urgent.reasons.<key>` in the dictionaries) and, when the member can fix it themselves,
 * the page that does it. To add one: a line here and its texts in the dictionaries.
 */
export type UrgentReasonKey = 'invalidPhoto';

export const URGENT_REASONS: { key: UrgentReasonKey; icon: IconName; href?: string }[] = [
  { key: 'invalidPhoto', icon: 'camera', href: '/profil/modifier' },
];

export const urgentReason = (key: string) => URGENT_REASONS.find((r) => r.key === key);
