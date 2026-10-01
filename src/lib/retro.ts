import { useRef } from 'react';

import { useDialogs } from '@/components/ui/Dialogs';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

/** Switches the retro mode on or off, with a word about it. */
export function useToggleRetro() {
  const { retro, setRetro } = useTheme();
  const { d } = useI18n();
  const { toast } = useDialogs();
  return (on = !retro) => {
    setRetro(on);
    toast(on ? d.retro.on : d.retro.off);
  };
}

/**
 * The hidden switch of the retro mode: tapping the logo 5 times in a row (within 3 seconds).
 * Returns a handler to call on each tap; `then` runs on ordinary taps (e.g. go home).
 */
export function useRetroTaps(then?: () => void) {
  const toggle = useToggleRetro();
  const taps = useRef<number[]>([]);
  return () => {
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < 3000), now];
    if (taps.current.length >= 5) {
      taps.current = [];
      toggle();
      return;
    }
    then?.();
  };
}

/** ↑ ↑ ↓ ↓ ← → ← → B A on a keyboard. */
export const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
