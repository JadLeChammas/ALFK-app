import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { EventCard } from '@/components/cards';
import { EventFormModal } from '@/components/forms';
import { norm } from '@/components/shell/GlobalSearch';
import { Avatar, Badge, Button, Card, EmptyState, Row, SearchBar, SectionHeader, Segmented, Tap } from '@/components/ui/primitives';
import { Columns, Grid, PageHeader, Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { fullName, useMe, useStore, useUpcomingBirthdays } from '@/data/store';
import { useI18n } from '@/i18n';

export default function Events() {
  const { d, f, formatDate } = useI18n();
  const { db } = useStore();
  const me = useMe();
  const birthdays = useUpcomingBirthdays(30);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [q, setQ] = useState('');
  const [creating, setCreating] = useState(false);

  const list = useMemo(() => {
    const now = new Date().toISOString();
    const n = norm(q);
    return db.events
      .filter((e) => (tab === 'upcoming' ? e.date >= now : e.date < now))
      .filter((e) => !n || norm(`${e.title} ${e.location} ${e.description}`).includes(n))
      .sort((a, b) => (tab === 'upcoming' ? (a.date > b.date ? 1 : -1) : a.date < b.date ? 1 : -1));
  }, [db.events, tab, q]);

  return (
    <Screen>
      <PageHeader
        title={d.events.title}
        subtitle={d.events.subtitle}
        right={me.role === 'admin' && <Button label={d.events.create} icon="plus" onPress={() => setCreating(true)} />}
      />
      <Columns
        main={
          <>
            <Row gap={12} wrap>
              <Segmented value={tab} onChange={setTab} options={[{ value: 'upcoming', label: d.events.upcoming, icon: 'calendar' }, { value: 'past', label: d.events.past, icon: 'archive' }]} />
              <SearchBar value={q} onChangeText={setQ} placeholder={d.events.searchPlaceholder} style={{ flex: 1, minWidth: 220 }} />
            </Row>
            {list.length === 0 ? (
              <EmptyState icon="calendar" title={d.events.empty} />
            ) : (
              <Grid min={280} gap={16}>
                {list.map((e) => <EventCard key={e.id} event={e} />)}
              </Grid>
            )}
          </>
        }
        aside={
          <Card>
            <SectionHeader title={d.home.birthdays} icon="gift" />
            <View style={{ gap: 12 }}>
              {birthdays.map((b) => (
                <Tap key={b.user.id} onPress={() => router.push(`/membre/${b.user.id}`)} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                  <Avatar uri={b.user.avatar} name={fullName(b.user)} size={40} />
                  <View style={{ flex: 1 }}>
                    <Txt variant="smallStrong" numberOfLines={1}>{fullName(b.user)}{b.user.id === me.id ? ' 🎉' : ''}</Txt>
                    <Txt variant="small" color="textSubtle">{formatDate(b.date, { year: false })}</Txt>
                  </View>
                  <Badge label={b.inDays === 0 ? d.common.today : b.inDays === 1 ? d.common.tomorrow : f(d.common.inDays, { n: b.inDays })} tone={b.inDays <= 2 ? 'warning' : 'neutral'} />
                </Tap>
              ))}
              {birthdays.length === 0 && <Txt color="textMuted">—</Txt>}
            </View>
          </Card>
        }
      />
      <EventFormModal visible={creating} onClose={() => setCreating(false)} onCreated={(id) => router.push(`/evenements/${id}`)} />
    </Screen>
  );
}
