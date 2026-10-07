import { useMemo } from 'react';

import { withEnglish } from './guidesEn';
import { WORLD_GUIDES } from './guidesWorld';
import { useStore } from './store';

/**
 * Country guides (« Arriver en France », later other countries): the steps before leaving and after
 * arriving (visa, residence permit, social security…). Admins manage them in the dashboard; they are
 * saved as JSON in app_settings (`guides`). Until then, the France guide below is shown (or the
 * France-only guide saved earlier under `guideFrance`).
 */
export type GuidePhase = 'before' | 'arrival' | 'months' | 'year';
/** `…En`: the English version, read in every language but French (see `bi` in i18n). */
export type GuideStep = { id: string; phase: GuidePhase; title: string; body: string; url?: string; urlLabel?: string; titleEn?: string; bodyEn?: string; urlLabelEn?: string };
export type CountryGuide = {
  id: string;
  /** ISO code, see countries.ts */
  country: string;
  /** Written by the admins; empty = « Guide — {country} » in the reader's language. */
  title?: string;
  intro?: string;
  titleEn?: string;
  introEn?: string;
  /** Drafts are only visible to admins. */
  published: boolean;
  steps: GuideStep[];
  /** A built-in guide an admin deleted: kept in the saved list so that it does not come back. */
  hidden?: boolean;
};

export const PHASES: GuidePhase[] = ['before', 'arrival', 'months', 'year'];

export const DEFAULT_GUIDE: GuideStep[] = [
  // ——— Avant le départ ———
  {
    id: 'g-nationalite', phase: 'before', title: 'Vérifier si vous avez besoin d’un visa',
    body: 'Nationalité française ou européenne : pas de visa ni de titre de séjour, passez directement au logement et à la sécurité sociale.\nAutres nationalités : un visa long séjour « étudiant » est nécessaire. Commencez les démarches dès l’admission, les délais peuvent dépasser un mois.',
  },
  {
    id: 'g-campus', phase: 'before', title: 'Campus France / Études en France',
    body: 'Dans de nombreux pays, la candidature et le visa passent d’abord par la procédure « Études en France » de Campus France (dossier en ligne, entretien). Vérifiez sur le site si elle s’applique à votre pays.',
    url: 'https://www.campusfrance.org', urlLabel: 'Campus France',
  },
  {
    id: 'g-visa', phase: 'before', title: 'Demander le visa long séjour (VLS-TS)',
    body: 'Créez votre demande sur France-Visas, puis prenez rendez-vous au centre de visas pour déposer le dossier et vos empreintes.\nPièces habituelles : passeport valide, lettre d’admission, justificatif de ressources (environ 615 € par mois), justificatif de logement, photos d’identité.',
    url: 'https://france-visas.gouv.fr', urlLabel: 'France-Visas',
  },
  {
    id: 'g-docs', phase: 'before', title: 'Préparer ses documents',
    body: 'Emportez les originaux et des copies : passeport, acte de naissance (avec traduction si besoin), diplômes et relevés de notes, attestation du bac, photos d’identité. Gardez aussi une version scannée dans votre téléphone.',
  },
  {
    id: 'g-logement', phase: 'before', title: 'Trouver un logement',
    body: 'Résidences du CROUS (dossier social étudiant), résidences privées, colocations. Pour la caution, la garantie Visale est gratuite pour les étudiants.\nDemandez aussi aux alumni de votre ville dans Repère : ils connaissent les bons plans.',
    url: 'https://www.messervices.etudiant.gouv.fr', urlLabel: 'Mes services étudiant (CROUS)',
  },
  {
    id: 'g-cvec', phase: 'before', title: 'Payer la CVEC',
    body: 'La Contribution vie étudiante et de campus (environ 105 €) est obligatoire avant l’inscription administrative dans la plupart des établissements. Gardez l’attestation.',
    url: 'https://cvec.etudiant.gouv.fr', urlLabel: 'CVEC',
  },
  // ——— À l’arrivée ———
  {
    id: 'g-validation', phase: 'arrival', title: 'Valider son visa (VLS-TS)',
    body: 'Dans les 3 mois après l’arrivée, validez votre visa en ligne sur le site de l’ANEF et payez la taxe (timbre fiscal). Sans cette validation, vous êtes en situation irrégulière à la fin des 3 mois.',
    url: 'https://administration-etrangers-en-france.interieur.gouv.fr', urlLabel: 'ANEF',
  },
  {
    id: 'g-secu', phase: 'arrival', title: 'S’inscrire à la sécurité sociale',
    body: 'Inscription gratuite : étudiants étrangers sur le site dédié de l’Assurance maladie, étudiants français sur ameli.fr. Vous obtenez un numéro de sécurité sociale puis la carte Vitale (envoyez la photo et la pièce d’identité demandées).',
    url: 'https://etudiant-etranger.ameli.fr', urlLabel: 'Assurance maladie — étudiants étrangers',
  },
  {
    id: 'g-banque', phase: 'arrival', title: 'Ouvrir un compte bancaire',
    body: 'Il faut un RIB français pour le loyer, la CAF et un job. Apportez passeport, justificatif de domicile et attestation d’inscription. Les banques en ligne sont souvent plus rapides.',
  },
  {
    id: 'g-tel', phase: 'arrival', title: 'Carte SIM et numéro français',
    body: 'Un forfait sans engagement suffit. Le numéro français sert pour la banque, la CAF et les démarches.',
  },
  {
    id: 'g-assurance', phase: 'arrival', title: 'Assurance habitation',
    body: 'Obligatoire pour louer un logement : demandez l’attestation à remettre au propriétaire ou à la résidence.',
  },
  // ——— Les premiers mois ———
  {
    id: 'g-caf', phase: 'months', title: 'Demander l’aide au logement (CAF)',
    body: 'Les étudiants, y compris étrangers, peuvent avoir droit à l’APL. Faites la demande en ligne dès votre entrée dans le logement : l’aide n’est pas rétroactive.',
    url: 'https://www.caf.fr', urlLabel: 'CAF',
  },
  {
    id: 'g-mutuelle', phase: 'months', title: 'Mutuelle et médecin traitant',
    body: 'La sécurité sociale rembourse une partie des soins ; une complémentaire santé (mutuelle) couvre le reste. Déclarez un médecin traitant pour être mieux remboursé.',
  },
  {
    id: 'g-transport', phase: 'months', title: 'Transports',
    body: 'Les villes proposent des abonnements étudiants à prix réduit (par exemple Imagine R en Île-de-France).',
  },
  // ——— Pendant l’année ———
  {
    id: 'g-renouvellement', phase: 'year', title: 'Renouveler son titre de séjour',
    body: 'Faites la demande en ligne sur l’ANEF au moins 2 mois avant la fin de validité de votre visa ou titre de séjour.',
    url: 'https://administration-etrangers-en-france.interieur.gouv.fr', urlLabel: 'ANEF',
  },
  {
    id: 'g-job', phase: 'year', title: 'Job étudiant',
    body: 'Avec un titre de séjour étudiant, vous pouvez travailler jusqu’à 964 heures par an. Pensez aux jobs proposés par votre établissement et le CROUS.',
  },
  {
    id: 'g-impots', phase: 'year', title: 'Déclarer ses revenus',
    body: 'Au printemps, la déclaration de revenus est souvent nécessaire (même sans revenus) pour garder vos droits, notamment à la CAF.',
    url: 'https://www.impots.gouv.fr', urlLabel: 'impots.gouv.fr',
  },
];

const parse = <T,>(raw?: string): T | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const defaultGuides = (franceSteps?: GuideStep[] | null): CountryGuide[] =>
  [{ id: 'guide-fr', country: 'FR', title: 'Arriver en France', published: true, steps: franceSteps ?? DEFAULT_GUIDE }, ...WORLD_GUIDES].map(withEnglish);

/** Built-in guides (France, Spain, Canada, United States, United Kingdom, Italy). */
export const isBuiltInGuide = (id: string) => defaultGuides().some((g) => g.id === id);

/** All country guides (drafts included; filter on `published` for members). */
export function useGuides() {
  const { db } = useStore();
  const raw = db.settings.guides;
  const legacy = db.settings.guideFrance;
  return useMemo(() => {
    const saved = parse<CountryGuide[]>(raw);
    if (Array.isArray(saved)) {
      // Built-in guides added after the admins saved theirs are offered too (unless deleted: hidden).
      const all = [...saved, ...defaultGuides().filter((g) => !saved.some((x) => x.id === g.id || x.country === g.country))];
      return { guides: all.filter((g) => !g.hidden), tombstones: all.filter((g) => g.hidden), custom: true };
    }
    const france = parse<GuideStep[]>(legacy);
    return { guides: defaultGuides(Array.isArray(france) ? france : null), tombstones: [] as CountryGuide[], custom: false };
  }, [raw, legacy]);
}
