import type { ContinentKey } from './types';

export type Country = {
  code: string;
  fr: string;
  en: string;
  flag: string;
  continent: ContinentKey;
  /** Position on the 60×22 dot map (see WorldDots). */
  pin: [number, number];
  /** Latitude / longitude of the main alumni city — used by the globe and the world map. */
  ll: [number, number];
};

/** The Lycée Français de Koweït — origin of every arc on the globe and the map. */
export const LFK_LL: [number, number] = [29.33, 48.0];

export const COUNTRIES: Country[] = [
  { code: 'FR', fr: 'France', en: 'France', flag: '🇫🇷', continent: 'europe', pin: [30, 5], ll: [48.86, 2.35] },
  { code: 'GB', fr: 'Royaume-Uni', en: 'United Kingdom', flag: '🇬🇧', continent: 'europe', pin: [29, 4], ll: [51.51, -0.13] },
  { code: 'BE', fr: 'Belgique', en: 'Belgium', flag: '🇧🇪', continent: 'europe', pin: [31, 4], ll: [50.85, 4.35] },
  { code: 'CH', fr: 'Suisse', en: 'Switzerland', flag: '🇨🇭', continent: 'europe', pin: [31, 5], ll: [46.52, 6.63] },
  { code: 'ES', fr: 'Espagne', en: 'Spain', flag: '🇪🇸', continent: 'europe', pin: [29, 6], ll: [40.42, -3.7] },
  { code: 'KW', fr: 'Koweït', en: 'Kuwait', flag: '🇰🇼', continent: 'asia', pin: [38, 8], ll: [29.37, 47.98] },
  { code: 'LB', fr: 'Liban', en: 'Lebanon', flag: '🇱🇧', continent: 'asia', pin: [35, 7], ll: [33.89, 35.5] },
  { code: 'AE', fr: 'Émirats arabes unis', en: 'United Arab Emirates', flag: '🇦🇪', continent: 'asia', pin: [39, 9], ll: [24.45, 54.38] },
  { code: 'JP', fr: 'Japon', en: 'Japan', flag: '🇯🇵', continent: 'asia', pin: [53, 6], ll: [35.68, 139.69] },
  { code: 'CA', fr: 'Canada', en: 'Canada', flag: '🇨🇦', continent: 'north_america', pin: [17, 5], ll: [45.5, -73.57] },
  { code: 'US', fr: 'États-Unis', en: 'United States', flag: '🇺🇸', continent: 'north_america', pin: [16, 6], ll: [40.71, -74.01] },
  { code: 'BR', fr: 'Brésil', en: 'Brazil', flag: '🇧🇷', continent: 'south_america', pin: [22, 16], ll: [-23.55, -46.63] },
  { code: 'EG', fr: 'Égypte', en: 'Egypt', flag: '🇪🇬', continent: 'africa', pin: [35, 8], ll: [30.04, 31.24] },
  { code: 'MA', fr: 'Maroc', en: 'Morocco', flag: '🇲🇦', continent: 'africa', pin: [28, 7], ll: [33.57, -7.59] },
  { code: 'AU', fr: 'Australie', en: 'Australia', flag: '🇦🇺', continent: 'oceania', pin: [55, 18], ll: [-33.87, 151.21] },
  // ——— Every other country (capital city on the globe and the map) ———
  { code: 'AF', fr: 'Afghanistan', en: 'Afghanistan', flag: '', continent: 'asia', pin: [0, 0], ll: [34.53, 69.17] },
  { code: 'ZA', fr: 'Afrique du Sud', en: 'South Africa', flag: '', continent: 'africa', pin: [0, 0], ll: [-25.75, 28.19] },
  { code: 'AL', fr: 'Albanie', en: 'Albania', flag: '', continent: 'europe', pin: [0, 0], ll: [41.33, 19.82] },
  { code: 'DZ', fr: 'Algérie', en: 'Algeria', flag: '', continent: 'africa', pin: [0, 0], ll: [36.75, 3.06] },
  { code: 'DE', fr: 'Allemagne', en: 'Germany', flag: '', continent: 'europe', pin: [0, 0], ll: [52.52, 13.4] },
  { code: 'AD', fr: 'Andorre', en: 'Andorra', flag: '', continent: 'europe', pin: [0, 0], ll: [42.51, 1.52] },
  { code: 'AO', fr: 'Angola', en: 'Angola', flag: '', continent: 'africa', pin: [0, 0], ll: [-8.84, 13.23] },
  { code: 'AG', fr: 'Antigua-et-Barbuda', en: 'Antigua and Barbuda', flag: '', continent: 'north_america', pin: [0, 0], ll: [17.12, -61.85] },
  { code: 'SA', fr: 'Arabie saoudite', en: 'Saudi Arabia', flag: '', continent: 'asia', pin: [0, 0], ll: [24.71, 46.68] },
  { code: 'AR', fr: 'Argentine', en: 'Argentina', flag: '', continent: 'south_america', pin: [0, 0], ll: [-34.6, -58.38] },
  { code: 'AM', fr: 'Arménie', en: 'Armenia', flag: '', continent: 'asia', pin: [0, 0], ll: [40.18, 44.51] },
  { code: 'AT', fr: 'Autriche', en: 'Austria', flag: '', continent: 'europe', pin: [0, 0], ll: [48.21, 16.37] },
  { code: 'AZ', fr: 'Azerbaïdjan', en: 'Azerbaijan', flag: '', continent: 'asia', pin: [0, 0], ll: [40.41, 49.87] },
  { code: 'BS', fr: 'Bahamas', en: 'Bahamas', flag: '', continent: 'north_america', pin: [0, 0], ll: [25.05, -77.36] },
  { code: 'BH', fr: 'Bahreïn', en: 'Bahrain', flag: '', continent: 'asia', pin: [0, 0], ll: [26.23, 50.59] },
  { code: 'BD', fr: 'Bangladesh', en: 'Bangladesh', flag: '', continent: 'asia', pin: [0, 0], ll: [23.81, 90.41] },
  { code: 'BB', fr: 'Barbade', en: 'Barbados', flag: '', continent: 'north_america', pin: [0, 0], ll: [13.1, -59.62] },
  { code: 'BZ', fr: 'Belize', en: 'Belize', flag: '', continent: 'north_america', pin: [0, 0], ll: [17.25, -88.76] },
  { code: 'BJ', fr: 'Bénin', en: 'Benin', flag: '', continent: 'africa', pin: [0, 0], ll: [6.5, 2.6] },
  { code: 'BT', fr: 'Bhoutan', en: 'Bhutan', flag: '', continent: 'asia', pin: [0, 0], ll: [27.47, 89.64] },
  { code: 'BY', fr: 'Biélorussie', en: 'Belarus', flag: '', continent: 'europe', pin: [0, 0], ll: [53.9, 27.56] },
  { code: 'MM', fr: 'Birmanie', en: 'Myanmar', flag: '', continent: 'asia', pin: [0, 0], ll: [19.76, 96.08] },
  { code: 'BO', fr: 'Bolivie', en: 'Bolivia', flag: '', continent: 'south_america', pin: [0, 0], ll: [-16.5, -68.15] },
  { code: 'BA', fr: 'Bosnie-Herzégovine', en: 'Bosnia and Herzegovina', flag: '', continent: 'europe', pin: [0, 0], ll: [43.86, 18.41] },
  { code: 'BW', fr: 'Botswana', en: 'Botswana', flag: '', continent: 'africa', pin: [0, 0], ll: [-24.65, 25.91] },
  { code: 'BN', fr: 'Brunei', en: 'Brunei', flag: '', continent: 'asia', pin: [0, 0], ll: [4.9, 114.94] },
  { code: 'BG', fr: 'Bulgarie', en: 'Bulgaria', flag: '', continent: 'europe', pin: [0, 0], ll: [42.7, 23.32] },
  { code: 'BF', fr: 'Burkina Faso', en: 'Burkina Faso', flag: '', continent: 'africa', pin: [0, 0], ll: [12.37, -1.52] },
  { code: 'BI', fr: 'Burundi', en: 'Burundi', flag: '', continent: 'africa', pin: [0, 0], ll: [-3.38, 29.36] },
  { code: 'KH', fr: 'Cambodge', en: 'Cambodia', flag: '', continent: 'asia', pin: [0, 0], ll: [11.56, 104.93] },
  { code: 'CM', fr: 'Cameroun', en: 'Cameroon', flag: '', continent: 'africa', pin: [0, 0], ll: [3.85, 11.5] },
  { code: 'CV', fr: 'Cap-Vert', en: 'Cape Verde', flag: '', continent: 'africa', pin: [0, 0], ll: [14.93, -23.51] },
  { code: 'CF', fr: 'Centrafrique', en: 'Central African Republic', flag: '', continent: 'africa', pin: [0, 0], ll: [4.39, 18.56] },
  { code: 'CL', fr: 'Chili', en: 'Chile', flag: '', continent: 'south_america', pin: [0, 0], ll: [-33.45, -70.67] },
  { code: 'CN', fr: 'Chine', en: 'China', flag: '', continent: 'asia', pin: [0, 0], ll: [39.9, 116.4] },
  { code: 'CY', fr: 'Chypre', en: 'Cyprus', flag: '', continent: 'europe', pin: [0, 0], ll: [35.19, 33.38] },
  { code: 'CO', fr: 'Colombie', en: 'Colombia', flag: '', continent: 'south_america', pin: [0, 0], ll: [4.71, -74.07] },
  { code: 'KM', fr: 'Comores', en: 'Comoros', flag: '', continent: 'africa', pin: [0, 0], ll: [-11.7, 43.26] },
  { code: 'CG', fr: 'Congo', en: 'Congo', flag: '', continent: 'africa', pin: [0, 0], ll: [-4.27, 15.28] },
  { code: 'CD', fr: 'Congo (RDC)', en: 'DR Congo', flag: '', continent: 'africa', pin: [0, 0], ll: [-4.44, 15.27] },
  { code: 'KR', fr: 'Corée du Sud', en: 'South Korea', flag: '', continent: 'asia', pin: [0, 0], ll: [37.57, 126.98] },
  { code: 'KP', fr: 'Corée du Nord', en: 'North Korea', flag: '', continent: 'asia', pin: [0, 0], ll: [39.04, 125.76] },
  { code: 'CR', fr: 'Costa Rica', en: 'Costa Rica', flag: '', continent: 'north_america', pin: [0, 0], ll: [9.93, -84.08] },
  { code: 'CI', fr: 'Côte d’Ivoire', en: 'Côte d’Ivoire', flag: '', continent: 'africa', pin: [0, 0], ll: [5.36, -4.01] },
  { code: 'HR', fr: 'Croatie', en: 'Croatia', flag: '', continent: 'europe', pin: [0, 0], ll: [45.81, 15.98] },
  { code: 'CU', fr: 'Cuba', en: 'Cuba', flag: '', continent: 'north_america', pin: [0, 0], ll: [23.11, -82.37] },
  { code: 'DK', fr: 'Danemark', en: 'Denmark', flag: '', continent: 'europe', pin: [0, 0], ll: [55.68, 12.57] },
  { code: 'DJ', fr: 'Djibouti', en: 'Djibouti', flag: '', continent: 'africa', pin: [0, 0], ll: [11.59, 43.15] },
  { code: 'DM', fr: 'Dominique', en: 'Dominica', flag: '', continent: 'north_america', pin: [0, 0], ll: [15.3, -61.39] },
  { code: 'EC', fr: 'Équateur', en: 'Ecuador', flag: '', continent: 'south_america', pin: [0, 0], ll: [-0.18, -78.47] },
  { code: 'ER', fr: 'Érythrée', en: 'Eritrea', flag: '', continent: 'africa', pin: [0, 0], ll: [15.32, 38.93] },
  { code: 'EE', fr: 'Estonie', en: 'Estonia', flag: '', continent: 'europe', pin: [0, 0], ll: [59.44, 24.75] },
  { code: 'SZ', fr: 'Eswatini', en: 'Eswatini', flag: '', continent: 'africa', pin: [0, 0], ll: [-26.31, 31.14] },
  { code: 'ET', fr: 'Éthiopie', en: 'Ethiopia', flag: '', continent: 'africa', pin: [0, 0], ll: [9.03, 38.74] },
  { code: 'FJ', fr: 'Fidji', en: 'Fiji', flag: '', continent: 'oceania', pin: [0, 0], ll: [-18.14, 178.44] },
  { code: 'FI', fr: 'Finlande', en: 'Finland', flag: '', continent: 'europe', pin: [0, 0], ll: [60.17, 24.94] },
  { code: 'GA', fr: 'Gabon', en: 'Gabon', flag: '', continent: 'africa', pin: [0, 0], ll: [0.42, 9.47] },
  { code: 'GM', fr: 'Gambie', en: 'Gambia', flag: '', continent: 'africa', pin: [0, 0], ll: [13.45, -16.58] },
  { code: 'GE', fr: 'Géorgie', en: 'Georgia', flag: '', continent: 'asia', pin: [0, 0], ll: [41.72, 44.79] },
  { code: 'GH', fr: 'Ghana', en: 'Ghana', flag: '', continent: 'africa', pin: [0, 0], ll: [5.6, -0.19] },
  { code: 'GR', fr: 'Grèce', en: 'Greece', flag: '', continent: 'europe', pin: [0, 0], ll: [37.98, 23.73] },
  { code: 'GD', fr: 'Grenade', en: 'Grenada', flag: '', continent: 'north_america', pin: [0, 0], ll: [12.06, -61.75] },
  { code: 'GT', fr: 'Guatemala', en: 'Guatemala', flag: '', continent: 'north_america', pin: [0, 0], ll: [14.63, -90.51] },
  { code: 'GN', fr: 'Guinée', en: 'Guinea', flag: '', continent: 'africa', pin: [0, 0], ll: [9.64, -13.58] },
  { code: 'GQ', fr: 'Guinée équatoriale', en: 'Equatorial Guinea', flag: '', continent: 'africa', pin: [0, 0], ll: [3.75, 8.78] },
  { code: 'GW', fr: 'Guinée-Bissau', en: 'Guinea-Bissau', flag: '', continent: 'africa', pin: [0, 0], ll: [11.86, -15.6] },
  { code: 'GY', fr: 'Guyana', en: 'Guyana', flag: '', continent: 'south_america', pin: [0, 0], ll: [6.8, -58.16] },
  { code: 'HT', fr: 'Haïti', en: 'Haiti', flag: '', continent: 'north_america', pin: [0, 0], ll: [18.59, -72.31] },
  { code: 'HN', fr: 'Honduras', en: 'Honduras', flag: '', continent: 'north_america', pin: [0, 0], ll: [14.07, -87.19] },
  { code: 'HU', fr: 'Hongrie', en: 'Hungary', flag: '', continent: 'europe', pin: [0, 0], ll: [47.5, 19.04] },
  { code: 'IN', fr: 'Inde', en: 'India', flag: '', continent: 'asia', pin: [0, 0], ll: [28.61, 77.21] },
  { code: 'ID', fr: 'Indonésie', en: 'Indonesia', flag: '', continent: 'asia', pin: [0, 0], ll: [-6.21, 106.85] },
  { code: 'IQ', fr: 'Irak', en: 'Iraq', flag: '', continent: 'asia', pin: [0, 0], ll: [33.31, 44.36] },
  { code: 'IR', fr: 'Iran', en: 'Iran', flag: '', continent: 'asia', pin: [0, 0], ll: [35.69, 51.39] },
  { code: 'IE', fr: 'Irlande', en: 'Ireland', flag: '', continent: 'europe', pin: [0, 0], ll: [53.35, -6.26] },
  { code: 'IS', fr: 'Islande', en: 'Iceland', flag: '', continent: 'europe', pin: [0, 0], ll: [64.15, -21.94] },
  { code: 'IL', fr: 'Israël', en: 'Israel', flag: '', continent: 'asia', pin: [0, 0], ll: [31.77, 35.21] },
  { code: 'IT', fr: 'Italie', en: 'Italy', flag: '', continent: 'europe', pin: [0, 0], ll: [41.9, 12.5] },
  { code: 'JM', fr: 'Jamaïque', en: 'Jamaica', flag: '', continent: 'north_america', pin: [0, 0], ll: [18.02, -76.8] },
  { code: 'JO', fr: 'Jordanie', en: 'Jordan', flag: '', continent: 'asia', pin: [0, 0], ll: [31.95, 35.93] },
  { code: 'KZ', fr: 'Kazakhstan', en: 'Kazakhstan', flag: '', continent: 'asia', pin: [0, 0], ll: [51.17, 71.45] },
  { code: 'KE', fr: 'Kenya', en: 'Kenya', flag: '', continent: 'africa', pin: [0, 0], ll: [-1.29, 36.82] },
  { code: 'KG', fr: 'Kirghizistan', en: 'Kyrgyzstan', flag: '', continent: 'asia', pin: [0, 0], ll: [42.87, 74.59] },
  { code: 'KI', fr: 'Kiribati', en: 'Kiribati', flag: '', continent: 'oceania', pin: [0, 0], ll: [1.45, 172.98] },
  { code: 'XK', fr: 'Kosovo', en: 'Kosovo', flag: '', continent: 'europe', pin: [0, 0], ll: [42.66, 21.17] },
  { code: 'LA', fr: 'Laos', en: 'Laos', flag: '', continent: 'asia', pin: [0, 0], ll: [17.98, 102.63] },
  { code: 'LS', fr: 'Lesotho', en: 'Lesotho', flag: '', continent: 'africa', pin: [0, 0], ll: [-29.31, 27.48] },
  { code: 'LV', fr: 'Lettonie', en: 'Latvia', flag: '', continent: 'europe', pin: [0, 0], ll: [56.95, 24.11] },
  { code: 'LR', fr: 'Liberia', en: 'Liberia', flag: '', continent: 'africa', pin: [0, 0], ll: [6.3, -10.8] },
  { code: 'LY', fr: 'Libye', en: 'Libya', flag: '', continent: 'africa', pin: [0, 0], ll: [32.89, 13.19] },
  { code: 'LI', fr: 'Liechtenstein', en: 'Liechtenstein', flag: '', continent: 'europe', pin: [0, 0], ll: [47.14, 9.52] },
  { code: 'LT', fr: 'Lituanie', en: 'Lithuania', flag: '', continent: 'europe', pin: [0, 0], ll: [54.69, 25.28] },
  { code: 'LU', fr: 'Luxembourg', en: 'Luxembourg', flag: '', continent: 'europe', pin: [0, 0], ll: [49.61, 6.13] },
  { code: 'MK', fr: 'Macédoine du Nord', en: 'North Macedonia', flag: '', continent: 'europe', pin: [0, 0], ll: [42.0, 21.43] },
  { code: 'MG', fr: 'Madagascar', en: 'Madagascar', flag: '', continent: 'africa', pin: [0, 0], ll: [-18.88, 47.51] },
  { code: 'MY', fr: 'Malaisie', en: 'Malaysia', flag: '', continent: 'asia', pin: [0, 0], ll: [3.14, 101.69] },
  { code: 'MW', fr: 'Malawi', en: 'Malawi', flag: '', continent: 'africa', pin: [0, 0], ll: [-13.96, 33.79] },
  { code: 'MV', fr: 'Maldives', en: 'Maldives', flag: '', continent: 'asia', pin: [0, 0], ll: [4.18, 73.51] },
  { code: 'ML', fr: 'Mali', en: 'Mali', flag: '', continent: 'africa', pin: [0, 0], ll: [12.64, -8.0] },
  { code: 'MT', fr: 'Malte', en: 'Malta', flag: '', continent: 'europe', pin: [0, 0], ll: [35.9, 14.51] },
  { code: 'MH', fr: 'Îles Marshall', en: 'Marshall Islands', flag: '', continent: 'oceania', pin: [0, 0], ll: [7.09, 171.38] },
  { code: 'MU', fr: 'Maurice', en: 'Mauritius', flag: '', continent: 'africa', pin: [0, 0], ll: [-20.16, 57.5] },
  { code: 'MR', fr: 'Mauritanie', en: 'Mauritania', flag: '', continent: 'africa', pin: [0, 0], ll: [18.08, -15.98] },
  { code: 'MX', fr: 'Mexique', en: 'Mexico', flag: '', continent: 'north_america', pin: [0, 0], ll: [19.43, -99.13] },
  { code: 'FM', fr: 'Micronésie', en: 'Micronesia', flag: '', continent: 'oceania', pin: [0, 0], ll: [6.92, 158.16] },
  { code: 'MD', fr: 'Moldavie', en: 'Moldova', flag: '', continent: 'europe', pin: [0, 0], ll: [47.01, 28.86] },
  { code: 'MC', fr: 'Monaco', en: 'Monaco', flag: '', continent: 'europe', pin: [0, 0], ll: [43.74, 7.42] },
  { code: 'MN', fr: 'Mongolie', en: 'Mongolia', flag: '', continent: 'asia', pin: [0, 0], ll: [47.89, 106.91] },
  { code: 'ME', fr: 'Monténégro', en: 'Montenegro', flag: '', continent: 'europe', pin: [0, 0], ll: [42.44, 19.26] },
  { code: 'MZ', fr: 'Mozambique', en: 'Mozambique', flag: '', continent: 'africa', pin: [0, 0], ll: [-25.97, 32.57] },
  { code: 'NA', fr: 'Namibie', en: 'Namibia', flag: '', continent: 'africa', pin: [0, 0], ll: [-22.56, 17.08] },
  { code: 'NR', fr: 'Nauru', en: 'Nauru', flag: '', continent: 'oceania', pin: [0, 0], ll: [-0.55, 166.92] },
  { code: 'NP', fr: 'Népal', en: 'Nepal', flag: '', continent: 'asia', pin: [0, 0], ll: [27.72, 85.32] },
  { code: 'NI', fr: 'Nicaragua', en: 'Nicaragua', flag: '', continent: 'north_america', pin: [0, 0], ll: [12.11, -86.24] },
  { code: 'NE', fr: 'Niger', en: 'Niger', flag: '', continent: 'africa', pin: [0, 0], ll: [13.51, 2.11] },
  { code: 'NG', fr: 'Nigeria', en: 'Nigeria', flag: '', continent: 'africa', pin: [0, 0], ll: [9.08, 7.4] },
  { code: 'NO', fr: 'Norvège', en: 'Norway', flag: '', continent: 'europe', pin: [0, 0], ll: [59.91, 10.75] },
  { code: 'NZ', fr: 'Nouvelle-Zélande', en: 'New Zealand', flag: '', continent: 'oceania', pin: [0, 0], ll: [-41.29, 174.78] },
  { code: 'OM', fr: 'Oman', en: 'Oman', flag: '', continent: 'asia', pin: [0, 0], ll: [23.59, 58.41] },
  { code: 'UG', fr: 'Ouganda', en: 'Uganda', flag: '', continent: 'africa', pin: [0, 0], ll: [0.35, 32.58] },
  { code: 'UZ', fr: 'Ouzbékistan', en: 'Uzbekistan', flag: '', continent: 'asia', pin: [0, 0], ll: [41.3, 69.24] },
  { code: 'PK', fr: 'Pakistan', en: 'Pakistan', flag: '', continent: 'asia', pin: [0, 0], ll: [33.68, 73.05] },
  { code: 'PW', fr: 'Palaos', en: 'Palau', flag: '', continent: 'oceania', pin: [0, 0], ll: [7.5, 134.62] },
  { code: 'PS', fr: 'Palestine', en: 'Palestine', flag: '', continent: 'asia', pin: [0, 0], ll: [31.9, 35.2] },
  { code: 'PA', fr: 'Panama', en: 'Panama', flag: '', continent: 'north_america', pin: [0, 0], ll: [8.98, -79.52] },
  { code: 'PG', fr: 'Papouasie-Nouvelle-Guinée', en: 'Papua New Guinea', flag: '', continent: 'oceania', pin: [0, 0], ll: [-9.44, 147.18] },
  { code: 'PY', fr: 'Paraguay', en: 'Paraguay', flag: '', continent: 'south_america', pin: [0, 0], ll: [-25.26, -57.58] },
  { code: 'NL', fr: 'Pays-Bas', en: 'Netherlands', flag: '', continent: 'europe', pin: [0, 0], ll: [52.37, 4.9] },
  { code: 'PE', fr: 'Pérou', en: 'Peru', flag: '', continent: 'south_america', pin: [0, 0], ll: [-12.05, -77.04] },
  { code: 'PH', fr: 'Philippines', en: 'Philippines', flag: '', continent: 'asia', pin: [0, 0], ll: [14.6, 120.98] },
  { code: 'PL', fr: 'Pologne', en: 'Poland', flag: '', continent: 'europe', pin: [0, 0], ll: [52.23, 21.01] },
  { code: 'PT', fr: 'Portugal', en: 'Portugal', flag: '', continent: 'europe', pin: [0, 0], ll: [38.72, -9.14] },
  { code: 'QA', fr: 'Qatar', en: 'Qatar', flag: '', continent: 'asia', pin: [0, 0], ll: [25.29, 51.53] },
  { code: 'DO', fr: 'République dominicaine', en: 'Dominican Republic', flag: '', continent: 'north_america', pin: [0, 0], ll: [18.49, -69.93] },
  { code: 'CZ', fr: 'Tchéquie', en: 'Czechia', flag: '', continent: 'europe', pin: [0, 0], ll: [50.08, 14.44] },
  { code: 'RO', fr: 'Roumanie', en: 'Romania', flag: '', continent: 'europe', pin: [0, 0], ll: [44.43, 26.1] },
  { code: 'RU', fr: 'Russie', en: 'Russia', flag: '', continent: 'europe', pin: [0, 0], ll: [55.76, 37.62] },
  { code: 'RW', fr: 'Rwanda', en: 'Rwanda', flag: '', continent: 'africa', pin: [0, 0], ll: [-1.95, 30.06] },
  { code: 'KN', fr: 'Saint-Christophe-et-Niévès', en: 'Saint Kitts and Nevis', flag: '', continent: 'north_america', pin: [0, 0], ll: [17.3, -62.72] },
  { code: 'LC', fr: 'Sainte-Lucie', en: 'Saint Lucia', flag: '', continent: 'north_america', pin: [0, 0], ll: [14.01, -60.99] },
  { code: 'SM', fr: 'Saint-Marin', en: 'San Marino', flag: '', continent: 'europe', pin: [0, 0], ll: [43.94, 12.45] },
  { code: 'VC', fr: 'Saint-Vincent-et-les-Grenadines', en: 'Saint Vincent and the Grenadines', flag: '', continent: 'north_america', pin: [0, 0], ll: [13.16, -61.22] },
  { code: 'SB', fr: 'Îles Salomon', en: 'Solomon Islands', flag: '', continent: 'oceania', pin: [0, 0], ll: [-9.43, 159.95] },
  { code: 'SV', fr: 'Salvador', en: 'El Salvador', flag: '', continent: 'north_america', pin: [0, 0], ll: [13.69, -89.22] },
  { code: 'WS', fr: 'Samoa', en: 'Samoa', flag: '', continent: 'oceania', pin: [0, 0], ll: [-13.85, -171.75] },
  { code: 'ST', fr: 'Sao Tomé-et-Principe', en: 'São Tomé and Príncipe', flag: '', continent: 'africa', pin: [0, 0], ll: [0.34, 6.73] },
  { code: 'SN', fr: 'Sénégal', en: 'Senegal', flag: '', continent: 'africa', pin: [0, 0], ll: [14.72, -17.47] },
  { code: 'RS', fr: 'Serbie', en: 'Serbia', flag: '', continent: 'europe', pin: [0, 0], ll: [44.79, 20.45] },
  { code: 'SC', fr: 'Seychelles', en: 'Seychelles', flag: '', continent: 'africa', pin: [0, 0], ll: [-4.62, 55.45] },
  { code: 'SL', fr: 'Sierra Leone', en: 'Sierra Leone', flag: '', continent: 'africa', pin: [0, 0], ll: [8.48, -13.23] },
  { code: 'SG', fr: 'Singapour', en: 'Singapore', flag: '', continent: 'asia', pin: [0, 0], ll: [1.35, 103.82] },
  { code: 'SK', fr: 'Slovaquie', en: 'Slovakia', flag: '', continent: 'europe', pin: [0, 0], ll: [48.15, 17.11] },
  { code: 'SI', fr: 'Slovénie', en: 'Slovenia', flag: '', continent: 'europe', pin: [0, 0], ll: [46.06, 14.51] },
  { code: 'SO', fr: 'Somalie', en: 'Somalia', flag: '', continent: 'africa', pin: [0, 0], ll: [2.05, 45.32] },
  { code: 'SD', fr: 'Soudan', en: 'Sudan', flag: '', continent: 'africa', pin: [0, 0], ll: [15.5, 32.56] },
  { code: 'SS', fr: 'Soudan du Sud', en: 'South Sudan', flag: '', continent: 'africa', pin: [0, 0], ll: [4.85, 31.58] },
  { code: 'LK', fr: 'Sri Lanka', en: 'Sri Lanka', flag: '', continent: 'asia', pin: [0, 0], ll: [6.93, 79.86] },
  { code: 'SE', fr: 'Suède', en: 'Sweden', flag: '', continent: 'europe', pin: [0, 0], ll: [59.33, 18.07] },
  { code: 'SR', fr: 'Suriname', en: 'Suriname', flag: '', continent: 'south_america', pin: [0, 0], ll: [5.85, -55.2] },
  { code: 'SY', fr: 'Syrie', en: 'Syria', flag: '', continent: 'asia', pin: [0, 0], ll: [33.51, 36.28] },
  { code: 'TJ', fr: 'Tadjikistan', en: 'Tajikistan', flag: '', continent: 'asia', pin: [0, 0], ll: [38.56, 68.77] },
  { code: 'TW', fr: 'Taïwan', en: 'Taiwan', flag: '', continent: 'asia', pin: [0, 0], ll: [25.03, 121.57] },
  { code: 'TZ', fr: 'Tanzanie', en: 'Tanzania', flag: '', continent: 'africa', pin: [0, 0], ll: [-6.79, 39.21] },
  { code: 'TD', fr: 'Tchad', en: 'Chad', flag: '', continent: 'africa', pin: [0, 0], ll: [12.13, 15.06] },
  { code: 'TH', fr: 'Thaïlande', en: 'Thailand', flag: '', continent: 'asia', pin: [0, 0], ll: [13.76, 100.5] },
  { code: 'TL', fr: 'Timor oriental', en: 'Timor-Leste', flag: '', continent: 'asia', pin: [0, 0], ll: [-8.56, 125.57] },
  { code: 'TG', fr: 'Togo', en: 'Togo', flag: '', continent: 'africa', pin: [0, 0], ll: [6.13, 1.22] },
  { code: 'TO', fr: 'Tonga', en: 'Tonga', flag: '', continent: 'oceania', pin: [0, 0], ll: [-21.14, -175.2] },
  { code: 'TT', fr: 'Trinité-et-Tobago', en: 'Trinidad and Tobago', flag: '', continent: 'north_america', pin: [0, 0], ll: [10.65, -61.51] },
  { code: 'TN', fr: 'Tunisie', en: 'Tunisia', flag: '', continent: 'africa', pin: [0, 0], ll: [36.81, 10.18] },
  { code: 'TM', fr: 'Turkménistan', en: 'Turkmenistan', flag: '', continent: 'asia', pin: [0, 0], ll: [37.96, 58.33] },
  { code: 'TR', fr: 'Turquie', en: 'Türkiye', flag: '', continent: 'asia', pin: [0, 0], ll: [39.93, 32.86] },
  { code: 'TV', fr: 'Tuvalu', en: 'Tuvalu', flag: '', continent: 'oceania', pin: [0, 0], ll: [-8.52, 179.2] },
  { code: 'UA', fr: 'Ukraine', en: 'Ukraine', flag: '', continent: 'europe', pin: [0, 0], ll: [50.45, 30.52] },
  { code: 'UY', fr: 'Uruguay', en: 'Uruguay', flag: '', continent: 'south_america', pin: [0, 0], ll: [-34.9, -56.16] },
  { code: 'VU', fr: 'Vanuatu', en: 'Vanuatu', flag: '', continent: 'oceania', pin: [0, 0], ll: [-17.73, 168.32] },
  { code: 'VA', fr: 'Vatican', en: 'Vatican City', flag: '', continent: 'europe', pin: [0, 0], ll: [41.9, 12.45] },
  { code: 'VE', fr: 'Venezuela', en: 'Venezuela', flag: '', continent: 'south_america', pin: [0, 0], ll: [10.48, -66.9] },
  { code: 'VN', fr: 'Viêt Nam', en: 'Vietnam', flag: '', continent: 'asia', pin: [0, 0], ll: [21.03, 105.85] },
  { code: 'YE', fr: 'Yémen', en: 'Yemen', flag: '', continent: 'asia', pin: [0, 0], ll: [15.37, 44.19] },
  { code: 'ZM', fr: 'Zambie', en: 'Zambia', flag: '', continent: 'africa', pin: [0, 0], ll: [-15.39, 28.32] },
  { code: 'ZW', fr: 'Zimbabwe', en: 'Zimbabwe', flag: '', continent: 'africa', pin: [0, 0], ll: [-17.83, 31.05] },
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

const intlNames = new Map<string, Intl.DisplayNames | null>();
function intlName(code: string, lang: string) {
  if (!intlNames.has(lang)) {
    try {
      intlNames.set(lang, typeof Intl !== 'undefined' && 'DisplayNames' in Intl ? new Intl.DisplayNames([lang], { type: 'region' }) : null);
    } catch {
      intlNames.set(lang, null);
    }
  }
  try {
    const n = intlNames.get(lang)?.of(code);
    return n && n !== code ? n : null;
  } catch {
    return null;
  }
}

/** Country name in any app language; falls back to the device's names, then English, then the code. */
export function countryLabel(code: string | undefined, lang: string): string {
  const c = countryByCode(code);
  if (!c) return code ?? '';
  // Lebanese (Arabizi): the French names, as they are said in Lebanon.
  if (lang === 'fr') return c.fr;
  // Kuwaiti (Arabizi): the English names, as they are said in Kuwait.
  if (lang === 'en' || lang === 'pirate') return c.en;
  return NAMES[c.code]?.[lang as keyof (typeof NAMES)[string]] ?? intlName(c.code, lang) ?? c.en;
}

/** Every country, in alphabetical order for the reader's language (for lists and pickers). */
export function sortedCountries(lang: string) {
  const loc = lang === 'pirate' ? 'en' : lang;
  return [...COUNTRIES].map((c) => ({ ...c, name: countryLabel(c.code, lang) })).sort((a, b) => a.name.localeCompare(b.name, loc));
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
