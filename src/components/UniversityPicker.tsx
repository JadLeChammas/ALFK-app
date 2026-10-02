import { Feather } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, View } from 'react-native';

import { sortedCountries } from '@/data/countries';
import { resolvePlace, usePlaceAliases } from '@/data/places';
import { matchesUniversity, matchRank, sameCity, useUniversities, type University } from '@/data/universities';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Flag } from './ui/Flag';
import { Button, IconButton, Input, SearchBar, Tap } from './ui/primitives';
import { Select } from './ui/Select';
import { Txt } from './ui/Txt';

const MAX_ROWS = 80;

/**
 * Pick a university from the list of the chosen country: the ones in the chosen city first, then the
 * rest of the country, filtered from the first letter (name or acronym). A school missing from the
 * list can still be typed in by hand.
 */
export function UniversityPicker({ label, value, onChange, country, city, optional, icon = 'book' }: { label: string; value: string; onChange: (v: string, country?: string) => void; country?: string; city?: string; optional?: boolean; icon?: 'book' | 'plus' }) {
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
        <Feather name={icon} size={16} color={colors.textSubtle} />
        <Txt numberOfLines={1} style={{ flex: 1, color: value ? colors.text : colors.textSubtle }}>{value || d.uni.pick}</Txt>
        <Feather name="chevron-down" size={16} color={colors.textSubtle} />
      </Tap>
      {open && <PickerSheet value={value} country={country} city={city} onClose={() => setOpen(false)} onPick={(v, cc) => { onChange(v, cc); setOpen(false); }} />}
    </View>
  );
}

function PickerSheet({ value, country: initialCountry, city, onClose, onPick }: { value: string; country?: string; city?: string; onClose: () => void; onPick: (v: string, country: string) => void }) {
  const { d, f, lang, country: countryName } = useI18n();
  const { colors } = useTheme();
  const aliases = usePlaceAliases();
  const [country, setCountry] = useState(initialCountry ?? 'FR');
  const [q, setQ] = useState('');
  const [manual, setManual] = useState(false);
  const [typed, setTyped] = useState(value);
  const { list, loading } = useUniversities(country);
  // The chosen city only applies to the country it was chosen in.
  const cityHere = country === initialCountry ? city : undefined;

  const { inCity, elsewhere } = useMemo(() => {
    const target = q.trim() ? resolvePlace(q, aliases) : '';
    const hits = list
      .filter((u) => matchesUniversity(u, q) || (target && resolvePlace(u.name, aliases) === target))
      // Same place as the typed acronym first (ESSEC, Sciences Po…), then by how well the name matches, then importance.
      .map((u) => ({ u, r: target && resolvePlace(u.name, aliases) === target ? -1 : matchRank(u, q) }))
      .sort((a, b) => a.r - b.r || a.u.rank - b.u.rank)
      .map((x) => x.u);
    const here = cityHere ? hits.filter((u) => sameCity(u.city, cityHere)) : [];
    const rest = hits.filter((u) => !here.includes(u));
    // Typing nothing in a big country: the city's schools are what matters most.
    return { inCity: here.slice(0, MAX_ROWS), elsewhere: rest.slice(0, Math.max(0, MAX_ROWS - here.length)) };
  }, [list, q, cityHere, aliases]);

  const row = (u: University) => {
    const active = u.name === value;
    return (
      <Tap
        key={`${u.name}|${u.city}`}
        onPress={() => onPick(u.name, country)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: radius.input, backgroundColor: active ? colors.secondarySoft : 'transparent' }}
        hoverStyle={{ backgroundColor: colors.surfaceAlt }}>
        <View style={{ flex: 1 }}>
          <Txt variant="bodyStrong" numberOfLines={2} style={{ fontSize: 14 }}>{u.name}</Txt>
          <Txt variant="small" color="textSubtle" numberOfLines={1}>{[u.acronyms[0], u.city].filter(Boolean).join(' · ')}</Txt>
        </View>
        {active && <Feather name="check" size={16} color={colors.primary} />}
      </Tap>
    );
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <Pressable onPress={() => {}} style={{ width: '100%', maxWidth: 560, height: '88%', backgroundColor: colors.surface, borderRadius: radius.hero, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
          <View style={{ padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Select
                  compact
                  value={country}
                  onChange={(c) => {
                    setCountry(c);
                    setQ('');
                  }}
                  searchable
                  options={sortedCountries(lang).map((c) => ({ value: c.code, label: c.name, leading: <Flag code={c.code} /> }))}
                />
              </View>
              <IconButton icon="x" size={36} onPress={onClose} label={d.common.close} />
            </View>
            {!manual && <SearchBar value={q} onChangeText={setQ} placeholder={d.uni.searchPlaceholder} autoFocus />}
          </View>

          {manual ? (
            <View style={{ padding: 16, gap: 12 }}>
              <Input label={d.uni.typeIt} icon="book" value={typed} onChangeText={setTyped} autoFocus />
              <Button label={d.common.confirm} icon="check" disabled={!typed.trim()} onPress={() => onPick(typed.trim(), country)} />
              <Button label={d.uni.backToList} variant="ghost" icon="list" onPress={() => setManual(false)} />
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ padding: 8, paddingBottom: 16 }} keyboardShouldPersistTaps="handled">
              {loading && <ActivityIndicator style={{ margin: 24 }} color={colors.primary} />}
              {!loading && inCity.length > 0 && (
                <>
                  <Txt variant="caption" style={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4 }}>{f(d.uni.inCity, { city: cityHere ?? '' })}</Txt>
                  {inCity.map(row)}
                </>
              )}
              {!loading && elsewhere.length > 0 && (
                <>
                  <Txt variant="caption" style={{ paddingHorizontal: 12, paddingTop: 12, paddingBottom: 4 }}>
                    {inCity.length ? f(d.uni.elsewhere, { country: countryName(country) }) : countryName(country)}
                  </Txt>
                  {elsewhere.map(row)}
                </>
              )}
              {!loading && !inCity.length && !elsewhere.length && <Txt color="textMuted" align="center" style={{ margin: 24 }}>{d.uni.none}</Txt>}
              <Tap onPress={() => { setTyped(q || value); setManual(true); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, marginTop: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
                <Feather name="edit-3" size={15} color={colors.primary} />
                <Txt variant="smallStrong" color="primary">{d.uni.notListed}</Txt>
              </Tap>
              <Txt variant="small" color="textSubtle" align="center" style={{ marginTop: 4 }}>{d.uni.source}</Txt>
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
