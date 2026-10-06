import { useEffect } from 'react';
import { Platform } from 'react-native';

import { useDialogs } from '@/components/ui/Dialogs';
import { isLang, useI18n } from '@/i18n';
import { eggs, previousLang, rememberLang } from '@/lib/eggs';

/** ← → ← → ↑ ↓ ↑ ↓ L B on a keyboard. */
export const LEBANESE_CODE = ['ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'ArrowUp', 'ArrowDown', 'l', 'b'];

/**
 * Hidden Lebanese language (Arabizi, i18n/lb.ts), with a cedar beside the logo (ui/Logo.tsx).
 * Switched on — and back to the previous language — by the code above on a keyboard, or by typing
 * « yalla » in a search box (phones). It never shows in the Settings language list.
 */
export function LebaneseMode() {
  const { lang, setLang } = useI18n();
  const { toast } = useDialogs();

  useEffect(() => {
    const toggle = async () => {
      if (lang === 'lb') {
        const back = await previousLang();
        setLang(isLang(back) && back !== 'lb' ? back : 'fr');
        return;
      }
      rememberLang(lang);
      setLang('lb');
      toast('Ahla w sahla! 🇱🇧 Yalla, el site sar lebnene.');
    };
    const offSearch = eggs.on('lebanon', () => void toggle());
    if (Platform.OS !== 'web' || typeof window === 'undefined') return offSearch;
    let pos = 0;
    const onKey = (e: KeyboardEvent) => {
      const want = LEBANESE_CODE[pos];
      pos = e.key === want || e.key.toLowerCase() === want ? pos + 1 : e.key === LEBANESE_CODE[0] ? 1 : 0;
      if (pos === LEBANESE_CODE.length) {
        pos = 0;
        void toggle();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      offSearch();
      window.removeEventListener('keydown', onKey);
    };
  }, [lang, setLang, toast]);

  return null;
}
