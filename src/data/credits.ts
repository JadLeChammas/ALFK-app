import { useMemo } from 'react';

import { usePublicSetting } from './publicSettings';

/**
 * The end credits (easter egg on the ©), edited by admins in the dashboard. Saved as JSON in
 * app_settings (`credits`), which visitors can also read (migration 011).
 * Empty texts fall back to the translated defaults.
 */
export type CreditLine = { id: string; name: string; role?: string };
export type CreditSection = { id: string; heading: string; lines: CreditLine[] };
export type CreditsConfig = {
  title?: string;
  showBureau: boolean;
  showMembers: boolean;
  sections: CreditSection[];
  thanks?: string;
  closing?: string;
};

export const DEFAULT_CREDITS: CreditsConfig = {
  showBureau: true,
  showMembers: true,
  sections: [
    {
      id: 's-made',
      heading: 'Réalisation',
      lines: [
        { id: 'l-jad', name: 'Jad El Chammas', role: 'Création et développement' },
        { id: 'l-anwar', name: 'anwarbitar', role: 'Design du site et globe 3D' },
      ],
    },
  ],
};

export function parseCredits(raw?: string | null): CreditsConfig | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    return v && Array.isArray(v.sections) ? (v as CreditsConfig) : null;
  } catch {
    return null;
  }
}

/** The saved credits (members get them with the settings; visitors fetch the one public row). */
export function useCreditsConfig(enabled = true) {
  const raw = usePublicSetting('credits', enabled);
  return useMemo(() => {
    const saved = parseCredits(raw);
    return { config: saved ?? DEFAULT_CREDITS, custom: !!saved };
  }, [raw]);
}
