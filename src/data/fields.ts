/** Fields of study used by the Orientation space (keys are stored; labels come from i18n `fields`). */
export const FIELDS = [
  'medecine',
  'droit',
  'economie',
  'ingenierie',
  'informatique',
  'sciences',
  'architecture',
  'arts',
  'lettres',
  'sciencesPo',
  'communication',
  'education',
  'autre',
] as const;
export type FieldKey = (typeof FIELDS)[number];
export const isField = (v?: string): v is FieldKey => !!v && (FIELDS as readonly string[]).includes(v);
