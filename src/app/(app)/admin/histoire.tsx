import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AdminNav } from '@/components/AdminNav';
import { useDialogs } from '@/components/ui/Dialogs';
import { Button, Card, IconButton, Input, Row, SectionHeader } from '@/components/ui/primitives';
import { PageHeader, Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { useLfkStory, type FunFact, type LfkStory, type StoryEvent } from '@/data/lfkStory';
import { useStore } from '@/data/store';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

const newId = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/** Admins: the « Le LFK » page — introduction, fun facts and the history timeline. */
export default function AdminLfkStory() {
  const { d } = useI18n();
  const h = d.lfk;
  const { colors } = useTheme();
  const { actions } = useStore();
  const { confirm, toast } = useDialogs();
  const { story } = useLfkStory();
  const [draft, setDraft] = useState<LfkStory>(story);

  const setFact = (id: string, patch: Partial<FunFact>) => setDraft((s) => ({ ...s, facts: s.facts.map((f) => (f.id === id ? { ...f, ...patch } : f)) }));
  const setEvent = (id: string, patch: Partial<StoryEvent>) => setDraft((s) => ({ ...s, timeline: s.timeline.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));
  const moveFact = (i: number, delta: -1 | 1) =>
    setDraft((s) => {
      const j = i + delta;
      if (j < 0 || j >= s.facts.length) return s;
      const facts = [...s.facts];
      [facts[i], facts[j]] = [facts[j], facts[i]];
      return { ...s, facts };
    });
  const save = () => {
    const clean: LfkStory = {
      intro: draft.intro?.trim() || undefined,
      facts: draft.facts.filter((f) => f.text.trim()).map((f) => ({ ...f, emoji: f.emoji?.trim() || undefined, title: f.title?.trim() || undefined, text: f.text.trim() })),
      timeline: draft.timeline.filter((e) => e.year.trim() && e.title.trim()).map((e) => ({ ...e, year: e.year.trim(), title: e.title.trim(), text: e.text?.trim() || undefined })),
    };
    setDraft(clean);
    actions.saveLfkStory(clean);
    toast(d.common.saved);
  };

  return (
    <Screen maxWidth={900}>
      <PageHeader
        title={h.adminTitle}
        subtitle={h.adminSubtitle}
        right={
          <Row gap={8} wrap>
            <Button label={h.see} icon="external-link" variant="secondary" onPress={() => router.push('/histoire' as never)} />
            <Button label={d.common.save} icon="check" onPress={save} />
          </Row>
        }
      />
      <AdminNav />

      <Card style={{ gap: 12 }}>
        <SectionHeader title={h.introTitle} icon="align-left" />
        <Input label={h.intro} value={draft.intro ?? ''} onChangeText={(v) => setDraft((s) => ({ ...s, intro: v }))} placeholder={h.sub} multiline maxLength={500} />
      </Card>

      <Card style={{ gap: 12 }}>
        <SectionHeader title={h.factsTitle} icon="zap" />
        {draft.facts.length === 0 && <Txt variant="small" color="textSubtle">{h.factsEmpty}</Txt>}
        {draft.facts.map((f, i) => (
          <View key={f.id} style={{ gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
            <Row gap={8} style={{ alignItems: 'flex-end' }}>
              <Input label={h.emoji} value={f.emoji ?? ''} onChangeText={(v) => setFact(f.id, { emoji: v })} placeholder="🏫" maxLength={4} containerStyle={{ width: 84 }} />
              <Input label={h.factTitle} value={f.title ?? ''} onChangeText={(v) => setFact(f.id, { title: v })} maxLength={80} containerStyle={{ flex: 1 }} />
              <IconButton icon="arrow-up" size={34} label={d.guide.up} onPress={() => moveFact(i, -1)} />
              <IconButton icon="arrow-down" size={34} label={d.guide.down} onPress={() => moveFact(i, 1)} />
              <IconButton
                icon="trash-2"
                size={34}
                label={d.common.delete}
                onPress={async () => {
                  if (await confirm({ title: d.common.delete, message: f.title || f.text, danger: true, confirmLabel: d.common.delete })) setDraft((s) => ({ ...s, facts: s.facts.filter((x) => x.id !== f.id) }));
                }}
              />
            </Row>
            <Input label={h.factText} value={f.text} onChangeText={(v) => setFact(f.id, { text: v })} multiline maxLength={400} />
          </View>
        ))}
        <Row>
          <Button label={h.addFact} icon="plus" size="sm" variant="secondary" onPress={() => setDraft((s) => ({ ...s, facts: [...s.facts, { id: newId('f'), text: '' }] }))} />
        </Row>
      </Card>

      <Card style={{ gap: 12 }}>
        <SectionHeader title={h.timelineTitle} icon="clock" />
        <Txt variant="small" color="textSubtle">{h.timelineHint}</Txt>
        {draft.timeline.map((e) => (
          <View key={e.id} style={{ gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
            <Row gap={8} style={{ alignItems: 'flex-end' }}>
              <Input label={h.year} value={e.year} onChangeText={(v) => setEvent(e.id, { year: v })} placeholder="1975" maxLength={12} containerStyle={{ width: 110 }} />
              <Input label={h.eventTitle} value={e.title} onChangeText={(v) => setEvent(e.id, { title: v })} maxLength={100} containerStyle={{ flex: 1 }} />
              <IconButton
                icon="trash-2"
                size={34}
                label={d.common.delete}
                onPress={async () => {
                  if (await confirm({ title: d.common.delete, message: `${e.year} — ${e.title}`, danger: true, confirmLabel: d.common.delete })) setDraft((s) => ({ ...s, timeline: s.timeline.filter((x) => x.id !== e.id) }));
                }}
              />
            </Row>
            <Input label={h.eventText} value={e.text ?? ''} onChangeText={(v) => setEvent(e.id, { text: v })} multiline maxLength={800} />
          </View>
        ))}
        <Row>
          <Button label={h.addEvent} icon="plus" size="sm" variant="secondary" onPress={() => setDraft((s) => ({ ...s, timeline: [...s.timeline, { id: newId('e'), year: '', title: '' }] }))} />
        </Row>
      </Card>

      <Button label={d.common.save} icon="check" size="lg" full onPress={save} />
    </Screen>
  );
}
