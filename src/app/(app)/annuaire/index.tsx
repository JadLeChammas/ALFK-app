import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

import { MemberCard } from '@/components/cards';
import { norm } from '@/components/shell/GlobalSearch';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button, Chip, CountBadge, EmptyState, Row, SearchBar, Tap, type IconName } from '@/components/ui/primitives';
import { Grid, PageHeader, Screen } from '@/components/ui/Screen';
import { Select, type Option } from '@/components/ui/Select';
import { Flag } from '@/components/ui/Flag';
import { Txt } from '@/components/ui/Txt';
import { COUNTRIES, countrySearchText } from '@/data/countries';
import { groupByPlace, resolvePlace, usePlaceAliases } from '@/data/places';
import { fullName, useApprovedMembers, useMe } from '@/data/store';
import type { User, Situation } from '@/data/types';
import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { eggs, isFutureWord, isLebaneseWord, isRetroWord, isSandWord, legendQuery } from '@/lib/eggs';
import { LegendCard } from '@/components/EasterEggs';

const PREVIEW = 8;
const byName = (a: User, b: User) => a.lastName.localeCompare(b.lastName, 'fr', { sensitivity: 'base' }) || a.firstName.localeCompare(b.firstName, 'fr', { sensitivity: 'base' });

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
  const [sheet, setSheet] = useState(false);

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
      const hay = norm(`${fullName(u)} ${u.promo ?? ''} ${u.country ? countrySearchText(u.country) : ''} ${u.school ?? ''} ${(u.otherSchools ?? []).map((s) => s.name).join(' ')} ${u.employer ?? ''} ${u.jobTitle ?? ''} ${u.city ?? ''}`);
      return n.split(/\s+/).every((t) => hay.includes(t));
    });
  }, [members, q, promo, country, school, situation, aliases]);

  const activeCount = [promo !== 'all', country !== 'all', school !== 'all', situation !== 'all'].filter(Boolean).length;
  const isFiltering = !!q.trim() || activeCount > 0;
  const icon = (name: IconName) => <Feather name={name} size={14} color={colors.textMuted} />;
  // « All » shows the short field name with its icon, so the closed pills stay one word long.
  const promoOptions: Option<number | 'all'>[] = [
    { value: 'all', label: d.directory.allPromos, short: d.directory.filterPromo, leading: icon('award') },
    ...years.map((y) => ({ value: y, label: f(d.common.promo, { year: y }), short: String(y), leading: icon('award') })),
  ];
  const countryOptions: Option<string>[] = [
    { value: 'all', label: d.directory.allCountries, short: d.directory.filterCountry, leading: icon('globe') },
    ...countries.map((c) => ({ value: c.code, label: countryOf(c.code), leading: <Flag code={c.code} /> })),
  ];
  const schoolOptions: Option<string>[] = [
    { value: 'all', label: `${d.common.all} — ${d.directory.filterSchool}`, short: d.directory.filterSchool, leading: icon('book-open') },
    ...schools.map((g) => ({ value: g.key, label: g.label, leading: icon('book-open') })),
  ];
  const situations: { value: Situation | 'all'; label: string; icon: IconName }[] = [
    { value: 'all', label: d.common.all, icon: 'users' },
    { value: 'student', label: d.situation.students, icon: 'book' },
    { value: 'working', label: d.situation.workers, icon: 'briefcase' },
  ];
  const situationOptions: Option<Situation | 'all'>[] = situations.map((x) => ({
    value: x.value,
    label: x.value === 'all' ? `${d.common.all} — ${d.situation.label}` : x.label,
    short: x.value === 'all' ? d.situation.label : undefined,
    leading: icon(x.icon),
  }));
  // Active filters as removable tokens (phone).
  const tokens: { key: string; label: string; leading: ReactNode; clear: () => void }[] = [];
  if (promo !== 'all') tokens.push({ key: 'promo', label: f(d.common.promo, { year: promo }), leading: icon('award'), clear: () => setPromo('all') });
  if (country !== 'all') tokens.push({ key: 'country', label: countryOf(country), leading: <Flag code={country} />, clear: () => setCountry('all') });
  if (school !== 'all') tokens.push({ key: 'school', label: schools.find((g) => g.key === school)?.label ?? school, leading: icon('book-open'), clear: () => setSchool('all') });
  if (situation !== 'all') tokens.push({ key: 'situation', label: situations.find((x) => x.value === situation)?.label ?? '', leading: icon(situation === 'student' ? 'book' : 'briefcase'), clear: () => setSituation('all') });
  const byPromo = useMemo(() => {
    const map = new Map<number, User[]>();
    for (const u of filtered) if (u.promo) map.set(u.promo, [...(map.get(u.promo) ?? []), u]);
    // Within each promo: alphabetical (last name, then first name).
    for (const list of map.values()) list.sort(byName);
    return [...map.entries()].sort((a, b) => b[0] - a[0]);
  }, [filtered]);
  const honorary = filtered.filter((u) => !u.promo);

  const clearFilters = () => {
    setPromo('all');
    setCountry('all');
    setSchool('all');
    setSituation('all');
  };
  const reset = () => {
    setQ('');
    setPromo('all');
    setCountry('all');
    setSchool('all');
    setSituation('all');
  };

  useEffect(() => {
    if (isSandWord(q)) eggs.emit('sandstorm');
    if (isFutureWord(q)) eggs.emit('future');
    if (isLebaneseWord(q)) eggs.emit('lebanon');
    if (isRetroWord(q)) eggs.emit('retro');
  }, [q]);

  return (
    <Screen>
      <PageHeader title={d.directory.title} subtitle={d.directory.subtitle} />

      <View style={{ gap: 12 }}>
        {isMobile ? (
          <>
            {/* Phone: search + one filter button; the filters open in a bottom sheet. */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <SearchBar value={q} onChangeText={setQ} placeholder={d.directory.searchPlaceholder} style={{ height: 52, flex: 1 }} />
              <Tap
                onPress={() => setSheet(true)}
                accessibilityLabel={d.directory.filters}
                style={{ width: 52, height: 52, borderRadius: radius.input, alignItems: 'center', justifyContent: 'center', backgroundColor: activeCount ? colors.ink : colors.surface, borderWidth: 1, borderColor: activeCount ? colors.ink : colors.border }}>
                <Feather name="sliders" size={19} color={activeCount ? colors.onInk : colors.text} />
                {activeCount > 0 && <CountBadge n={activeCount} style={{ position: 'absolute', top: -6, right: -6, borderColor: colors.bg }} />}
              </Tap>
            </View>
            {tokens.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, alignItems: 'center' }}>
                {tokens.map((t) => (
                  <Tap
                    key={t.key}
                    onPress={t.clear}
                    accessibilityLabel={`${d.common.cancel} ${t.label}`}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 32, paddingLeft: 10, paddingRight: 8, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
                    {t.leading}
                    <Txt variant="smallStrong" numberOfLines={1} style={{ maxWidth: 160 }}>{t.label}</Txt>
                    <Feather name="x" size={14} color={colors.textSubtle} />
                  </Tap>
                ))}
                <Tap onPress={clearFilters} style={{ height: 32, justifyContent: 'center', paddingHorizontal: 6 }}>
                  <Txt variant="smallStrong" color="primary">{d.directory.clearAll}</Txt>
                </Tap>
              </ScrollView>
            )}
          </>
        ) : (
          <>
            <SearchBar value={q} onChangeText={setQ} placeholder={d.directory.searchPlaceholder} style={{ height: 52 }} />
            <Row gap={10} wrap>
              <Select compact value={promo} onChange={setPromo} placeholder={d.directory.filterPromo} searchable options={promoOptions} />
              <Select compact value={country} onChange={setCountry} placeholder={d.directory.filterCountry} searchable options={countryOptions} />
              <Select compact value={school} onChange={setSchool} placeholder={d.directory.filterSchool} searchable options={schoolOptions} />
              <Select compact value={situation} onChange={setSituation} placeholder={d.situation.label} options={situationOptions} />
              {isFiltering && <Button label={d.directory.clearAll} variant="ghost" size="sm" icon="x" onPress={reset} />}
            </Row>
          </>
        )}
        {legendQuery(q) && <LegendCard legend={legendQuery(q)!} onOpen={(href) => router.push(href as never)} />}
      </View>

      <BottomSheet
        visible={sheet}
        onClose={() => setSheet(false)}
        title={d.directory.filters}
        description={f(d.directory.results, { n: filtered.length })}
        headerRight={activeCount > 0 ? <Button label={d.directory.clearAll} variant="ghost" size="sm" onPress={clearFilters} /> : undefined}
        footer={<Button full label={f(d.directory.showResults, { n: filtered.length })} onPress={() => setSheet(false)} />}>
        <FilterSection icon="activity" label={d.situation.label}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {situations.map((x) => (
              <Chip key={x.value} label={x.label} icon={x.icon} active={situation === x.value} onPress={() => setSituation(x.value)} />
            ))}
          </View>
        </FilterSection>
        <FilterSection icon="award" label={d.directory.filterPromo}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            <Chip label={d.common.all} active={promo === 'all'} onPress={() => setPromo('all')} />
            {years.map((y) => (
              <Chip key={y} label={String(y)} active={promo === y} onPress={() => setPromo(y)} count={members.filter((u) => u.promo === y).length} />
            ))}
          </ScrollView>
        </FilterSection>
        <FilterSection icon="globe" label={d.directory.filterCountry}>
          <Select value={country} onChange={setCountry} placeholder={d.directory.filterCountry} searchable options={countryOptions} />
        </FilterSection>
        <FilterSection icon="book-open" label={d.directory.filterSchool}>
          <Select value={school} onChange={setSchool} placeholder={d.directory.filterSchool} searchable options={schoolOptions} />
        </FilterSection>
      </BottomSheet>

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
              {/* Only the first ones are shown here: a clear button to the whole promo. */}
              {!isFiltering && list.length > PREVIEW && (
                <Button
                  label={f(d.directory.moreMembers, { n: list.length })}
                  iconRight="arrow-right"
                  onPress={() => router.push(`/annuaire/promo/${year}`)}
                  style={{ alignSelf: isMobile ? 'stretch' : 'center' }}
                />
              )}
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

function FilterSection({ icon, label, children }: { icon: IconName; label: string; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 10 }}>
      <Row gap={8}>
        <Feather name={icon} size={15} color={colors.textMuted} />
        <Txt variant="smallStrong" color="textMuted" style={{ textTransform: 'uppercase', letterSpacing: 0.8, fontSize: 11 }}>{label}</Txt>
      </Row>
      {children}
    </View>
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
        <Button label={d.directory.seePromo} size="sm" iconRight="arrow-right" onPress={() => router.push(`/annuaire/promo/${year}`)} />
      </View>
    </View>
  );
}
