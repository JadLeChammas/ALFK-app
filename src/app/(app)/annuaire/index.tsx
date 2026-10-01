import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { MemberCard } from '@/components/cards';
import { norm } from '@/components/shell/GlobalSearch';
import { Button, Chip, EmptyState, Row, SearchBar } from '@/components/ui/primitives';
import { Grid, PageHeader, Screen } from '@/components/ui/Screen';
import { Select } from '@/components/ui/Select';
import { Flag } from '@/components/ui/Flag';
import { Txt } from '@/components/ui/Txt';
import { COUNTRIES, countrySearchText } from '@/data/countries';
import { groupByPlace, resolvePlace, usePlaceAliases } from '@/data/places';
import { fullName, useApprovedMembers, useMe } from '@/data/store';
import type { User, Situation } from '@/data/types';
import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';

const PREVIEW = 8;

export default function Directory() {
  const { d, f, country: countryOf } = useI18n();
  const { colors } = useTheme();
  const { isMobile } = useLayout();
  const me = useMe();
  const members = useApprovedMembers();
  const [q, setQ] = useState('');
  const [promo, setPromo] = useState<number | 'all'>('all');
  const [country, setCountry] = useState<string>('all');
  const [school, setSchool] = useState<string>('all');
  const [situation, setSituation] = useState<Situation | 'all'>('all');

  const years = useMemo(() => [...new Set(members.map((u) => u.promo).filter(Boolean) as number[])].sort((a, b) => b - a), [members]);
  const aliases = usePlaceAliases();
  const schools = useMemo(() => groupByPlace(members, (u) => u.school, aliases).sort((a, b) => a.label.localeCompare(b.label)), [members, aliases]);
  const countries = useMemo(() => COUNTRIES.filter((c) => members.some((u) => u.country === c.code)), [members]);

  const filtered = useMemo(() => {
    const n = norm(q.trim());
    return members.filter((u) => {
      if (promo !== 'all' && u.promo !== promo) return false;
      if (country !== 'all' && u.country !== country) return false;
      if (school !== 'all' && resolvePlace(u.school, aliases) !== school) return false;
      if (situation !== 'all' && u.situation !== situation) return false;
      if (!n) return true;
      const hay = norm(`${fullName(u)} ${u.promo ?? ''} ${u.country ? countrySearchText(u.country) : ''} ${u.school ?? ''} ${u.employer ?? ''} ${u.jobTitle ?? ''} ${u.city ?? ''}`);
      return n.split(/\s+/).every((t) => hay.includes(t));
    });
  }, [members, q, promo, country, school, situation, aliases]);

  const isFiltering = !!q.trim() || promo !== 'all' || country !== 'all' || school !== 'all' || situation !== 'all';
  const byPromo = useMemo(() => {
    const map = new Map<number, User[]>();
    for (const u of filtered) if (u.promo) map.set(u.promo, [...(map.get(u.promo) ?? []), u]);
    return [...map.entries()].sort((a, b) => b[0] - a[0]);
  }, [filtered]);
  const honorary = filtered.filter((u) => !u.promo);

  const reset = () => {
    setQ('');
    setPromo('all');
    setCountry('all');
    setSchool('all');
    setSituation('all');
  };

  return (
    <Screen>
      <PageHeader title={d.directory.title} subtitle={d.directory.subtitle} />

      <View style={{ gap: 14 }}>
        <SearchBar value={q} onChangeText={setQ} placeholder={d.directory.searchPlaceholder} style={{ height: 52 }} />
        <Row gap={10} wrap>
          <Feather name="sliders" size={16} color={colors.textMuted} />
          <Select compact value={promo} onChange={setPromo} placeholder={d.directory.filterPromo} searchable options={[{ value: 'all' as const, label: d.directory.allPromos }, ...years.map((y) => ({ value: y, label: f(d.common.promo, { year: y }) }))]} />
          <Select compact value={country} onChange={setCountry} placeholder={d.directory.filterCountry} searchable options={[{ value: 'all', label: d.directory.allCountries }, ...countries.map((c) => ({ value: c.code, label: countryOf(c.code), leading: <Flag code={c.code} /> }))]} />
          <Select compact value={school} onChange={setSchool} placeholder={d.directory.filterSchool} searchable options={[{ value: 'all', label: `${d.common.all} — ${d.directory.filterSchool}` }, ...schools.map((g) => ({ value: g.key, label: g.label }))]} />
          <Select
            compact
            value={situation}
            onChange={setSituation}
            placeholder={d.situation.label}
            options={[
              { value: 'all' as const, label: `${d.common.all} — ${d.situation.label}` },
              { value: 'student' as const, label: d.situation.students },
              { value: 'working' as const, label: d.situation.workers },
            ]}
          />
          {isFiltering && <Button label={d.common.cancel} variant="ghost" size="sm" icon="x" onPress={reset} />}
        </Row>
      </View>

      {!isFiltering && (
        <View style={{ gap: 10 }}>
          <Txt variant="caption">{d.directory.jumpTo}</Txt>
          <View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 40 }}>
              {years.map((y) => (
                <Chip key={y} label={String(y)} active={y === me.promo} onPress={() => router.push(`/annuaire/promo/${y}`)} count={members.filter((u) => u.promo === y).length} />
              ))}
            </ScrollView>
            {/* fade at the right edge: more years scroll into view */}
            <LinearGradient colors={[`${colors.bg}00`, colors.bg]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} pointerEvents="none" style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 48 }} />
          </View>
        </View>
      )}

      {isFiltering && <Txt variant="smallStrong" color="textMuted">{f(d.directory.results, { n: filtered.length })}</Txt>}

      {filtered.length === 0 && <EmptyState icon="search" title={d.common.noResults} action={<Button label={d.common.cancel} variant="secondary" onPress={reset} />} />}

      {isFiltering && filtered.length > 0 && filtered.length <= 24 ? (
        <Grid min={isMobile ? 150 : 190} gap={isMobile ? 12 : 16}>
          {filtered.map((u) => <MemberCard key={u.id} user={u} showPromo />)}
        </Grid>
      ) : (
        <>
          {byPromo.map(([year, list]) => (
            <View key={year} style={{ gap: 16 }}>
              <PromoHeader year={year} count={list.length} mine={year === me.promo} />
              <Grid min={isMobile ? 150 : 190} gap={isMobile ? 12 : 16}>
                {list.slice(0, isFiltering ? list.length : PREVIEW).map((u) => <MemberCard key={u.id} user={u} />)}
              </Grid>
            </View>
          ))}
          {honorary.length > 0 && (
            <View style={{ gap: 16 }}>
              <Row gap={10}>
                <Feather name="award" size={18} color={colors.warning} />
                <Txt variant="h2">{d.directory.honorary}</Txt>
                <Txt color="textSubtle">{f(d.common.members, { n: honorary.length })}</Txt>
              </Row>
              <Grid min={isMobile ? 150 : 190} gap={isMobile ? 12 : 16}>
                {honorary.map((u) => <MemberCard key={u.id} user={u} />)}
              </Grid>
            </View>
          )}
        </>
      )}
    </Screen>
  );
}

function PromoHeader({ year, count, mine }: { year: number; count: number; mine: boolean }) {
  const { d, f } = useI18n();
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', columnGap: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
      <Row gap={10} wrap style={{ paddingTop: 12, flexShrink: 1 }}>
        <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: mine ? colors.primary : colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
          <Feather name="award" size={17} color={mine ? colors.onPrimary : colors.primary} />
        </View>
        <Txt variant="h2">{f(d.common.promo, { year })}</Txt>
        <Txt color="textSubtle">— {f(count > 1 ? d.common.members : d.common.member, { n: count })}</Txt>
      </Row>
      <View style={{ paddingTop: 12 }}>
        <Button label={d.directory.seePromo} size="sm" variant="secondary" iconRight="arrow-right" onPress={() => router.push(`/annuaire/promo/${year}`)} />
      </View>
    </View>
  );
}
