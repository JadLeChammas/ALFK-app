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

export const countryName = (code: string | undefined, lang: 'fr' | 'en') => {
  const c = countryByCode(code);
  return c ? c[lang] : code ?? '';
};

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
