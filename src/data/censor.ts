import { useMemo } from 'react';

import { makeCensor, parseBannedWords } from '@/lib/censor';
import { usePublicSetting } from './publicSettings';

/**
 * Masks the banned words of a text when it is shown: `const c = useCensor(); <Txt>{c(user.bio)}</Txt>`.
 * Everything members write publicly goes through it — not private messages.
 */
export function useCensor() {
  const raw = usePublicSetting('bannedWords');
  return useMemo(() => makeCensor(parseBannedWords(raw)), [raw]);
}
