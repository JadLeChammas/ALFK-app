import { Feather } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';

import { placeKey } from '@/data/places';
import { useApprovedMembers } from '@/data/store';
import { useUniversities } from '@/data/universities';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Button, IconButton, Input, SearchBar, Tap } from './ui/primitives';
import { Txt } from './ui/Txt';

/** « PARIS », « saint-denis » → « Paris », « Saint-Denis ». */
export function cityCase(v: string) {
  return v
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('fr')
    .replace(/(^|[\s\-'’])(\p{L})/gu, (_, sep: string, c: string) => sep + c.toLocaleUpperCase('fr'));
}

/**
 * The city is picked from a list (cities of the chosen country where there are universities or
 * members), so « PARIS » and « Paris » are the same city. A city missing from the list can be
 * typed; its spelling is then tidied (and matched to a listed city when it is one).
 */
export function CityPicker({ label, value, onChange, country, optional }: { label: string; value: string; onChange: (v: string) => void; country?: string; optional?: boolean }) {
  const { d } = useI18n();
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Txt variant="smallStrong" color="textMuted">{optional ? `${label} (${d.common.optional})` : label}</Txt>
      <Tap
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingHorizontal: 14, borderRadius: radius.input, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border }}
        hoverStyle={{ borderColor: colors.borderStrong }}>
        <Feather name="map-pin" size={16} color={colors.textSubtle} />
        <Txt numberOfLines={1} style={{ flex: 1, color: value ? colors.text : colors.textSubtle }}>{value || d.city.pick}</Txt>
        <Feather name="chevron-down" size={16} color={colors.textSubtle} />
      </Tap>
      {open && <CitySheet value={value} country={country} onClose={() => setOpen(false)} onPick={(v) => { onChange(v); setOpen(false); }} />}
    </View>
  );
}

function CitySheet({ value, country, onClose, onPick }: { value: string; country?: string; onClose: () => void; onPick: (v: string) => void }) {
  const { d, country: countryName } = useI18n();
  const { colors } = useTheme();
  const members = useApprovedMembers();
  const { cities: uniCities, loading } = useUniversities(country);
  const [q, setQ] = useState('');
  const [manual, setManual] = useState(false);
  const [typed, setTyped] = useState(value);

  // One entry per city (same key = same city), the most common spelling, most members first.
  const all = useMemo(() => {
    const m = new Map<string, { name: string; n: number }>();
    for (const u of members) {
      if (!u.city || (country && u.country !== country)) continue;
      const k = placeKey(u.city);
      const cur = m.get(k);
      m.set(k, { name: cur?.name ?? cityCase(u.city), n: (cur?.n ?? 0) + 1 });
    }
    for (const c of uniCities) {
      const k = placeKey(c);
      if (!m.has(k)) m.set(k, { name: c, n: 0 });
    }
    return [...m.entries()].sort((a, b) => b[1].n - a[1].n || a[1].name.localeCompare(b[1].name));
  }, [members, uniCities, country]);

  const key = placeKey(q);
  const shown = (key ? all.filter(([k]) => k.startsWith(key) || k.includes(' ' + key)) : all).slice(0, 100);
  const confirmTyped = () => {
    const k = placeKey(typed);
    const known = all.find(([x]) => x === k);
    onPick(known ? known[1].name : cityCase(typed));
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <Pressable onPress={() => {}} style={{ width: '100%', maxWidth: 520, height: '80%', backgroundColor: colors.surface, borderRadius: radius.hero, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
          <View style={{ padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Txt variant="h3" style={{ flex: 1 }}>{country ? `${d.city.title} — ${countryName(country)}` : d.city.title}</Txt>
              <IconButton icon="x" size={36} onPress={onClose} label={d.common.close} />
            </View>
            {!manual && <SearchBar value={q} onChangeText={setQ} placeholder={d.city.search} autoFocus />}
          </View>
          {manual ? (
            <View style={{ padding: 16, gap: 12 }}>
              <Input label={d.city.typeIt} icon="map-pin" value={typed} onChangeText={setTyped} autoFocus />
              {!!typed.trim() && <Txt variant="small" color="textSubtle">{`${d.city.willBe} « ${cityCase(typed)} »`}</Txt>}
              <Button label={d.common.confirm} icon="check" disabled={!typed.trim()} onPress={confirmTyped} />
              <Button label={d.uni.backToList} variant="ghost" icon="list" onPress={() => setManual(false)} />
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ padding: 8, paddingBottom: 16 }} keyboardShouldPersistTaps="handled">
              {shown.map(([k, c]) => (
                <Tap
                  key={k}
                  onPress={() => onPick(c.name)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, paddingHorizontal: 12, borderRadius: radius.input, backgroundColor: placeKey(value) === k ? colors.secondarySoft : 'transparent' }}
                  hoverStyle={{ backgroundColor: colors.surfaceAlt }}>
                  <Feather name="map-pin" size={14} color={colors.textSubtle} />
                  <Txt variant="bodyStrong" style={{ flex: 1, fontSize: 14 }}>{c.name}</Txt>
                  {c.n > 0 && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }} accessibilityLabel={d.city.members.replace('{n}', String(c.n))}>
                      <Feather name="users" size={12} color={colors.textSubtle} />
                      <Txt variant="small" color="textSubtle">{c.n}</Txt>
                    </View>
                  )}
                </Tap>
              ))}
              {!loading && shown.length === 0 && <Txt color="textMuted" align="center" style={{ margin: 24 }}>{d.city.none}</Txt>}
              <Tap onPress={() => { setTyped(q || value); setManual(true); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, marginTop: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
                <Feather name="edit-3" size={15} color={colors.primary} />
                <Txt variant="smallStrong" color="primary">{d.city.notListed}</Txt>
              </Tap>
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
