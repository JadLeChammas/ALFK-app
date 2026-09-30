import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Avatar, Badge, Card, Chip, EmptyState, Row, SectionHeader, Tap } from '@/components/ui/primitives';
import { PageHeader, Screen } from '@/components/ui/Screen';
import { Flag } from '@/components/ui/Flag';
import { Txt } from '@/components/ui/Txt';
import { WorldDots } from '@/components/ui/WorldDots';
import { CONTINENTS, COUNTRIES, countryByCode } from '@/data/countries';
import { fullName, useApprovedMembers } from '@/data/store';
import type { ContinentKey, User } from '@/data/types';
import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';

export default function Repere() {
  const params = useLocalSearchParams<{ country?: string }>();
  const { d, f, lang } = useI18n();
  const { colors } = useTheme();
  const { isDesktop } = useLayout();
  const members = useApprovedMembers();
  // Where alumni went to study: alumni & admins with a university on file (students are still at the LFK).
  const alumni = members.filter((u) => (u.role === 'alumni' || u.role === 'admin') && u.country && u.school);

  const initialCountry = countryByCode(params.country);
  const [continent, setContinent] = useState<ContinentKey>(initialCountry?.continent ?? 'europe');
  const [country, setCountry] = useState<string | null>(initialCountry?.code ?? null);
  const [openSchool, setOpenSchool] = useState<string | null>(null);

  const perCountry = new Map<string, User[]>();
  for (const u of alumni) perCountry.set(u.country!, [...(perCountry.get(u.country!) ?? []), u]);

  const continentCounts = Object.fromEntries(
    CONTINENTS.map((c) => [c, COUNTRIES.filter((x) => x.continent === c).reduce((a, x) => a + (perCountry.get(x.code)?.length ?? 0), 0)])
  ) as Record<ContinentKey, number>;
  const countries = COUNTRIES.filter((c) => c.continent === continent && perCountry.has(c.code)).sort((a, b) => perCountry.get(b.code)!.length - perCountry.get(a.code)!.length);
  const activeCountry = country && countries.some((c) => c.code === country) ? country : countries[0]?.code ?? null;
  const schoolMap = new Map<string, User[]>();
  for (const u of perCountry.get(activeCountry ?? '') ?? []) schoolMap.set(u.school!, [...(schoolMap.get(u.school!) ?? []), u]);
  const universities = [...schoolMap.entries()].sort((a, b) => b[1].length - a[1].length);

  const pins = COUNTRIES.filter((c) => perCountry.has(c.code)).map((c) => ({ col: c.pin[0], row: c.pin[1], count: perCountry.get(c.code)!.length, active: c.code === activeCountry }));
  const pickContinent = (c: ContinentKey) => {
    setContinent(c);
    setCountry(null);
    setOpenSchool(null);
  };
  const ac = countryByCode(activeCountry ?? undefined);

  const continentList = (
    <View style={{ gap: 6 }}>
      {CONTINENTS.map((c) => (
        <PickRow key={c} active={c === continent} label={d.continents[c]} count={continentCounts[c]} onPress={() => pickContinent(c)} disabled={!continentCounts[c]} />
      ))}
    </View>
  );
  const countryList = countries.length ? (
    <View style={{ gap: 6 }}>
      {countries.map((c) => (
        <PickRow key={c.code} active={c.code === activeCountry} leading={<Flag code={c.code} />} label={c[lang]} count={perCountry.get(c.code)!.length} onPress={() => { setCountry(c.code); setOpenSchool(null); }} />
      ))}
    </View>
  ) : (
    <Txt color="textMuted">{d.common.noResults}</Txt>
  );
  const universityList = (
    <View style={{ gap: 8 }}>
      {universities.map(([school, list], i) => {
        const open = openSchool === school;
        return (
          <View key={school} style={{ borderRadius: 16, borderWidth: 1, borderColor: open ? colors.primary : colors.border, backgroundColor: colors.surface, overflow: 'hidden' }}>
            <Tap onPress={() => setOpenSchool(open ? null : school)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }} hoverStyle={{ backgroundColor: colors.surfaceAlt }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: i === 0 ? colors.primary : colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                <Txt variant="smallStrong" style={{ color: i === 0 ? colors.onPrimary : colors.primary }}>{i + 1}</Txt>
              </View>
              <View style={{ flex: 1 }}>
                <Txt variant="bodyStrong" numberOfLines={1}>{school}</Txt>
                <Txt variant="small" color="textMuted">{f(d.common.alumniCount, { n: list.length })}</Txt>
              </View>
              <Row gap={0}>
                {list.slice(0, 3).map((u, j) => (
                  <View key={u.id} style={{ marginLeft: j ? -8 : 0 }}>
                    <Avatar uri={u.avatar} name={fullName(u)} size={26} ring />
                  </View>
                ))}
              </Row>
              <Feather name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSubtle} />
            </Tap>
            {open && (
              <View style={{ paddingHorizontal: 14, paddingBottom: 14, gap: 10 }}>
                {list.map((u) => (
                  <Tap key={u.id} onPress={() => router.push(`/membre/${u.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Avatar uri={u.avatar} name={fullName(u)} size={30} />
                    <Txt variant="smallStrong" style={{ flex: 1 }}>{fullName(u)}</Txt>
                    {u.promo && <Badge label={String(u.promo)} />}
                  </Tap>
                ))}
              </View>
            )}
          </View>
        );
      })}
      {universities.length === 0 && <EmptyState icon="map" title={d.repere.pickCountry} />}
    </View>
  );

  return (
    <Screen>
      <PageHeader title={d.repere.title} subtitle={d.repere.subtitle} />

      <Card>
        <Row gap={10} style={{ justifyContent: 'space-between', marginBottom: 16 }} wrap>
          <Row gap={8}>
            <Feather name="map" size={16} color={colors.primary} />
            <Txt variant="h3">{d.continents[continent]}</Txt>
            <Txt color="textSubtle">· {f(d.common.alumniCount, { n: continentCounts[continent] })}</Txt>
          </Row>
          <Txt variant="small" color="textSubtle">{d.repere.pickContinent}</Txt>
        </Row>
        <WorldDots selected={continent} onSelect={(c) => continentCounts[c] && pickContinent(c)} pins={pins} />
      </Card>

      {isDesktop ? (
        <View style={{ flexDirection: 'row', gap: 20, alignItems: 'flex-start' }}>
          <Card style={{ width: 260 }}>
            <SectionHeader title={d.repere.continent} icon="globe" />
            {continentList}
          </Card>
          <Card style={{ width: 280 }}>
            <SectionHeader title={d.repere.country} icon="flag" count={f(d.repere.countriesCount, { n: countries.length })} />
            {countryList}
          </Card>
          <Card style={{ flex: 1 }}>
            <SectionHeader title={ac ? f(d.repere.universitiesIn, { country: ac[lang] }) : d.repere.universities} icon="book" count={f(d.repere.universitiesCount, { n: universities.length })} />
            {universityList}
          </Card>
        </View>
      ) : (
        <View style={{ gap: 20 }}>
          <View style={{ gap: 10 }}>
            <Txt variant="caption">1 · {d.repere.continent}</Txt>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {CONTINENTS.filter((c) => continentCounts[c]).map((c) => (
                <Chip key={c} label={d.continents[c]} count={continentCounts[c]} active={c === continent} onPress={() => pickContinent(c)} />
              ))}
            </ScrollView>
          </View>
          <View style={{ gap: 10 }}>
            <Txt variant="caption">2 · {d.repere.country}</Txt>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {countries.map((c) => (
                <Chip key={c.code} leading={<Flag code={c.code} size={12} />} label={c[lang]} count={perCountry.get(c.code)!.length} active={c.code === activeCountry} onPress={() => { setCountry(c.code); setOpenSchool(null); }} />
              ))}
            </ScrollView>
          </View>
          <View style={{ gap: 10 }}>
            <Txt variant="caption">3 · {ac ? f(d.repere.universitiesIn, { country: ac[lang] }) : d.repere.universities}</Txt>
            {universityList}
          </View>
        </View>
      )}
    </Screen>
  );
}

function PickRow({ label, count, active, onPress, leading, disabled }: { label: string; count: number; active: boolean; onPress: () => void; leading?: React.ReactNode; disabled?: boolean }) {
  const { colors } = useTheme();
  return (
    <Tap
      onPress={onPress}
      disabled={disabled}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, height: 44, borderRadius: 12, backgroundColor: active ? colors.primarySoft : 'transparent', opacity: disabled ? 0.4 : 1 }}
      hoverStyle={!active && { backgroundColor: colors.surfaceAlt }}>
      {leading}
      <Txt variant="bodyStrong" numberOfLines={1} style={{ flex: 1, fontSize: 14, color: active ? colors.primary : colors.text }}>{label}</Txt>
      <Txt variant="smallStrong" style={{ color: active ? colors.primary : colors.textSubtle }}>{count}</Txt>
      {active && <Feather name="chevron-right" size={15} color={colors.primary} />}
    </Tap>
  );
}
