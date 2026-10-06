import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { I18nManager, Platform } from 'react-native';

import { countryLabel } from '@/data/countries';
import ar from './ar';
import de from './de';
import en from './en';
import eo from './eo';
import es from './es';
import fr, { type Dict } from './fr';
import it from './it';
import ja from './ja';
import kwDict from './kw';
import lbDict from './lb';
import la from './la';
import nl from './nl';
import pirate from './pirate';
import pt from './pt';
import ru from './ru';
import zh from './zh';

/**
 * `country` = the flag shown in Settings (`EO`: the Esperanto flag). `locale` = used for dates and numbers.
 * `ownDates`: browsers have no month or day names for it — the dictionary's are used instead.
 */
export const LANGUAGES = [
  { code: 'fr', label: 'Français', country: 'FR', locale: 'fr-FR' },
  { code: 'en', label: 'English', country: 'GB', locale: 'en-US' },
  { code: 'de', label: 'Deutsch', country: 'DE', locale: 'de-DE' },
  { code: 'es', label: 'Español', country: 'ES', locale: 'es-ES' },
  { code: 'it', label: 'Italiano', country: 'IT', locale: 'it-IT' },
  { code: 'pt', label: 'Português', country: 'PT', locale: 'pt-PT' },
  { code: 'nl', label: 'Nederlands', country: 'NL', locale: 'nl-NL' },
  { code: 'ru', label: 'Русский', country: 'RU', locale: 'ru-RU' },
  { code: 'ar', label: 'العربية', country: 'SA', locale: 'ar-u-nu-latn' },
  { code: 'ja', label: '日本語', country: 'JP', locale: 'ja-JP' },
  { code: 'zh', label: '中文', country: 'CN', locale: 'zh-CN' },
  // Latin (the Holy See's language: its flag) and Esperanto.
  { code: 'la', label: 'Latina', country: 'VA', locale: 'it-IT', ownDates: true },
  { code: 'eo', label: 'Esperanto', country: 'EO', locale: 'fr-FR', ownDates: true },
  // Hidden: Lebanese in Arabizi, never listed in Settings: only ← → ← → ↑ ↓ ↑ ↓ L B (components/LebaneseMode.tsx).
  { code: 'lb', label: 'Lebnene', country: 'LB', locale: 'fr-FR', ownDates: true, hidden: true },
  // Hidden: Kuwaiti in Arabizi (→ ← → ← ↓ ↑ ↓ ↑ K W, components/HiddenLanguages.tsx).
  { code: 'kw', label: 'Kuwaiti', country: 'KW', locale: 'en-GB', ownDates: true, hidden: true },
  // For fun: English as spoken aboard. `PIRATE` shows the Jolly Roger instead of a country flag.
  { code: 'pirate', label: 'Pirate', country: 'PIRATE', locale: 'en-GB' },
] as const;
export type Lang = (typeof LANGUAGES)[number]['code'];

const dicts: Record<Lang, Dict> = { fr, en, de, es, it, pt, nl, ru, ar, ja, zh, la, eo, lb: lbDict, kw: kwDict, pirate };

/** The languages offered in Settings: never the hidden ones (only their secret code switches them). */
export const visibleLanguages = () => LANGUAGES.filter((l) => !('hidden' in l));
export const isLang = (v: string | null): v is Lang => !!v && v in dicts;
export const isRtl = (l: Lang) => l === 'ar';

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
  formatNumber: (n: number) => string;
  relative: (iso: string) => string;
  /** Country name in the current language from its ISO code. */
  country: (code?: string) => string;
  rtl: boolean;
};

const I18nContext = createContext<I18nValue | null>(null);

/** Sets the page language and reading direction (Arabic reads right to left). */
function applyDocumentLanguage(lang: Lang) {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    document.documentElement.lang = lang === 'pirate' ? 'en' : lang === 'lb' ? 'apc' : lang === 'kw' ? 'afb' : lang;
    document.documentElement.dir = isRtl(lang) ? 'rtl' : 'ltr';
  } else if (I18nManager.isRTL !== isRtl(lang)) {
    // Native apps switch direction on the next launch.
    I18nManager.allowRTL(isRtl(lang));
    I18nManager.forceRTL(isRtl(lang));
  }
}

const capitalize = (s: string) => (s ? s.charAt(0).toLocaleUpperCase() + s.slice(1) : s);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('fr');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (isLang(v)) setLangState(v);
      })
      .catch(() => {});
  }, []);

  useEffect(() => applyDocumentLanguage(lang), [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    AsyncStorage.setItem(STORAGE_KEY, l).catch(() => {});
  }, []);

  const value = useMemo<I18nValue>(() => {
    const d = dicts[lang];
    const entry = LANGUAGES.find((l) => l.code === lang)!;
    const locale = entry.locale;
    const ownDates = 'ownDates' in entry && entry.ownDates;
    const f = (template: string, vars?: Vars) =>
      vars ? template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`)) : template;
    const pad = (n: number) => String(n).padStart(2, '0');

    const formatTime = (v: string | Date) => {
      const date = new Date(v);
      try {
        return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
      } catch {
        return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
      }
    };
    const formatDate: I18nValue['formatDate'] = (v, opts = {}) => {
      const date = new Date(v);
      const { weekday = false, time = false, year = true } = opts;
      let s: string;
      try {
        if (ownDates) throw new Error('own month names');
        s = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', ...(year ? { year: 'numeric' } : {}), ...(weekday ? { weekday: 'long' } : {}) }).format(date);
      } catch {
        s = `${date.getDate()} ${d.months[date.getMonth()]}${year ? ` ${date.getFullYear()}` : ''}`;
        if (weekday) s = `${d.days[date.getDay()]} ${s}`;
      }
      s = capitalize(s);
      if (time) s += ` · ${formatTime(date)}`;
      return s;
    };
    const formatNumber = (n: number) => {
      try {
        return new Intl.NumberFormat(locale).format(n);
      } catch {
        return String(n);
      }
    };
    const relative = (v: string) => {
      const date = new Date(v);
      const now = new Date();
      const diffMin = Math.round((now.getTime() - date.getTime()) / 60000);
      if (date.toDateString() === now.toDateString()) {
        if (diffMin < 1) return d.time.justNow;
        if (diffMin < 60) return f(d.time.minutesAgo, { n: diffMin });
        return formatTime(date);
      }
      const y = new Date(now);
      y.setDate(now.getDate() - 1);
      if (date.toDateString() === y.toDateString()) return d.common.yesterday;
      const days = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
      if (days < 7) {
        try {
          if (ownDates) throw new Error('own day names');
          return capitalize(new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date));
        } catch {
          return d.days[date.getDay()];
        }
      }
      return formatDate(date, { year: date.getFullYear() !== now.getFullYear() });
    };
    const country = (code?: string) => countryLabel(code, lang);
    return { lang, setLang, d, f, formatDate, formatTime, formatNumber, relative, country, rtl: isRtl(lang) };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
