import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AdminNav } from '@/components/AdminNav';
import { EventFormModal, PublicationFormModal } from '@/components/forms';
import { useDialogs } from '@/components/ui/Dialogs';
import { Avatar, Badge, Button, Card, EmptyState, IconButton, Row, SectionHeader, Tap } from '@/components/ui/primitives';
import { Columns, Grid, PageHeader, Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { fullName, useStore, useUserMap } from '@/data/store';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

export default function Content() {
  const { d, f, formatDate, relative } = useI18n();
  const { colors } = useTheme();
  const { db, actions } = useStore();
  const { confirm } = useDialogs();
  const users = useUserMap();
  const [newEvent, setNewEvent] = useState(false);
  const [newPub, setNewPub] = useState(false);
  const reports = db.conversations.filter((c) => c.report && !c.report.resolved);
  const events = [...db.events].sort((a, b) => (a.date < b.date ? 1 : -1));
  const pubs = [...db.publications].sort((a, b) => (a.date < b.date ? 1 : -1));
  const photos = [...db.photos].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 12);

  const del = async (title: string, run: () => void) => {
    if (await confirm({ title: d.common.delete, message: title, danger: true, confirmLabel: d.common.delete })) run();
  };

  return (
    <Screen>
      <PageHeader title={d.admin.content} subtitle={d.admin.contentSub} />
      <AdminNav />

      <Card style={reports.length ? { borderColor: colors.danger } : undefined}>
        <SectionHeader title={d.admin.reports} icon="flag" count={String(reports.length)} />
        {reports.length === 0 && <Txt color="textMuted">{d.admin.noReports}</Txt>}
        <View style={{ gap: 12 }}>
          {reports.map((c) => (
            <Row key={c.id} gap={12} wrap style={{ padding: 14, borderRadius: 16, backgroundColor: colors.dangerSoft }}>
              <Row gap={0}>
                {c.members.map((m, i) => (
                  <View key={m} style={{ marginLeft: i ? -10 : 0 }}>
                    <Avatar uri={users.get(m)?.avatar} name={fullName(users.get(m))} size={38} ring />
                  </View>
                ))}
              </Row>
              <View style={{ flex: 1, minWidth: 180, gap: 2 }}>
                <Txt variant="bodyStrong">{c.members.map((m) => fullName(users.get(m))).join(' ↔ ')}</Txt>
                <Txt variant="small" color="textMuted">« {c.report!.reason} » · {f(d.admin.reportedBy, { name: fullName(users.get(c.report!.by)) })} · {relative(c.report!.at)}</Txt>
              </View>
              <Button label={d.admin.openConversation} icon="eye" size="sm" variant="secondary" onPress={() => router.push(`/messages/${c.id}`)} />
            </Row>
          ))}
        </View>
      </Card>

      <Columns
        asideWidth={420}
        main={
          <Card>
            <SectionHeader title={d.nav.events} icon="calendar" count={String(events.length)} />
            <Button label={d.events.create} icon="plus" size="sm" variant="soft" onPress={() => setNewEvent(true)} style={{ marginBottom: 12 }} />
            {events.map((e, i) => (
              <Row key={e.id} gap={12} style={{ paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderTopColor: colors.border }}>
                <Tap onPress={() => router.push(`/evenements/${e.id}`)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Image source={{ uri: e.cover }} style={{ width: 48, height: 48, borderRadius: 12 }} contentFit="cover" />
                  <View style={{ flex: 1 }}>
                    <Txt variant="bodyStrong" numberOfLines={1} style={{ fontSize: 14 }}>{e.title}</Txt>
                    <Txt variant="small" color="textSubtle">{formatDate(e.date)} · {f(d.events.photos, { n: db.photos.filter((p) => p.eventId === e.id).length })}</Txt>
                  </View>
                </Tap>
                {new Date(e.date) >= new Date() && <Badge label={d.events.upcoming} tone="violet" />}
                <IconButton icon="trash-2" size={34} color={colors.danger} onPress={() => del(e.title, () => actions.deleteEvent(e.id))} label={d.events.deleteEvent} />
              </Row>
            ))}
          </Card>
        }
        aside={
          <>
            <Card>
              <SectionHeader title={d.nav.publications} icon="book-open" count={String(pubs.length)} />
              <Button label={d.publications.create} icon="edit-3" size="sm" variant="soft" onPress={() => setNewPub(true)} style={{ marginBottom: 12 }} />
              {pubs.map((p, i) => (
                <Row key={p.id} gap={12} style={{ paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderTopColor: colors.border }}>
                  <Tap onPress={() => router.push(`/publications/${p.id}`)} style={{ flex: 1 }}>
                    <Txt variant="bodyStrong" numberOfLines={1} style={{ fontSize: 14 }}>{p.title}</Txt>
                    <Txt variant="small" color="textSubtle">{d.publications.categories[p.category]} · {formatDate(p.date)}</Txt>
                  </Tap>
                  <IconButton icon="trash-2" size={34} color={colors.danger} onPress={() => del(p.title, () => actions.deletePublication(p.id))} />
                </Row>
              ))}
            </Card>
            <Card>
              <SectionHeader title={d.events.gallery} icon="image" />
              {photos.length === 0 ? (
                <EmptyState icon="image" title={d.common.noResults} />
              ) : (
                <Grid min={100} gap={8}>
                  {photos.map((p) => (
                    <View key={p.id} style={{ aspectRatio: 1, borderRadius: 12, overflow: 'hidden' }}>
                      <Image source={{ uri: p.uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                      <View style={{ position: 'absolute', top: 4, right: 4 }}>
                        <IconButton icon="trash-2" size={28} variant="overlay" onPress={() => del(d.events.deletePhoto, () => actions.deletePhoto(p.id))} />
                      </View>
                    </View>
                  ))}
                </Grid>
              )}
            </Card>
          </>
        }
      />
      <EventFormModal visible={newEvent} onClose={() => setNewEvent(false)} />
      <PublicationFormModal visible={newPub} onClose={() => setNewPub(false)} />
    </Screen>
  );
}
