import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform, useColorScheme } from 'react-native';

import { futurePalette, FUTURE_NEON, palettes, retroFonts, retroPalette, type ColorScheme, type Colors } from './tokens';

export type ThemePreference = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  scheme: ColorScheme;
  colors: Colors;
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
  /** Hidden 2000s mode (Comic Sans, flashy colours, visit counter). */
  retro: boolean;
  setRetro: (on: boolean) => void;
  /** Hidden futuristic mode « ALFK 2077 » (neon colours and fonts); off when retro is on, and back. */
  future: boolean;
  setFuture: (on: boolean) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = 'lfk.theme';
const RETRO_KEY = 'lfk.retro';
const FUTURE_KEY = 'lfk.future';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [retro, setRetroState] = useState(false);
  const [future, setFutureState] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (v === 'light' || v === 'dark' || v === 'system') setPreferenceState(v);
      })
      .catch(() => {});
    AsyncStorage.getItem(RETRO_KEY)
      .then((v) => setRetroState(v === '1'))
      .catch(() => {});
    AsyncStorage.getItem(FUTURE_KEY)
      .then((v) => setFutureState(v === '1'))
      .catch(() => {});
  }, []);

  const chosen: ColorScheme = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
  const scheme: ColorScheme = retro ? 'light' : future ? 'dark' : chosen;
  const colors = retro ? retroPalette : future ? futurePalette : palettes[scheme];

  // Web: Comic Sans everywhere (the native side switches fonts in <Txt>).
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const id = 'lfk-retro-css';
    document.getElementById(id)?.remove();
    if (!retro) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `*:not(svg):not(svg *):not([style*="font-family: feather"]):not([style*="font-family: ionicons"]):not([style*="font-family: material"]):not([style*="font-family: FontAwesome"]) { font-family: '${retroFonts.regular}', 'Comic Sans MS', 'Comic Neue', cursive !important; letter-spacing: 0 !important; }
      [style*="font-weight: 700"], [style*="font-weight:700"] { font-family: '${retroFonts.bold}', 'Comic Sans MS', cursive !important; }
      html { cursor: crosshair; }`;
    document.head.appendChild(style);
  }, [retro]);

  // Web: the futuristic fonts (Orbitron for titles and bold text, Exo 2 for the rest) and a neon glow.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const id = 'lfk-future-css';
    document.getElementById(id)?.remove();
    document.getElementById(`${id}-fonts`)?.remove();
    if (!future) return;
    const fonts = document.createElement('link');
    fonts.id = `${id}-fonts`;
    fonts.rel = 'stylesheet';
    fonts.href = 'https://fonts.googleapis.com/css2?family=Exo+2:wght@400;500;600&family=Orbitron:wght@500;700;800&display=swap';
    document.head.appendChild(fonts);
    const style = document.createElement('style');
    style.id = id;
    const icons = ':not(svg):not(svg *):not([style*="font-family: feather"]):not([style*="font-family: ionicons"]):not([style*="font-family: material"]):not([style*="font-family: FontAwesome"])';
    style.textContent = `*${icons} { font-family: 'Exo 2', system-ui, sans-serif !important; }
      [style*="font-weight: 600"]${icons}, [style*="font-weight: 700"]${icons}, [style*="font-weight: 800"]${icons}, [style*="Instrument"]${icons}, [style*="BebasNeue"]${icons} { font-family: 'Orbitron', 'Exo 2', sans-serif !important; letter-spacing: 0.04em !important; text-shadow: 0 0 10px ${FUTURE_NEON}55; }
      ::selection { background: ${FUTURE_NEON}; color: #001018; }
      * { scrollbar-color: ${FUTURE_NEON}66 transparent; }`;
    document.head.appendChild(style);
  }, [future]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    document.documentElement.style.colorScheme = scheme;
    document.body.style.backgroundColor = colors.bg;
  }, [scheme, colors.bg]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      scheme,
      colors,
      preference,
      setPreference: (p) => {
        setPreferenceState(p);
        AsyncStorage.setItem(STORAGE_KEY, p).catch(() => {});
      },
      retro,
      setRetro: (on) => {
        setRetroState(on);
        AsyncStorage.setItem(RETRO_KEY, on ? '1' : '0').catch(() => {});
        if (on) {
          setFutureState(false);
          AsyncStorage.setItem(FUTURE_KEY, '0').catch(() => {});
        }
      },
      future,
      setFuture: (on) => {
        setFutureState(on);
        AsyncStorage.setItem(FUTURE_KEY, on ? '1' : '0').catch(() => {});
        if (on) {
          setRetroState(false);
          AsyncStorage.setItem(RETRO_KEY, '0').catch(() => {});
        }
      },
    }),
    [scheme, colors, preference, retro, future]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
