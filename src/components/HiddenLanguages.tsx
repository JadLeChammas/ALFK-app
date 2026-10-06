import { useEffect } from 'react';
import { Platform } from 'react-native';

import { useDialogs } from '@/components/ui/Dialogs';
import { isLang, useI18n, type Lang } from '@/i18n';
import { eggs, previousLang, rememberLang, type EggEvent } from '@/lib/eggs';

/**
 * The hidden languages (never listed in Settings), each with its secret code on a keyboard and its
 * word in a search box (phones). The same code switches back to the language used before. On this
 * device only (like every language choice).
 *   • Lebanese, Arabizi (i18n/lb.ts) — ← → ← → ↑ ↓ ↑ ↓ L B, or « yalla »; a cedar beside the logo.
 *   • Kuwaiti, Arabizi (i18n/kw.ts) — → ← → ← ↓ ↑ ↓ ↑ K W, or « chlonak »; the Kuwait Towers beside the logo.
 */
const HIDDEN: { lang: Lang; event: EggEvent; keys: string[]; hello: string }[] = [
  {
    lang: 'lb',
    event: 'lebanon',
    keys: ['ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'ArrowUp', 'ArrowDown', 'l', 'b'],
    hello: 'Ahla w sahla! 🇱🇧 Yalla, el site sar lebnene.',
  },
  {
    lang: 'kw',
    event: 'kuwait',
    keys: ['ArrowRight', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'ArrowDown', 'ArrowUp', 'k', 'w'],
    hello: 'Hala w ghala! 🇰🇼 Il site 9aar kuwaiti, chlonak?',
  },
];

export function HiddenLanguages() {
  const { lang, setLang } = useI18n();
  const { toast } = useDialogs();

  useEffect(() => {
    const toggle = async (target: (typeof HIDDEN)[number]) => {
      if (lang === target.lang) {
        const back = await previousLang();
        setLang(isLang(back) && !HIDDEN.some((h) => h.lang === back) ? back : 'fr');
        return;
      }
      // From one hidden language to the other: keep the « real » language to come back to.
      if (!HIDDEN.some((h) => h.lang === lang)) rememberLang(lang);
      setLang(target.lang);
      toast(target.hello);
    };
    const offs = HIDDEN.map((h) => eggs.on(h.event, () => void toggle(h)));
    if (Platform.OS !== 'web' || typeof window === 'undefined') return () => offs.forEach((off) => off());
    const pos = HIDDEN.map(() => 0);
    const onKey = (e: KeyboardEvent) => {
      HIDDEN.forEach((h, i) => {
        const want = h.keys[pos[i]];
        pos[i] = e.key === want || e.key.toLowerCase() === want ? pos[i] + 1 : e.key === h.keys[0] ? 1 : 0;
        if (pos[i] === h.keys.length) {
          pos[i] = 0;
          void toggle(h);
        }
      });
    };
    window.addEventListener('keydown', onKey);
    return () => {
      offs.forEach((off) => off());
      window.removeEventListener('keydown', onKey);
    };
  }, [lang, setLang, toast]);

  return null;
}
