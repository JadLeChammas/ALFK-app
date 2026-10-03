import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Globe } from '@/components/fx/Globe';
import { Sheet } from '@/components/forms';
import { useDialogs } from '@/components/ui/Dialogs';
import { Avatar, Badge, Button, Card, Chip, EmptyState, Row, SearchBar, SectionHeader, Segmented, Tap } from '@/components/ui/primitives';
import { norm } from '@/components/shell/GlobalSearch';
import { PageHeader, Screen } from '@/components/ui/Screen';
import { Flag } from '@/components/ui/Flag';
import { Txt } from '@/components/ui/Txt';
import { WorldMap } from '@/components/fx/WorldMap';
import { CONTINENTS, COUNTRIES, countryByCode } from '@/data/countries';
import { groupByPlace, type PlaceAliases, usePlaceAliases } from '@/data/places';
import { fullName, useApprovedMembers, useMe, useStore } from '@/data/store';
import type { ContinentKey, User } from '@/data/types';
import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';
import { studyEntries, type StudyEntry } from '@/data/members';

export default function Repere() {
  const params = useLocalSearchParams<{ country?: string }>();
  const { d, f, country: countryOf } = useI18n();
  const { colors } = useTheme();
  const { isDesktop } = useLayout();
  const members = useApprovedMembers();
  const me = useMe();
  // Studies: where alumni study (or studied, when nothing says they work) — the LFK's current students are excluded.
  // Work: where those already working are, by company.
  const [mode, setMode] = useState<'studies' | 'work'>('studies');
  const place = (u: User) => (mode === 'work' ? u.employer : u.school);
  const graduates = members.filter((u) => u.role === 'alumni' || u.role === 'admin');
  const aliases = usePlaceAliases();
  // Exchange semesters and other universities count too, each in its own country.
  const alumni: StudyEntry<User>[] =
    mode === 'work'
      ? graduates.filter((u) => u.country && u.situation === 'working' && u.employer)
      : studyEntries(graduates, aliases).filter((e) => e.country && (e.extra || e.situation !== 'working'));

  const initialCountry = countryByCode(params.country);
  const [continent, setContinent] = useState<ContinentKey>(initialCountry?.continent ?? 'europe');
  const [country, setCountry] = useState<string | null>(initialCountry?.code ?? null);
  const [openSchool, setOpenSchool] = useState<string | null>(null);
  const [view, setView] = useState<'globe' | 'map'>('globe');

  /** Different people in a list (someone with an exchange in the same country counts once). */
  const people = (list?: User[]) => new Set((list ?? []).map((u) => u.id)).size;
  const perCountry = new Map<string, User[]>();
  for (const u of alumni) perCountry.set(u.country!, [...(perCountry.get(u.country!) ?? []), u]);

  const continentCounts = Object.fromEntries(
    CONTINENTS.map((c) => [c, people(COUNTRIES.filter((x) => x.continent === c).flatMap((x) => perCountry.get(x.code) ?? []))])
  ) as Record<ContinentKey, number>;
  const countries = COUNTRIES.filter((c) => c.continent === continent && perCountry.has(c.code)).sort((a, b) => people(perCountry.get(b.code)) - people(perCountry.get(a.code)));
  const activeCountry = country && countries.some((c) => c.code === country) ? country : countries[0]?.code ?? null;
  // Same place written differently (« ISEP », « Isep », full name…) = one entry (see data/places.ts).
  const universities = groupByPlace(perCountry.get(activeCountry ?? '') ?? [], place, aliases);
  const [merging, setMerging] = useState<{ key: string; label: string } | null>(null);

  const pickContinent = (c: ContinentKey) => {
    setContinent(c);
    setCountry(null);
    setOpenSchool(null);
  };
  const ac = countryByCode(activeCountry ?? undefined);
  const markers = COUNTRIES.filter((c) => perCountry.has(c.code) && c.code !== 'KW').map((c) => ({ key: c.code, ll: c.ll, weight: people(perCountry.get(c.code)), active: c.code === activeCountry, label: countryOf(c.code) }));

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
        <PickRow key={c.code} active={c.code === activeCountry} leading={<Flag code={c.code} />} label={countryOf(c.code)} count={people(perCountry.get(c.code))} onPress={() => { setCountry(c.code); setOpenSchool(null); }} />
      ))}
    </View>
  ) : (
    <Txt color="textMuted">{d.common.noResults}</Txt>
  );
  const universityList = (
    <View style={{ gap: 8 }}>
      {universities.map(({ key: school, label, items: list, spellings }, i) => {
        const open = openSchool === school;
        return (
          <View key={school} style={{ borderRadius: 16, borderWidth: 1, borderColor: open ? colors.primary : colors.border, backgroundColor: colors.surface, overflow: 'hidden' }}>
            <Tap onPress={() => setOpenSchool(open ? null : school)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }} hoverStyle={{ backgroundColor: colors.surfaceAlt }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: i === 0 ? colors.primary : colors.secondarySoft, alignItems: 'center', justifyContent: 'center' }}>
                <Txt variant="smallStrong" style={{ color: i === 0 ? colors.onPrimary : colors.secondaryStrong }}>{i + 1}</Txt>
              </View>
              <View style={{ flex: 1 }}>
                <Txt variant="bodyStrong" numberOfLines={1}>{label}</Txt>
                <Txt variant="small" color="textMuted">{f(d.common.alumniCount, { n: people(list) })}</Txt>
              </View>
              <Row gap={0}>
                {list.slice(0, 3).map((u, j) => (
                  <View key={`${u.id}-${j}`} style={{ marginLeft: j ? -8 : 0 }}>
                    <Avatar uri={u.avatar} name={fullName(u)} size={26} ring />
                  </View>
                ))}
              </Row>
              <Feather name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSubtle} />
            </Tap>
            {open && (
              <View style={{ paddingHorizontal: 14, paddingBottom: 14, gap: 10 }}>
                {spellings.size > 1 && (
                  <Txt variant="small" color="textSubtle">{f(d.repere.alsoWritten, { list: [...spellings.keys()].filter((x) => x !== label).join(', ') })}</Txt>
                )}
                {me.role === 'admin' && (
                  <Button label={d.repere.merge} icon="git-merge" size="sm" variant="secondary" onPress={() => setMerging({ key: school, label })} />
                )}
                {list.map((u: StudyEntry<User>) => (
                  <Tap key={`${u.id}-${u.school}`} onPress={() => router.push(`/membre/${u.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Avatar uri={u.avatar} name={fullName(u)} size={30} />
                    <View style={{ flex: 1 }}>
                      <Txt variant="smallStrong">{fullName(u)}</Txt>
                      {mode === 'work' && u.jobTitle && <Txt variant="small" color="textSubtle">{u.jobTitle}</Txt>}
                    </View>
                    {u.exchange && <Badge label={d.schools.exchange} tone="secondary" icon="repeat" />}
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
      <PageHeader
        title={d.repere.title}
        subtitle={d.repere.subtitle}
        right={
          <Segmented
            value={mode}
            onChange={(m) => {
              setMode(m);
              setCountry(null);
              setOpenSchool(null);
            }}
            options={[
              { value: 'studies', label: d.situation.studies, icon: 'book-open' },
              { value: 'work', label: d.situation.work, icon: 'briefcase' },
            ]}
          />
        }
      />

      <Card>
        <Row gap={10} style={{ justifyContent: 'space-between', marginBottom: 16 }} wrap>
          <Row gap={8} style={{ flexShrink: 1 }}>
            {ac ? <Flag code={ac.code} /> : <Feather name="map" size={16} color={colors.secondaryStrong} />}
            <Txt variant="h3" numberOfLines={1} style={{ flexShrink: 1 }}>{view === 'globe' && ac ? countryOf(ac.code) : d.continents[continent]}</Txt>
            <Txt color="textSubtle">· {f(d.common.alumniCount, { n: view === 'globe' && ac ? people(perCountry.get(ac.code)) : continentCounts[continent] })}</Txt>
          </Row>
          <Segmented
            value={view}
            onChange={setView}
            options={[
              { value: 'globe', label: d.repere.viewGlobe, icon: 'globe' },
              { value: 'map', label: d.repere.viewMap, icon: 'map' },
            ]}
          />
        </Row>
        {view === 'globe' ? (
          <Globe markers={markers} focus={ac?.ll ?? null} autoRotate={!ac} maxSize={isDesktop ? 520 : 380} />
        ) : (
          <WorldMap arcs={COUNTRIES.filter((c) => perCountry.has(c.code) && c.code !== 'KW').map((c) => ({ key: c.code, to: c.ll, active: c.code === activeCountry, label: countryOf(c.code) }))} />
        )}
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
            <SectionHeader title={ac ? f(mode === 'work' ? d.situation.companiesIn : d.repere.universitiesIn, { country: countryOf(ac.code) }) : mode === 'work' ? d.situation.companies : d.repere.universities} icon={mode === 'work' ? 'briefcase' : 'book'} count={f(mode === 'work' ? d.situation.companiesCount : d.repere.universitiesCount, { n: universities.length })} />
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
                <Chip key={c.code} leading={<Flag code={c.code} size={12} />} label={countryOf(c.code)} count={people(perCountry.get(c.code))} active={c.code === activeCountry} onPress={() => { setCountry(c.code); setOpenSchool(null); }} />
              ))}
            </ScrollView>
          </View>
          <View style={{ gap: 10 }}>
            <Txt variant="caption">3 · {ac ? f(mode === 'work' ? d.situation.companiesIn : d.repere.universitiesIn, { country: countryOf(ac.code) }) : mode === 'work' ? d.situation.companies : d.repere.universities}</Txt>
            {universityList}
          </View>
        </View>
      )}
      {merging && (
        <MergeSheet
          from={merging}
          groups={groupByPlace(alumni, place, aliases).map((g) => ({ key: g.key, label: g.label, n: g.items.length }))}
          aliases={aliases}
          onClose={() => setMerging(null)}
        />
      )}
    </Screen>
  );
}

/** Admins: say that a university / company is the same as another one (one entry instead of two). */
function MergeSheet({ from, groups, aliases, onClose }: { from: { key: string; label: string }; groups: { key: string; label: string; n: number }[]; aliases: PlaceAliases; onClose: () => void }) {
  const { d, f } = useI18n();
  const { colors } = useTheme();
  const { actions } = useStore();
  const { toast } = useDialogs();
  const [q, setQ] = useState('');
  const others = groups.filter((g) => g.key !== from.key && (!q.trim() || norm(g.label).includes(norm(q.trim()))));
  // Spellings already merged into this one (admin merges only), so they can be separated again.
  const mergedHere = Object.entries(aliases).filter(([, to]) => to === from.key).map(([k]) => k);
  return (
    <Sheet visible title={f(d.repere.mergeTitle, { name: from.label })} onClose={onClose}>
      <Txt color="textMuted">{d.repere.mergeSub}</Txt>
      <SearchBar value={q} onChangeText={setQ} placeholder={d.common.search} />
      <View style={{ gap: 6 }}>
        {others.slice(0, 30).map((g) => (
          <Tap
            key={g.key}
            onPress={() => {
              actions.mergePlace(from.key, g.key);
              toast(d.repere.merged);
              onClose();
            }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.border }}
            hoverStyle={{ backgroundColor: colors.surfaceAlt }}>
            <Feather name="git-merge" size={15} color={colors.secondary} />
            <Txt variant="bodyStrong" numberOfLines={1} style={{ flex: 1, fontSize: 14 }}>{g.label}</Txt>
            <Txt variant="small" color="textSubtle">{g.n}</Txt>
          </Tap>
        ))}
        {others.length === 0 && <Txt color="textMuted">{d.common.noResults}</Txt>}
      </View>
      {mergedHere.length > 0 && (
        <View style={{ gap: 8 }}>
          <Txt variant="caption">{d.repere.mergedHere}</Txt>
          {mergedHere.map((k) => (
            <Row key={k} gap={10}>
              <Txt style={{ flex: 1 }} numberOfLines={1}>{k}</Txt>
              <Button label={d.repere.unmerge} size="sm" variant="secondary" onPress={() => actions.mergePlace(k, null)} />
            </Row>
          ))}
        </View>
      )}
    </Sheet>
  );
}

function PickRow({ label, count, active, onPress, leading, disabled }: { label: string; count: number; active: boolean; onPress: () => void; leading?: React.ReactNode; disabled?: boolean }) {
  const { colors } = useTheme();
  return (
    <Tap
      onPress={onPress}
      disabled={disabled}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, height: 44, borderRadius: 12, backgroundColor: active ? colors.secondarySoft : 'transparent', opacity: disabled ? 0.4 : 1, borderLeftWidth: 3, borderLeftColor: active ? colors.primary : 'transparent' }}
      hoverStyle={!active && { backgroundColor: colors.surfaceAlt }}>
      {leading}
      <Txt variant="bodyStrong" numberOfLines={1} style={{ flex: 1, fontSize: 14, color: active ? colors.navy : colors.text }}>{label}</Txt>
      <Txt variant="smallStrong" style={{ color: active ? colors.navy : colors.textSubtle }}>{count}</Txt>
      {active && <Feather name="chevron-right" size={15} color={colors.primary} />}
    </Tap>
  );
}
