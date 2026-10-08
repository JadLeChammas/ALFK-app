import { LANGUAGES } from '@/i18n';

/**
 * Every country, for nationalities (a member can have several). ISO 3166-1 alpha-2 codes with French and
 * English names; other languages use the device's own country names when it has them (Intl.DisplayNames).
 */
type Nat = [code: string, fr: string, en: string];

// prettier-ignore
const LIST: Nat[] = [
  ['AF', 'Afghanistan', 'Afghanistan'], ['ZA', 'Afrique du Sud', 'South Africa'], ['AL', 'Albanie', 'Albania'], ['DZ', 'Algérie', 'Algeria'],
  ['DE', 'Allemagne', 'Germany'], ['AD', 'Andorre', 'Andorra'], ['AO', 'Angola', 'Angola'], ['AG', 'Antigua-et-Barbuda', 'Antigua and Barbuda'],
  ['SA', 'Arabie saoudite', 'Saudi Arabia'], ['AR', 'Argentine', 'Argentina'], ['AM', 'Arménie', 'Armenia'], ['AU', 'Australie', 'Australia'],
  ['AT', 'Autriche', 'Austria'], ['AZ', 'Azerbaïdjan', 'Azerbaijan'], ['BS', 'Bahamas', 'Bahamas'], ['BH', 'Bahreïn', 'Bahrain'],
  ['BD', 'Bangladesh', 'Bangladesh'], ['BB', 'Barbade', 'Barbados'], ['BE', 'Belgique', 'Belgium'], ['BZ', 'Belize', 'Belize'],
  ['BJ', 'Bénin', 'Benin'], ['BT', 'Bhoutan', 'Bhutan'], ['BY', 'Biélorussie', 'Belarus'], ['MM', 'Birmanie', 'Myanmar'],
  ['BO', 'Bolivie', 'Bolivia'], ['BA', 'Bosnie-Herzégovine', 'Bosnia and Herzegovina'], ['BW', 'Botswana', 'Botswana'], ['BR', 'Brésil', 'Brazil'],
  ['BN', 'Brunei', 'Brunei'], ['BG', 'Bulgarie', 'Bulgaria'], ['BF', 'Burkina Faso', 'Burkina Faso'], ['BI', 'Burundi', 'Burundi'],
  ['KH', 'Cambodge', 'Cambodia'], ['CM', 'Cameroun', 'Cameroon'], ['CA', 'Canada', 'Canada'], ['CV', 'Cap-Vert', 'Cape Verde'],
  ['CF', 'Centrafrique', 'Central African Republic'], ['CL', 'Chili', 'Chile'], ['CN', 'Chine', 'China'], ['CY', 'Chypre', 'Cyprus'],
  ['CO', 'Colombie', 'Colombia'], ['KM', 'Comores', 'Comoros'], ['CG', 'Congo', 'Congo'], ['CD', 'Congo (RDC)', 'DR Congo'],
  ['KR', 'Corée du Sud', 'South Korea'], ['KP', 'Corée du Nord', 'North Korea'], ['CR', 'Costa Rica', 'Costa Rica'], ['CI', 'Côte d’Ivoire', 'Côte d’Ivoire'],
  ['HR', 'Croatie', 'Croatia'], ['CU', 'Cuba', 'Cuba'], ['DK', 'Danemark', 'Denmark'], ['DJ', 'Djibouti', 'Djibouti'],
  ['DM', 'Dominique', 'Dominica'], ['EG', 'Égypte', 'Egypt'], ['AE', 'Émirats arabes unis', 'United Arab Emirates'], ['EC', 'Équateur', 'Ecuador'],
  ['ER', 'Érythrée', 'Eritrea'], ['ES', 'Espagne', 'Spain'], ['EE', 'Estonie', 'Estonia'], ['SZ', 'Eswatini', 'Eswatini'],
  ['US', 'États-Unis', 'United States'], ['ET', 'Éthiopie', 'Ethiopia'], ['FJ', 'Fidji', 'Fiji'], ['FI', 'Finlande', 'Finland'],
  ['FR', 'France', 'France'], ['GA', 'Gabon', 'Gabon'], ['GM', 'Gambie', 'Gambia'], ['GE', 'Géorgie', 'Georgia'],
  ['GH', 'Ghana', 'Ghana'], ['GR', 'Grèce', 'Greece'], ['GD', 'Grenade', 'Grenada'], ['GT', 'Guatemala', 'Guatemala'],
  ['GN', 'Guinée', 'Guinea'], ['GQ', 'Guinée équatoriale', 'Equatorial Guinea'], ['GW', 'Guinée-Bissau', 'Guinea-Bissau'], ['GY', 'Guyana', 'Guyana'],
  ['HT', 'Haïti', 'Haiti'], ['HN', 'Honduras', 'Honduras'], ['HU', 'Hongrie', 'Hungary'], ['IN', 'Inde', 'India'],
  ['ID', 'Indonésie', 'Indonesia'], ['IQ', 'Irak', 'Iraq'], ['IR', 'Iran', 'Iran'], ['IE', 'Irlande', 'Ireland'],
  ['IS', 'Islande', 'Iceland'], ['IL', 'Israël', 'Israel'], ['IT', 'Italie', 'Italy'], ['JM', 'Jamaïque', 'Jamaica'],
  ['JP', 'Japon', 'Japan'], ['JO', 'Jordanie', 'Jordan'], ['KZ', 'Kazakhstan', 'Kazakhstan'], ['KE', 'Kenya', 'Kenya'],
  ['KG', 'Kirghizistan', 'Kyrgyzstan'], ['KI', 'Kiribati', 'Kiribati'], ['XK', 'Kosovo', 'Kosovo'], ['KW', 'Koweït', 'Kuwait'],
  ['LA', 'Laos', 'Laos'], ['LS', 'Lesotho', 'Lesotho'], ['LV', 'Lettonie', 'Latvia'], ['LB', 'Liban', 'Lebanon'],
  ['LR', 'Liberia', 'Liberia'], ['LY', 'Libye', 'Libya'], ['LI', 'Liechtenstein', 'Liechtenstein'], ['LT', 'Lituanie', 'Lithuania'],
  ['LU', 'Luxembourg', 'Luxembourg'], ['MK', 'Macédoine du Nord', 'North Macedonia'], ['MG', 'Madagascar', 'Madagascar'], ['MY', 'Malaisie', 'Malaysia'],
  ['MW', 'Malawi', 'Malawi'], ['MV', 'Maldives', 'Maldives'], ['ML', 'Mali', 'Mali'], ['MT', 'Malte', 'Malta'],
  ['MA', 'Maroc', 'Morocco'], ['MH', 'Îles Marshall', 'Marshall Islands'], ['MU', 'Maurice', 'Mauritius'], ['MR', 'Mauritanie', 'Mauritania'],
  ['MX', 'Mexique', 'Mexico'], ['FM', 'Micronésie', 'Micronesia'], ['MD', 'Moldavie', 'Moldova'], ['MC', 'Monaco', 'Monaco'],
  ['MN', 'Mongolie', 'Mongolia'], ['ME', 'Monténégro', 'Montenegro'], ['MZ', 'Mozambique', 'Mozambique'], ['NA', 'Namibie', 'Namibia'],
  ['NR', 'Nauru', 'Nauru'], ['NP', 'Népal', 'Nepal'], ['NI', 'Nicaragua', 'Nicaragua'], ['NE', 'Niger', 'Niger'],
  ['NG', 'Nigeria', 'Nigeria'], ['NO', 'Norvège', 'Norway'], ['NZ', 'Nouvelle-Zélande', 'New Zealand'], ['OM', 'Oman', 'Oman'],
  ['UG', 'Ouganda', 'Uganda'], ['UZ', 'Ouzbékistan', 'Uzbekistan'], ['PK', 'Pakistan', 'Pakistan'], ['PW', 'Palaos', 'Palau'],
  ['PS', 'Palestine', 'Palestine'], ['PA', 'Panama', 'Panama'], ['PG', 'Papouasie-Nouvelle-Guinée', 'Papua New Guinea'], ['PY', 'Paraguay', 'Paraguay'],
  ['NL', 'Pays-Bas', 'Netherlands'], ['PE', 'Pérou', 'Peru'], ['PH', 'Philippines', 'Philippines'], ['PL', 'Pologne', 'Poland'],
  ['PT', 'Portugal', 'Portugal'], ['QA', 'Qatar', 'Qatar'], ['DO', 'République dominicaine', 'Dominican Republic'], ['CZ', 'Tchéquie', 'Czechia'],
  ['RO', 'Roumanie', 'Romania'], ['GB', 'Royaume-Uni', 'United Kingdom'], ['RU', 'Russie', 'Russia'], ['RW', 'Rwanda', 'Rwanda'],
  ['KN', 'Saint-Christophe-et-Niévès', 'Saint Kitts and Nevis'], ['LC', 'Sainte-Lucie', 'Saint Lucia'], ['SM', 'Saint-Marin', 'San Marino'], ['VC', 'Saint-Vincent-et-les-Grenadines', 'Saint Vincent and the Grenadines'],
  ['SB', 'Îles Salomon', 'Solomon Islands'], ['SV', 'Salvador', 'El Salvador'], ['WS', 'Samoa', 'Samoa'], ['ST', 'Sao Tomé-et-Principe', 'São Tomé and Príncipe'],
  ['SN', 'Sénégal', 'Senegal'], ['RS', 'Serbie', 'Serbia'], ['SC', 'Seychelles', 'Seychelles'], ['SL', 'Sierra Leone', 'Sierra Leone'],
  ['SG', 'Singapour', 'Singapore'], ['SK', 'Slovaquie', 'Slovakia'], ['SI', 'Slovénie', 'Slovenia'], ['SO', 'Somalie', 'Somalia'],
  ['SD', 'Soudan', 'Sudan'], ['SS', 'Soudan du Sud', 'South Sudan'], ['LK', 'Sri Lanka', 'Sri Lanka'], ['SE', 'Suède', 'Sweden'],
  ['CH', 'Suisse', 'Switzerland'], ['SR', 'Suriname', 'Suriname'], ['SY', 'Syrie', 'Syria'], ['TJ', 'Tadjikistan', 'Tajikistan'],
  ['TW', 'Taïwan', 'Taiwan'], ['TZ', 'Tanzanie', 'Tanzania'], ['TD', 'Tchad', 'Chad'], ['TH', 'Thaïlande', 'Thailand'],
  ['TL', 'Timor oriental', 'Timor-Leste'], ['TG', 'Togo', 'Togo'], ['TO', 'Tonga', 'Tonga'], ['TT', 'Trinité-et-Tobago', 'Trinidad and Tobago'],
  ['TN', 'Tunisie', 'Tunisia'], ['TM', 'Turkménistan', 'Turkmenistan'], ['TR', 'Turquie', 'Türkiye'], ['TV', 'Tuvalu', 'Tuvalu'],
  ['UA', 'Ukraine', 'Ukraine'], ['UY', 'Uruguay', 'Uruguay'], ['VU', 'Vanuatu', 'Vanuatu'], ['VA', 'Vatican', 'Vatican City'],
  ['VE', 'Venezuela', 'Venezuela'], ['VN', 'Viêt Nam', 'Vietnam'], ['YE', 'Yémen', 'Yemen'], ['ZM', 'Zambie', 'Zambia'],
  ['ZW', 'Zimbabwe', 'Zimbabwe'],
];

export const NATIONALITIES = LIST.map(([code, fr, en]) => ({ code, fr, en }));
const byCode = new Map(NATIONALITIES.map((n) => [n.code, n]));

const displayNames = new Map<string, Intl.DisplayNames | null>();
function intlName(code: string, lang: string) {
  if (!displayNames.has(lang)) {
    try {
      const locale = LANGUAGES.find((l) => l.code === lang)?.locale ?? lang;
      displayNames.set(lang, typeof Intl !== 'undefined' && 'DisplayNames' in Intl ? new Intl.DisplayNames([locale], { type: 'region' }) : null);
    } catch {
      displayNames.set(lang, null);
    }
  }
  try {
    const n = displayNames.get(lang)?.of(code);
    return n && n !== code ? n : null;
  } catch {
    return null;
  }
}

/** Country name for a nationality, in the reader's language. */
export function nationalityName(code: string, lang: string) {
  const n = byCode.get(code);
  if (!n) return code;
  if (lang === 'fr') return n.fr;
  if (lang === 'en' || lang === 'pirate') return n.en;
  return intlName(code, lang) ?? n.en;
}

/** Sorted the way readers expect, in their language. */
export function sortedNationalities(lang: string) {
  return [...NATIONALITIES].map((n) => ({ code: n.code, name: nationalityName(n.code, lang) })).sort((a, b) => a.name.localeCompare(b.name, lang === 'pirate' ? 'en' : lang));
}

/** Counts per nationality among members (a person with two nationalities counts for both). */
export function countNationalities(users: { nationalities?: string[] }[]) {
  const m = new Map<string, number>();
  for (const u of users) for (const c of new Set(u.nationalities ?? [])) m.set(c, (m.get(c) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}
