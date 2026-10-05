import { resolvePlace, type PlaceAliases } from './placeKey';
import type { Role, User } from './types';

/**
 * First names start with a capital, every part of a compound one too (« Jean-Claude », « Jean Marie »,
 * « habari » → « Habari », « JEAN » → « Jean »). Last names are all capitals (store.tsx, upperName).
 * The database applies the same rules (migration 032).
 */
export const properFirstName = (s: string) => s.toLocaleLowerCase('fr').replace(/(^|[\s'’-])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toLocaleUpperCase('fr'));

/**
 * Membership rules shared by every screen and by the demo store.
 * The same rules are enforced by the database (supabase/schema.sql), so they cannot be bypassed.
 */

export const LFK_SCHOOL = 'Lycée Français du Koweït';

// ——— Alumni number (5 digits, 11111, 11112, … never reused) ———

export const FIRST_ALUMNI_NUMBER = 11111;

/** Alumni and Bureau members (admins) have an Alumni number; students and honorary members do not. */
export const hasAlumniNumber = (role: Role) => role === 'alumni' || role === 'admin';

// ——— Bureau code (4 digits, typed by an admin, unique, admins only) ———

export const isValidBureauCode = (code: string) => /^\d{4}$/.test(code);

/** Contact details (birth date + phone) are mandatory for everyone except honorary members. */
export const requiresContact = (role: Role) => role !== 'honneur';

/**
 * Applies the role rules to a profile: students study at the LFK, only admins keep a Bureau code,
 * alumni/admins without a number get the next one.
 */
export function applyRoleRules(u: User, nextNumber: () => string): User {
  const next: User = { ...u };
  if (next.role === 'eleve') next.school = LFK_SCHOOL;
  if (next.role !== 'admin') next.bureauCode = undefined;
  if (hasAlumniNumber(next.role) && !next.alumniNumber) next.alumniNumber = nextNumber();
  return next;
}

// ——— Birth date: typed as JJ/MM/AAAA, stored as YYYY-MM-DD ———

/** Adds the slashes while typing: "1203200" → "12/03/200". */
export function maskFrDate(input: string) {
  const digits = input.replace(/\D/g, '').slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join('/');
}

/** "12/03/2002" → "2002-03-12", or null when it is not a real past date. */
export function parseFrDate(value: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const iso = `${yyyy}-${mm}-${dd}`;
  return isValidBirthDate(iso) ? iso : null;
}

export function isoToFrDate(iso?: string) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/** A real calendar date, in the past, between 1900 and 10 years ago. */
export function isValidBirthDate(iso?: string) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return false;
  const now = new Date();
  return y >= 1900 && date.getTime() <= Date.UTC(now.getUTCFullYear() - 10, now.getUTCMonth(), now.getUTCDate());
}

// ——— Phone: country dialling code + number, stored as "+965 12345678" ———

export type DialCode = { code: string; dial: string };

/** ISO country code (for the flag) → dialling code, for every country (see data/nationalities.ts). */
const DIAL: Record<string, string> = {
  AF: '+93', ZA: '+27', AL: '+355', DZ: '+213', DE: '+49', AD: '+376', AO: '+244', AG: '+1', SA: '+966', AR: '+54',
  AM: '+374', AU: '+61', AT: '+43', AZ: '+994', BS: '+1', BH: '+973', BD: '+880', BB: '+1', BE: '+32', BZ: '+501',
  BJ: '+229', BT: '+975', BY: '+375', MM: '+95', BO: '+591', BA: '+387', BW: '+267', BR: '+55', BN: '+673', BG: '+359',
  BF: '+226', BI: '+257', KH: '+855', CM: '+237', CA: '+1', CV: '+238', CF: '+236', CL: '+56', CN: '+86', CY: '+357',
  CO: '+57', KM: '+269', CG: '+242', CD: '+243', KR: '+82', KP: '+850', CR: '+506', CI: '+225', HR: '+385', CU: '+53',
  DK: '+45', DJ: '+253', DM: '+1', EG: '+20', AE: '+971', EC: '+593', ER: '+291', ES: '+34', EE: '+372', SZ: '+268',
  US: '+1', ET: '+251', FJ: '+679', FI: '+358', FR: '+33', GA: '+241', GM: '+220', GE: '+995', GH: '+233', GR: '+30',
  GD: '+1', GT: '+502', GN: '+224', GQ: '+240', GW: '+245', GY: '+592', HT: '+509', HN: '+504', HU: '+36', IN: '+91',
  ID: '+62', IQ: '+964', IR: '+98', IE: '+353', IS: '+354', IL: '+972', IT: '+39', JM: '+1', JP: '+81', JO: '+962',
  KZ: '+7', KE: '+254', KG: '+996', KI: '+686', XK: '+383', KW: '+965', LA: '+856', LS: '+266', LV: '+371', LB: '+961',
  LR: '+231', LY: '+218', LI: '+423', LT: '+370', LU: '+352', MK: '+389', MG: '+261', MY: '+60', MW: '+265', MV: '+960',
  ML: '+223', MT: '+356', MA: '+212', MH: '+692', MU: '+230', MR: '+222', MX: '+52', FM: '+691', MD: '+373', MC: '+377',
  MN: '+976', ME: '+382', MZ: '+258', NA: '+264', NR: '+674', NP: '+977', NI: '+505', NE: '+227', NG: '+234', NO: '+47',
  NZ: '+64', OM: '+968', UG: '+256', UZ: '+998', PK: '+92', PW: '+680', PS: '+970', PA: '+507', PG: '+675', PY: '+595',
  NL: '+31', PE: '+51', PH: '+63', PL: '+48', PT: '+351', QA: '+974', DO: '+1', CZ: '+420', RO: '+40', GB: '+44',
  RU: '+7', RW: '+250', KN: '+1', LC: '+1', SM: '+378', VC: '+1', SB: '+677', SV: '+503', WS: '+685', ST: '+239',
  SN: '+221', RS: '+381', SC: '+248', SL: '+232', SG: '+65', SK: '+421', SI: '+386', SO: '+252', SD: '+249', SS: '+211',
  LK: '+94', SE: '+46', CH: '+41', SR: '+597', SY: '+963', TJ: '+992', TW: '+886', TZ: '+255', TD: '+235', TH: '+66',
  TL: '+670', TG: '+228', TO: '+676', TT: '+1', TN: '+216', TM: '+993', TR: '+90', TV: '+688', UA: '+380', UY: '+598',
  VU: '+678', VA: '+39', VE: '+58', VN: '+84', YE: '+967', ZM: '+260', ZW: '+263',
};
export const DIAL_CODES: DialCode[] = Object.entries(DIAL).map(([code, dial]) => ({ code, dial }));
export const DIAL_BY_COUNTRY = DIAL;
/** The usual country for a shared code (+1 → United States…), else the first one using it. */
const MAIN_FOR_DIAL: Record<string, string> = { '+1': 'US', '+7': 'RU', '+44': 'GB', '+39': 'IT', '+33': 'FR', '+965': 'KW' };
export const countryForDial = (dial: string) => MAIN_FOR_DIAL[dial] ?? DIAL_CODES.find((c) => c.dial === dial)?.code;

/** Digits only, 6 to 14 of them (national number without the country code). */
export const isValidPhoneNumber = (number: string) => /^\d{6,14}$/.test(number.replace(/[\s.-]/g, ''));

export const formatPhone = (dial: string, number: string) => `${dial} ${number.replace(/[\s.-]/g, '')}`;

/** "+965 12345678" → { dial, number }; unknown formats keep the whole value as the number. */
export function parsePhone(stored?: string): { dial: string; number: string } {
  const m = /^(\+\d{1,4})\s+(.*)$/.exec(stored ?? '');
  if (m) return { dial: m[1], number: m[2].replace(/\s/g, '') };
  return { dial: '+965', number: (stored ?? '').replace(/[^\d]/g, '') };
}

/** A stored phone that respects the rule: "+<code> <6–14 digits>". */
export const isValidStoredPhone = (stored?: string) => !!stored && /^\+\d{1,4} \d{6,14}$/.test(stored);

/** Contact rule check used before saving a profile or creating an account. */
export function contactError(role: Role, birthDate?: string, phone?: string): 'birth_date' | 'phone' | null {
  if (!requiresContact(role)) {
    if (birthDate && !isValidBirthDate(birthDate)) return 'birth_date';
    if (phone && !isValidStoredPhone(phone)) return 'phone';
    return null;
  }
  if (!isValidBirthDate(birthDate)) return 'birth_date';
  if (!isValidStoredPhone(phone)) return 'phone';
  return null;
}

/**
 * One line about what a member does now: « Poste · Entreprise » when working, the university when
 * studying, or the role title of school leadership.
 */
export function occupation(u: Pick<User, 'fonction' | 'situation' | 'employer' | 'jobTitle' | 'school'>): string | undefined {
  if (u.fonction) return u.fonction;
  if (u.situation === 'working' && (u.employer || u.jobTitle)) return [u.jobTitle, u.employer].filter(Boolean).join(' · ');
  return u.school;
}

/**
 * Where people studied, one entry per university: the main one, plus the other ones (exchange,
 * second degree), each in its own country. Used by Repère and the statistics.
 */
export type StudyEntry<U> = U & { exchange?: boolean; extra?: boolean };
export function studyEntries<U extends Pick<User, 'school' | 'country' | 'otherSchools'>>(users: U[], aliases: PlaceAliases = {}): StudyEntry<U>[] {
  const out: StudyEntry<U>[] = [];
  for (const u of users) {
    // A person counts once per university: the same school entered twice (main + other, or two
    // spellings merged by an admin) is kept only the first time.
    const seen = new Set<string>();
    const add = (e: StudyEntry<U>) => {
      const k = resolvePlace(e.school, aliases);
      if (!k || seen.has(k)) return;
      seen.add(k);
      out.push(e);
    };
    if (u.school) add(u);
    for (const s of u.otherSchools ?? []) {
      if (s.name) add({ ...u, school: s.name, country: s.country ?? u.country, exchange: !!s.exchange, extra: true });
    }
  }
  return out;
}
