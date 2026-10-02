import { useMemo } from 'react';

import { parseAliases, resolvePlace, type PlaceAliases } from './placeKey';
import { useStore } from './store';

export { parseAliases, placeKey, resolvePlace, type PlaceAliases } from './placeKey';

/** Groups items by place; the label is the spelling used most often in the group. */
export function groupByPlace<T>(items: T[], name: (t: T) => string | undefined, aliases: PlaceAliases) {
  type Group = { key: string; label: string; items: T[]; spellings: Map<string, number> };
  const groups = new Map<string, Group>();
  for (const it of items) {
    const raw = name(it)?.trim();
    if (!raw) continue;
    const key = resolvePlace(raw, aliases);
    const g: Group = groups.get(key) ?? { key, label: raw, items: [], spellings: new Map() };
    g.items.push(it);
    g.spellings.set(raw, (g.spellings.get(raw) ?? 0) + 1);
    groups.set(key, g);
  }
  for (const g of groups.values()) {
    g.label = [...g.spellings].sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)[0][0];
  }
  return [...groups.values()].sort((a, b) => b.items.length - a.items.length || a.label.localeCompare(b.label));
}

/** Current aliases (admin merges) from the store. */
export function usePlaceAliases(): PlaceAliases {
  const { db } = useStore();
  const raw = db.settings.placeAliases;
  return useMemo(() => parseAliases(raw), [raw]);
}
