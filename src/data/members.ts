import type { Role, User } from './types';

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

/** ISO country code (for the flag) → dialling code. Kuwait and France first. */
export const DIAL_CODES: DialCode[] = [
  { code: 'KW', dial: '+965' },
  { code: 'FR', dial: '+33' },
  { code: 'LB', dial: '+961' },
  { code: 'AE', dial: '+971' },
  { code: 'SA', dial: '+966' },
  { code: 'QA', dial: '+974' },
  { code: 'BH', dial: '+973' },
  { code: 'OM', dial: '+968' },
  { code: 'EG', dial: '+20' },
  { code: 'MA', dial: '+212' },
  { code: 'TN', dial: '+216' },
  { code: 'DZ', dial: '+213' },
  { code: 'JO', dial: '+962' },
  { code: 'GB', dial: '+44' },
  { code: 'BE', dial: '+32' },
  { code: 'CH', dial: '+41' },
  { code: 'DE', dial: '+49' },
  { code: 'ES', dial: '+34' },
  { code: 'IT', dial: '+39' },
  { code: 'PT', dial: '+351' },
  { code: 'NL', dial: '+31' },
  { code: 'LU', dial: '+352' },
  { code: 'IE', dial: '+353' },
  { code: 'SE', dial: '+46' },
  { code: 'CA', dial: '+1' },
  { code: 'US', dial: '+1' },
  { code: 'BR', dial: '+55' },
  { code: 'MX', dial: '+52' },
  { code: 'JP', dial: '+81' },
  { code: 'CN', dial: '+86' },
  { code: 'KR', dial: '+82' },
  { code: 'IN', dial: '+91' },
  { code: 'SG', dial: '+65' },
  { code: 'TR', dial: '+90' },
  { code: 'AU', dial: '+61' },
];

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
