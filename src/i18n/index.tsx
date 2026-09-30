import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import en from './en';
import fr, { type Dict } from './fr';

export const LANGUAGES = [
  { code: 'fr', label: 'Français', country: 'FR' },
  { code: 'en', label: 'English', country: 'GB' },
] as const;
export type Lang = (typeof LANGUAGES)[number]['code'];

const dicts: Record<Lang, Dict> = { fr, en };
const STORAGE_KEY = 'lfk.lang';

type Vars = Record<string, string | number>;

type I18nValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  d: Dict;
  /** Interpolates `{key}` placeholders. */
  f: (template: string, vars?: Vars) => string;
  formatDate: (iso: string | Date, opts?: { weekday?: boolean; time?: boolean; year?: boolean }) => string;
  formatTime: (iso: string | Date) => string;
  relative: (iso: string) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('fr');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (v === 'fr' || v === 'en') setLangState(v);
      })
      .catch(() => {});
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    AsyncStorage.setItem(STORAGE_KEY, l).catch(() => {});
  }, []);

  const value = useMemo<I18nValue>(() => {
    const d = dicts[lang];
    const f = (template: string, vars?: Vars) =>
      vars ? template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`)) : template;
    const pad = (n: number) => String(n).padStart(2, '0');
    const formatTime = (v: string | Date) => {
      const date = new Date(v);
      return lang === 'en'
        ? date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        : `${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };
    const formatDate: I18nValue['formatDate'] = (v, opts = {}) => {
      const date = new Date(v);
      const { weekday = false, time = false, year = true } = opts;
      const day = date.getDate();
      const month = d.months[date.getMonth()];
      let s = lang === 'en' ? `${month} ${day}` : `${day} ${month}`;
      if (year) s += lang === 'en' ? `, ${date.getFullYear()}` : ` ${date.getFullYear()}`;
      if (weekday) s = `${d.days[date.getDay()]}${lang === 'en' ? ',' : ''} ${s}`;
      if (time) s += ` · ${formatTime(date)}`;
      return s;
    };
    const relative = (v: string) => {
      const date = new Date(v);
      const now = new Date();
      const diffMin = Math.round((now.getTime() - date.getTime()) / 60000);
      const sameDay = date.toDateString() === now.toDateString();
      if (sameDay) {
        if (diffMin < 1) return lang === 'fr' ? "à l'instant" : 'just now';
        if (diffMin < 60) return lang === 'fr' ? `il y a ${diffMin} min` : `${diffMin} min ago`;
        return formatTime(date);
      }
      const y = new Date(now);
      y.setDate(now.getDate() - 1);
      if (date.toDateString() === y.toDateString()) return d.common.yesterday;
      const days = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
      if (days < 7) return d.days[date.getDay()].slice(0, 3) + '.';
      return formatDate(date, { year: date.getFullYear() !== now.getFullYear() });
    };
    return { lang, setLang, d, f, formatDate, formatTime, relative };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
