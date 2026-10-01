import { useState } from 'react';
import { View } from 'react-native';

import { AdminNav } from '@/components/AdminNav';
import { useDialogs } from '@/components/ui/Dialogs';
import { Button, Card, Chip, IconButton, Input, Row, SectionHeader } from '@/components/ui/primitives';
import { PageHeader, Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { DEFAULT_CREDITS, useCreditsConfig, type CreditLine, type CreditSection, type CreditsConfig } from '@/data/credits';
import { useStore } from '@/data/store';
import { useI18n } from '@/i18n';
import { previewCredits } from '@/lib/eggs';
import { useTheme } from '@/theme/ThemeProvider';

const id = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/** Admins: edit the end credits that roll when someone clicks the © (easter egg). */
export default function CreditsEditor() {
  const { d } = useI18n();
  const g = d.credits;
  const { colors } = useTheme();
  const { actions } = useStore();
  const { confirm, toast } = useDialogs();
  const { config, custom } = useCreditsConfig();
  const [draft, setDraft] = useState<CreditsConfig>(config);

  const setSection = (sid: string, patch: Partial<CreditSection>) => setDraft((c) => ({ ...c, sections: c.sections.map((s) => (s.id === sid ? { ...s, ...patch } : s)) }));
  const setLine = (sid: string, lid: string, patch: Partial<CreditLine>) =>
    setDraft((c) => ({ ...c, sections: c.sections.map((s) => (s.id === sid ? { ...s, lines: s.lines.map((l) => (l.id === lid ? { ...l, ...patch } : l)) } : s)) }));
  const moveSection = (i: number, delta: -1 | 1) =>
    setDraft((c) => {
      const j = i + delta;
      if (j < 0 || j >= c.sections.length) return c;
      const sections = [...c.sections];
      [sections[i], sections[j]] = [sections[j], sections[i]];
      return { ...c, sections };
    });
  const clean = (c: CreditsConfig): CreditsConfig => ({
    ...c,
    title: c.title?.trim() || undefined,
    thanks: c.thanks?.trim() || undefined,
    closing: c.closing?.trim() || undefined,
    sections: c.sections.map((s) => ({ ...s, heading: s.heading.trim(), lines: s.lines.filter((l) => l.name.trim()).map((l) => ({ ...l, name: l.name.trim(), role: l.role?.trim() || undefined })) })),
  });

  return (
    <Screen maxWidth={900}>
      <PageHeader
        title={g.title}
        subtitle={g.subtitle}
        right={
          <Row gap={8} wrap>
            <Button label={g.preview} icon="play" variant="secondary" onPress={() => previewCredits(clean(draft))} />
            <Button
              label={d.common.save}
              icon="check"
              onPress={() => {
                const c = clean(draft);
                setDraft(c);
                actions.saveCredits(c);
                toast(d.common.saved);
              }}
            />
          </Row>
        }
      />
      <AdminNav />

      <Card style={{ gap: 14 }}>
        <SectionHeader title={g.general} icon="film" />
        <Input label={g.filmTitle} value={draft.title ?? ''} onChangeText={(v) => setDraft((c) => ({ ...c, title: v }))} placeholder={d.eggs.creditsTitle} maxLength={120} />
        <Row gap={8} wrap>
          <Chip label={g.showBureau} icon={draft.showBureau ? 'check' : undefined} active={draft.showBureau} onPress={() => setDraft((c) => ({ ...c, showBureau: !c.showBureau }))} />
          <Chip label={g.showMembers} icon={draft.showMembers ? 'check' : undefined} active={draft.showMembers} onPress={() => setDraft((c) => ({ ...c, showMembers: !c.showMembers }))} />
        </Row>
        <Txt variant="small" color="textSubtle">{g.bureauHint}</Txt>
      </Card>

      {draft.sections.map((s, i) => (
        <Card key={s.id} style={{ gap: 12 }}>
          <Row gap={6}>
            <View style={{ flex: 1 }}>
              <Input label={g.sectionHeading} value={s.heading} onChangeText={(v) => setSection(s.id, { heading: v })} placeholder={g.sectionPlaceholder} maxLength={60} />
            </View>
            <IconButton icon="arrow-up" size={34} label={d.guide.up} onPress={() => moveSection(i, -1)} />
            <IconButton icon="arrow-down" size={34} label={d.guide.down} onPress={() => moveSection(i, 1)} />
            <IconButton
              icon="trash-2"
              size={34}
              label={d.common.delete}
              onPress={async () => {
                if (await confirm({ title: g.deleteSection, message: s.heading, danger: true, confirmLabel: d.common.delete })) setDraft((c) => ({ ...c, sections: c.sections.filter((x) => x.id !== s.id) }));
              }}
            />
          </Row>
          {s.lines.map((l) => (
            <Row key={l.id} gap={8} style={{ alignItems: 'flex-end', paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
              <Input label={g.name} value={l.name} onChangeText={(v) => setLine(s.id, l.id, { name: v })} containerStyle={{ flex: 1 }} maxLength={80} />
              <Input label={g.role} value={l.role ?? ''} onChangeText={(v) => setLine(s.id, l.id, { role: v })} containerStyle={{ flex: 1 }} maxLength={80} />
              <IconButton icon="x" size={34} label={d.common.delete} onPress={() => setSection(s.id, { lines: s.lines.filter((x) => x.id !== l.id) })} />
            </Row>
          ))}
          <Row>
            <Button label={g.addLine} icon="plus" size="sm" variant="secondary" onPress={() => setSection(s.id, { lines: [...s.lines, { id: id('l'), name: '' }] })} />
          </Row>
        </Card>
      ))}
      <Button label={g.addSection} icon="plus" variant="secondary" onPress={() => setDraft((c) => ({ ...c, sections: [...c.sections, { id: id('s'), heading: '', lines: [{ id: id('l'), name: '' }] }] }))} />

      <Card style={{ gap: 14 }}>
        <SectionHeader title={g.ending} icon="star" />
        <Input label={g.thanks} value={draft.thanks ?? ''} onChangeText={(v) => setDraft((c) => ({ ...c, thanks: v }))} placeholder={d.eggs.creditsThanks} maxLength={160} />
        <Input label={g.closing} value={draft.closing ?? ''} onChangeText={(v) => setDraft((c) => ({ ...c, closing: v }))} placeholder={d.eggs.creditsCamel} maxLength={160} />
        <Txt variant="small" color="textSubtle">{g.emptyHint}</Txt>
      </Card>

      {custom && (
        <Button
          label={g.reset}
          icon="rotate-ccw"
          variant="ghost"
          onPress={async () => {
            if (await confirm({ title: g.reset, message: g.resetConfirm, danger: true, confirmLabel: g.reset })) {
              actions.saveCredits(null);
              setDraft(DEFAULT_CREDITS);
            }
          }}
        />
      )}
    </Screen>
  );
}
