import { useMemo } from 'react';
import { View } from 'react-native';

import { placeKey, resolvePlace, usePlaceAliases } from '@/data/places';
import { useI18n } from '@/i18n';
import { Chip, Row } from './ui/primitives';
import { Txt } from './ui/Txt';

/**
 * While someone types a university or a company, offer the names already used on the platform
 * (same place, or names containing what they typed) — so everyone picks the same spelling.
 */
export function PlaceSuggestions({ value, options, onPick, max = 5 }: { value: string; options: string[]; onPick: (v: string) => void; max?: number }) {
  const { d } = useI18n();
  const aliases = usePlaceAliases();
  const matches = useMemo(() => {
    const typed = placeKey(value);
    if (typed.length < 2) return [];
    const target = resolvePlace(value, aliases);
    const seen = new Set<string>();
    const out: string[] = [];
    for (const o of options) {
      const k = resolvePlace(o, aliases);
      if (seen.has(k) || o.trim() === value.trim()) continue;
      if (k === target || placeKey(o).includes(typed)) {
        seen.add(k);
        out.push(o);
      }
      if (out.length >= max) break;
    }
    return out;
  }, [value, options, aliases, max]);

  if (!matches.length) return null;
  return (
    <View style={{ gap: 6 }}>
      <Txt variant="small" color="textSubtle">{d.repere.suggestions}</Txt>
      <Row gap={6} wrap>
        {matches.map((m) => (
          <Chip key={m} label={m} icon="check" onPress={() => onPick(m)} />
        ))}
      </Row>
    </View>
  );
}
