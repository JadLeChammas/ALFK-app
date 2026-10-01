import { useDialogs } from '@/components/ui/Dialogs';
import { isLang, useI18n } from '@/i18n';
import { logoTap, previousLang, rememberLang } from '@/lib/eggs';
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
 * The hidden switches on the logo: 5 taps in a row = retro mode, 7 taps = Pirate language (and back).
 * Returns a handler to call on each tap; `then` runs on the first tap (e.g. go home).
 */
export function useRetroTaps(then?: () => void) {
  const toggle = useToggleRetro();
  const { lang, setLang } = useI18n();
  const { toast } = useDialogs();
  return () =>
    logoTap({
      first: then,
      five: () => toggle(),
      seven: async () => {
        if (lang === 'pirate') {
          const back = await previousLang();
          setLang(isLang(back) && back !== 'pirate' ? back : 'fr');
          return;
        }
        rememberLang(lang);
        setLang('pirate');
        toast('Arrr! All hands on deck! 🏴‍☠️');
      },
    });
}

/** ↑ ↑ ↓ ↓ ← → ← → B A on a keyboard. */
export const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
