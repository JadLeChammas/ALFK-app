import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { useStartConversation } from '@/components/cards';
import { Avatar, Badge, Button, Card, Chip, EmptyState, Row, SearchBar, Switch, Tap } from '@/components/ui/primitives';
import { Flag } from '@/components/ui/Flag';
import { Grid, PageHeader, Screen } from '@/components/ui/Screen';
import { Select } from '@/components/ui/Select';
import { Txt } from '@/components/ui/Txt';
import { fieldKey, fieldLabel, FIELDS, userFields, type FieldKey } from '@/data/fields';
import { groupByPlace, resolvePlace, usePlaceAliases } from '@/data/places';
import { canMessage } from '@/data/permissions';
import { fullName, useApprovedMembers, useMe } from '@/data/store';
import type { User } from '@/data/types';
import { useI18n } from '@/i18n';
import { norm } from '@/components/shell/GlobalSearch';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Orientation space for lycée students (2nde, 1re, Terminale): find former students
 * by field of study, institution or country, and ask them about their studies.
 */
export default function Orientation() {
  const { d, f, country: countryOf } = useI18n();
  const { colors } = useTheme();
  const me = useMe();
  const graduates = useApprovedMembers().filter((u) => (u.role === 'alumni' || u.role === 'admin') && u.school);
  const [field, setField] = useState<FieldKey | 'all'>('all');
  const [country, setCountry] = useState<string>('all');
  const [q, setQ] = useState('');
  const [mentorsOnly, setMentorsOnly] = useState(false);
  const [schoolKey, setSchoolKey] = useState<string | null>(null);
  const aliases = usePlaceAliases();

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const u of graduates) for (const k of new Set(userFields(u).map(fieldKey))) m.set(k, (m.get(k) ?? 0) + 1);
    return m;
  }, [graduates]);
  const countries = [...new Set(graduates.map((u) => u.country).filter(Boolean) as string[])].sort((a, b) => countryOf(a).localeCompare(countryOf(b)));

  const n = norm(q.trim());
  const list = graduates
    .filter((u) => field === 'all' || userFields(u).some((f) => fieldKey(f) === field))
    .filter((u) => country === 'all' || u.country === country)
    .filter((u) => !mentorsOnly || u.mentor)
    .filter((u) => !schoolKey || resolvePlace(u.school, aliases) === schoolKey)
    .filter((u) => !n || norm(`${u.school} ${u.city ?? ''} ${fullName(u)}`).includes(n))
    .sort((a, b) => Number(!!b.mentor) - Number(!!a.mentor) || (b.promo ?? 0) - (a.promo ?? 0));

  // Institutions most represented in the current selection.
  const schools = groupByPlace(list, (u) => u.school, aliases).slice(0, 8);

  return (
    <Screen>
      <PageHeader title={d.orientation.title} subtitle={d.orientation.subtitle} />

      {(me.role === 'alumni' || me.role === 'admin') && userFields(me).length === 0 && (
        <Row gap={12} wrap style={{ padding: 16, borderRadius: 18, backgroundColor: colors.primarySoft }}>
          <Feather name="compass" size={18} color={colors.primary} />
          <Txt variant="smallStrong" style={{ flex: 1, minWidth: 200 }}>{d.orientation.becomeMentor}</Txt>
          <Button label={d.profile.edit} size="sm" onPress={() => router.push('/profil/modifier')} />
        </Row>
      )}

      <View style={{ gap: 14 }}>
        <SearchBar value={q} onChangeText={setQ} placeholder={d.orientation.searchPlaceholder} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <Chip label={d.common.all} active={field === 'all'} onPress={() => setField('all')} count={graduates.length} />
          {FIELDS.filter((k) => counts.get(k)).map((k) => (
            <Chip key={k} label={d.fields[k]} active={field === k} onPress={() => setField(k)} count={counts.get(k)} />
          ))}
        </ScrollView>
        <Row gap={12} wrap>
          <View style={{ minWidth: 220, flex: 1, maxWidth: 320 }}>
            <Select
              compact
              value={country}
              onChange={setCountry}
              searchable
              options={[{ value: 'all', label: d.directory.allCountries }, ...countries.map((c) => ({ value: c, label: countryOf(c), leading: <Flag code={c} /> }))]}
            />
          </View>
          <Row gap={10}>
            <Switch value={mentorsOnly} onValueChange={setMentorsOnly} />
            <Txt variant="smallStrong">{d.orientation.mentorsOnly}</Txt>
          </Row>
        </Row>
      </View>

      {schools.length > 0 && (
        <View style={{ gap: 10 }}>
          <Txt variant="caption">{d.orientation.institutions}</Txt>
          <Row gap={8} wrap>
            {schools.map((g) => (
              <Chip key={g.key} label={g.label} count={g.items.length} active={schoolKey === g.key} onPress={() => setSchoolKey(schoolKey === g.key ? null : g.key)} />
            ))}
          </Row>
        </View>
      )}

      <Txt variant="smallStrong" color="textMuted">{f(d.orientation.results, { n: list.length })}</Txt>
      {list.length === 0 ? (
        <EmptyState icon="compass" title={d.common.noResults} />
      ) : (
        <Grid min={290} gap={16}>
          {list.map((u) => (
            <GraduateCard key={u.id} user={u} />
          ))}
        </Grid>
      )}
    </Screen>
  );
}

function GraduateCard({ user }: { user: User }) {
  const { d, f, country } = useI18n();
  const { colors } = useTheme();
  const me = useMe();
  const start = useStartConversation();
  return (
    <Card style={{ gap: 12, height: '100%' }}>
      <Tap onPress={() => router.push(`/membre/${user.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Avatar uri={user.avatar} name={fullName(user)} size={52} />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="h3" numberOfLines={1}>{fullName(user)}</Txt>
          {user.promo && <Txt variant="small" color="textSubtle">{f(d.common.promo, { year: user.promo })}</Txt>}
        </View>
      </Tap>
      <Row gap={6} wrap>
        {userFields(user).map((f) => <Badge key={f} label={fieldLabel(f, d.fields)} tone="primary" />)}
        {!!user.specialty && <Badge label={user.specialty} tone="neutral" icon="target" />}
        {user.mentor && <Badge label={d.orientation.mentor} tone="success" icon="compass" />}
      </Row>
      <View style={{ gap: 6 }}>
        <Row gap={8}>
          <Feather name="book" size={14} color={colors.textSubtle} />
          <Txt variant="small" color="textMuted" numberOfLines={2} style={{ flex: 1 }}>{user.school}</Txt>
        </Row>
        {user.country && (
          <Row gap={8}>
            <Flag code={user.country} size={11} />
            <Txt variant="small" color="textMuted" numberOfLines={1} style={{ flex: 1 }}>{[user.city, country(user.country)].filter(Boolean).join(', ')}</Txt>
          </Row>
        )}
      </View>
      <View style={{ flex: 1 }} />
      {user.id === me.id ? (
        <Badge label={d.common.you} tone="primary" style={{ alignSelf: 'center' }} />
      ) : canMessage(me, user) && <Button label={d.orientation.ask} icon="message-circle" size="sm" variant={user.mentor ? 'primary' : 'soft'} onPress={() => start(user.id)} />}
    </Card>
  );
}
