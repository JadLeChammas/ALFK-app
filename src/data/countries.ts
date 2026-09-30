import type { ContinentKey } from './types';

export type Country = {
  code: string;
  fr: string;
  en: string;
  flag: string;
  continent: ContinentKey;
  /** Position on the 60×22 dot map (see WorldDots). */
  pin: [number, number];
};

export const COUNTRIES: Country[] = [
  { code: 'FR', fr: 'France', en: 'France', flag: '🇫🇷', continent: 'europe', pin: [30, 5] },
  { code: 'GB', fr: 'Royaume-Uni', en: 'United Kingdom', flag: '🇬🇧', continent: 'europe', pin: [29, 4] },
  { code: 'BE', fr: 'Belgique', en: 'Belgium', flag: '🇧🇪', continent: 'europe', pin: [31, 4] },
  { code: 'CH', fr: 'Suisse', en: 'Switzerland', flag: '🇨🇭', continent: 'europe', pin: [31, 5] },
  { code: 'ES', fr: 'Espagne', en: 'Spain', flag: '🇪🇸', continent: 'europe', pin: [29, 6] },
  { code: 'KW', fr: 'Koweït', en: 'Kuwait', flag: '🇰🇼', continent: 'asia', pin: [38, 8] },
  { code: 'LB', fr: 'Liban', en: 'Lebanon', flag: '🇱🇧', continent: 'asia', pin: [35, 7] },
  { code: 'AE', fr: 'Émirats arabes unis', en: 'United Arab Emirates', flag: '🇦🇪', continent: 'asia', pin: [39, 9] },
  { code: 'JP', fr: 'Japon', en: 'Japan', flag: '🇯🇵', continent: 'asia', pin: [53, 6] },
  { code: 'CA', fr: 'Canada', en: 'Canada', flag: '🇨🇦', continent: 'north_america', pin: [17, 5] },
  { code: 'US', fr: 'États-Unis', en: 'United States', flag: '🇺🇸', continent: 'north_america', pin: [16, 6] },
  { code: 'BR', fr: 'Brésil', en: 'Brazil', flag: '🇧🇷', continent: 'south_america', pin: [22, 16] },
  { code: 'EG', fr: 'Égypte', en: 'Egypt', flag: '🇪🇬', continent: 'africa', pin: [35, 8] },
  { code: 'MA', fr: 'Maroc', en: 'Morocco', flag: '🇲🇦', continent: 'africa', pin: [28, 7] },
  { code: 'AU', fr: 'Australie', en: 'Australia', flag: '🇦🇺', continent: 'oceania', pin: [55, 18] },
];

export const CONTINENTS: ContinentKey[] = ['europe', 'asia', 'north_america', 'africa', 'south_america', 'oceania'];

export const countryByCode = (code?: string) => COUNTRIES.find((c) => c.code === code);

/** Country names in the other app languages (French and English live on COUNTRIES). */
const NAMES: Record<string, Record<'de' | 'es' | 'it' | 'pt' | 'ar' | 'ja' | 'zh', string>> = {
  FR: { de: 'Frankreich', es: 'Francia', it: 'Francia', pt: 'França', ar: 'فرنسا', ja: 'フランス', zh: '法国' },
  GB: { de: 'Vereinigtes Königreich', es: 'Reino Unido', it: 'Regno Unito', pt: 'Reino Unido', ar: 'المملكة المتحدة', ja: 'イギリス', zh: '英国' },
  BE: { de: 'Belgien', es: 'Bélgica', it: 'Belgio', pt: 'Bélgica', ar: 'بلجيكا', ja: 'ベルギー', zh: '比利时' },
  CH: { de: 'Schweiz', es: 'Suiza', it: 'Svizzera', pt: 'Suíça', ar: 'سويسرا', ja: 'スイス', zh: '瑞士' },
  ES: { de: 'Spanien', es: 'España', it: 'Spagna', pt: 'Espanha', ar: 'إسبانيا', ja: 'スペイン', zh: '西班牙' },
  KW: { de: 'Kuwait', es: 'Kuwait', it: 'Kuwait', pt: 'Kuwait', ar: 'الكويت', ja: 'クウェート', zh: '科威特' },
  LB: { de: 'Libanon', es: 'Líbano', it: 'Libano', pt: 'Líbano', ar: 'لبنان', ja: 'レバノン', zh: '黎巴嫩' },
  AE: { de: 'Vereinigte Arabische Emirate', es: 'Emiratos Árabes Unidos', it: 'Emirati Arabi Uniti', pt: 'Emirados Árabes Unidos', ar: 'الإمارات العربية المتحدة', ja: 'アラブ首長国連邦', zh: '阿联酋' },
  JP: { de: 'Japan', es: 'Japón', it: 'Giappone', pt: 'Japão', ar: 'اليابان', ja: '日本', zh: '日本' },
  CA: { de: 'Kanada', es: 'Canadá', it: 'Canada', pt: 'Canadá', ar: 'كندا', ja: 'カナダ', zh: '加拿大' },
  US: { de: 'Vereinigte Staaten', es: 'Estados Unidos', it: 'Stati Uniti', pt: 'Estados Unidos', ar: 'الولايات المتحدة', ja: 'アメリカ合衆国', zh: '美国' },
  BR: { de: 'Brasilien', es: 'Brasil', it: 'Brasile', pt: 'Brasil', ar: 'البرازيل', ja: 'ブラジル', zh: '巴西' },
  EG: { de: 'Ägypten', es: 'Egipto', it: 'Egitto', pt: 'Egito', ar: 'مصر', ja: 'エジプト', zh: '埃及' },
  MA: { de: 'Marokko', es: 'Marruecos', it: 'Marocco', pt: 'Marrocos', ar: 'المغرب', ja: 'モロッコ', zh: '摩洛哥' },
  AU: { de: 'Australien', es: 'Australia', it: 'Australia', pt: 'Austrália', ar: 'أستراليا', ja: 'オーストラリア', zh: '澳大利亚' },
};

/** Country name in any app language; falls back to English, then to the code. */
export function countryLabel(code: string | undefined, lang: string): string {
  const c = countryByCode(code);
  if (!c) return code ?? '';
  if (lang === 'fr') return c.fr;
  if (lang === 'en') return c.en;
  return NAMES[c.code]?.[lang as keyof (typeof NAMES)[string]] ?? c.en;
}

/** Every known name of a country (all languages), for search. */
export const countrySearchText = (code: string) => {
  const c = countryByCode(code);
  return c ? [c.fr, c.en, ...Object.values(NAMES[c.code] ?? {})].join(' ') : code;
};

export const countryName = (code: string | undefined, lang: string) => countryLabel(code, lang);

/** Universities by country — used by the seed and suggested at sign-up. */
export const UNIVERSITIES: Record<string, string[]> = {
  FR: [
    'Paris 1 Panthéon-Sorbonne',
    'Université Paris Cité',
    'INSA Lyon',
    'ESSEC Business School',
    'Sciences Po',
    'École polytechnique',
    'Sorbonne Université',
    'HEC Paris',
    'Aix-Marseille Université',
  ],
  GB: ["King's College London", 'University College London', 'University of Edinburgh'],
  BE: ['Université libre de Bruxelles', 'UCLouvain'],
  CH: ['EPFL', 'Université de Genève'],
  ES: ['IE University'],
  KW: ['Kuwait University', 'American University of Kuwait', 'GUST'],
  LB: ['American University of Beirut', 'Université Saint-Joseph'],
  AE: ['Sorbonne Université Abu Dhabi', 'NYU Abu Dhabi'],
  JP: ['Waseda University'],
  CA: ['McGill University', 'Université de Montréal', 'HEC Montréal'],
  US: ['Columbia University', 'Boston University', 'New York University'],
  BR: ['Universidade de São Paulo'],
  EG: ["Université française d'Égypte"],
  MA: ['Université Mohammed VI Polytechnique'],
  AU: ['University of Sydney'],
};

export const CITY_BY_COUNTRY: Record<string, string[]> = {
  FR: ['Paris', 'Lyon', 'Marseille', 'Lille', 'Bordeaux'],
  GB: ['Londres', 'Édimbourg'],
  BE: ['Bruxelles', 'Louvain-la-Neuve'],
  CH: ['Lausanne', 'Genève'],
  ES: ['Madrid'],
  KW: ['Koweït City', 'Salmiya', 'Hawalli'],
  LB: ['Beyrouth'],
  AE: ['Abu Dhabi', 'Dubaï'],
  JP: ['Tokyo'],
  CA: ['Montréal', 'Toronto'],
  US: ['New York', 'Boston'],
  BR: ['São Paulo'],
  EG: ['Le Caire'],
  MA: ['Ben Guerir', 'Casablanca'],
  AU: ['Sydney'],
};
