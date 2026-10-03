/**
 * Fields of study (majors). Keys are stored; labels come from i18n `fields`. A member can have several
 * (`fields`, see userFields), and « Autre » lets them type their own: stored as « other:Their major ».
 */
export const FIELDS = [
  'medecine',
  'pharmacie',
  'dentaire',
  'paramedical',
  'veterinaire',
  'biologie',
  'chimie',
  'physique',
  'mathematiques',
  'sciences',
  'informatique',
  'data',
  'ingenierie',
  'genieCivil',
  'genieMecanique',
  'genieElectrique',
  'aeronautique',
  'architecture',
  'design',
  'arts',
  'musique',
  'cinema',
  'mode',
  'droit',
  'sciencesPo',
  'relationsInternationales',
  'economie',
  'finance',
  'gestion',
  'marketing',
  'commerce',
  'comptabilite',
  'hotellerie',
  'communication',
  'journalisme',
  'lettres',
  'langues',
  'histoire',
  'philosophie',
  'psychologie',
  'sociologie',
  'education',
  'sport',
  'environnement',
  'agronomie',
  'autre',
] as const;
export type FieldKey = (typeof FIELDS)[number];
export const isField = (v?: string): v is FieldKey => !!v && (FIELDS as readonly string[]).includes(v);

/** « other:Their major » for a field typed by the member. */
export const OTHER_PREFIX = 'other:';
export const customField = (text: string) => `${OTHER_PREFIX}${text.trim()}`;
export const isCustomField = (v?: string) => !!v && v.startsWith(OTHER_PREFIX);

/** All the fields of a member (the older single field included). */
export function userFields(u: { fields?: string[]; fieldOfStudy?: string }): string[] {
  if (u.fields?.length) return u.fields;
  return u.fieldOfStudy ? [u.fieldOfStudy] : [];
}

/** The key used for counts and filters: a typed field counts as « Autre ». */
export const fieldKey = (v: string): FieldKey => (isField(v) ? v : 'autre');

/** Label of a stored field: the translation, or the text the member typed. */
export function fieldLabel(v: string, labels: Record<FieldKey, string>) {
  if (isCustomField(v)) return v.slice(OTHER_PREFIX.length);
  return isField(v) ? labels[v] : v;
}
