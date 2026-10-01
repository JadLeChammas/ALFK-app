import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform, useColorScheme } from 'react-native';

import { palettes, retroFonts, retroPalette, type ColorScheme, type Colors } from './tokens';

export type ThemePreference = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  scheme: ColorScheme;
  colors: Colors;
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
  /** Hidden 2000s mode (Comic Sans, flashy colours, visit counter). */
  retro: boolean;
  setRetro: (on: boolean) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = 'lfk.theme';
const RETRO_KEY = 'lfk.retro';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [retro, setRetroState] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (v === 'light' || v === 'dark' || v === 'system') setPreferenceState(v);
      })
      .catch(() => {});
    AsyncStorage.getItem(RETRO_KEY)
      .then((v) => setRetroState(v === '1'))
      .catch(() => {});
  }, []);

  const chosen: ColorScheme = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
  const scheme: ColorScheme = retro ? 'light' : chosen;
  const colors = retro ? retroPalette : palettes[scheme];

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
      },
    }),
    [scheme, colors, preference, retro]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
