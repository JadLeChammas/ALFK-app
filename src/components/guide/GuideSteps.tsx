import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { View } from 'react-native';

import { Sheet } from '@/components/forms';
import { useDialogs } from '@/components/ui/Dialogs';
import { Button, Card, Chip, IconButton, Input, Row, Tap, type IconName } from '@/components/ui/primitives';
import { EnglishHint } from '@/components/ui/EnglishHint';
import { Txt } from '@/components/ui/Txt';
import { PHASES, type CountryGuide, type GuidePhase, type GuideStep } from '@/data/guide';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { openExternal } from '@/lib/links';

const PHASE_ICON: Record<GuidePhase, IconName> = { before: 'briefcase', arrival: 'map-pin', months: 'home', year: 'repeat' };

/**
 * The steps of a country guide, by phase. Members tick what they have done (`done`/`onToggle`);
 * admins (in the dashboard) add, edit, reorder and delete steps (`onChange`).
 */
export function GuideSteps({
  steps,
  done = [],
  onToggle,
  onChange,
}: {
  steps: GuideStep[];
  done?: string[];
  onToggle?: (id: string) => void;
  onChange?: (steps: GuideStep[]) => void;
}) {
  const { d, bi } = useI18n();
  const { colors } = useTheme();
  const { confirm } = useDialogs();
  const [editing, setEditing] = useState<GuideStep | null>(null);
  const editable = !!onChange;

  const move = (step: GuideStep, delta: -1 | 1) => {
    const same = steps.filter((s) => s.phase === step.phase);
    const other = same[same.findIndex((s) => s.id === step.id) + delta];
    if (!other || !onChange) return;
    const a = steps.indexOf(step);
    const b = steps.indexOf(other);
    const next = [...steps];
    [next[a], next[b]] = [next[b], next[a]];
    onChange(next);
  };
  const remove = async (step: GuideStep) => {
    if (onChange && (await confirm({ title: d.common.delete, message: step.title, danger: true, confirmLabel: d.common.delete }))) onChange(steps.filter((s) => s.id !== step.id));
  };

  return (
    <>
      {PHASES.map((phase) => {
        const list = steps.filter((s) => s.phase === phase);
        if (!list.length && !editable) return null;
        return (
          <View key={phase} style={{ gap: 12 }}>
            <Row gap={10}>
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' }}>
                <Feather name={PHASE_ICON[phase]} size={16} color="#fff" />
              </View>
              <Txt variant="h2" style={{ flex: 1 }}>{d.guide.phases[phase]}</Txt>
              {editable && <Button label={d.common.add} icon="plus" size="sm" variant="secondary" onPress={() => setEditing({ id: `g${Date.now().toString(36)}`, phase, title: '', body: '' })} />}
            </Row>
            {editable && !list.length && <Txt variant="small" color="textSubtle">{d.guide.phaseEmpty}</Txt>}
            {list.map((s, i) => {
              const checked = done.includes(s.id);
              return (
                <Card key={s.id} style={{ gap: 10, opacity: checked && !editable ? 0.75 : 1 }}>
                  <Row gap={12} style={{ alignItems: 'flex-start' }}>
                    {!editable && onToggle && (
                      <Tap
                        onPress={() => onToggle(s.id)}
                        accessibilityRole="checkbox"
                        aria-checked={checked}
                        accessibilityLabel={d.guide.markDone}
                        style={{ width: 28, height: 28, borderRadius: 8, marginTop: 1, borderWidth: 2, borderColor: checked ? colors.success : colors.borderStrong, backgroundColor: checked ? colors.success : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                        {checked && <Feather name="check" size={16} color="#fff" />}
                      </Tap>
                    )}
                    <View style={{ flex: 1, gap: 6 }}>
                      <Txt variant="h3" style={{ textDecorationLine: checked && !editable ? 'line-through' : 'none' }}>{`${i + 1}. ${bi(s.title, s.titleEn)}`}</Txt>
                      <Txt color="textMuted">{bi(s.body, s.bodyEn)}</Txt>
                      {!!s.url && (
                        <Row>
                          <Button label={bi(s.urlLabel, s.urlLabelEn) || d.guide.openLink} icon="external-link" size="sm" variant="secondary" onPress={() => openExternal(s.url!)} />
                        </Row>
                      )}
                    </View>
                  </Row>
                  {editable && (
                    <Row gap={6} style={{ justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 }}>
                      <IconButton icon="arrow-up" size={32} label={d.guide.up} onPress={() => move(s, -1)} />
                      <IconButton icon="arrow-down" size={32} label={d.guide.down} onPress={() => move(s, 1)} />
                      <IconButton icon="edit-2" size={32} label={d.common.edit} onPress={() => setEditing(s)} />
                      <IconButton icon="trash-2" size={32} label={d.common.delete} onPress={() => remove(s)} />
                    </Row>
                  )}
                </Card>
              );
            })}
          </View>
        );
      })}
      {editing && onChange && (
        <StepSheet
          step={editing}
          onClose={() => setEditing(null)}
          onSave={(s) => {
            onChange(steps.some((x) => x.id === s.id) ? steps.map((x) => (x.id === s.id ? s : x)) : [...steps, s]);
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

function StepSheet({ step, onClose, onSave }: { step: GuideStep; onClose: () => void; onSave: (s: GuideStep) => void }) {
  const { d } = useI18n();
  const [form, setForm] = useState({ ...step, url: step.url ?? '', urlLabel: step.urlLabel ?? '', titleEn: step.titleEn ?? '', bodyEn: step.bodyEn ?? '', urlLabelEn: step.urlLabelEn ?? '' });
  const set = (k: 'title' | 'body' | 'url' | 'urlLabel' | 'titleEn' | 'bodyEn' | 'urlLabelEn') => (v: string) => setForm((x) => ({ ...x, [k]: v }));
  const url = form.url.trim() && !/^https?:\/\//i.test(form.url.trim()) ? `https://${form.url.trim()}` : form.url.trim();
  return (
    <Sheet visible title={step.title ? d.guide.editStep : d.guide.newStep} onClose={onClose}>
      <View style={{ gap: 8 }}>
        <Txt variant="smallStrong" color="textMuted">{d.guide.phase}</Txt>
        <Row gap={8} wrap>
          {PHASES.map((p) => <Chip key={p} label={d.guide.phases[p]} active={form.phase === p} onPress={() => setForm((x) => ({ ...x, phase: p }))} />)}
        </Row>
      </View>
      <Input label={d.guide.stepTitle} value={form.title} onChangeText={set('title')} maxLength={120} />
      <Input label={d.guide.stepBody} value={form.body} onChangeText={set('body')} multiline maxLength={2000} />
      <EnglishHint />
      <Input label={`${d.guide.stepTitle} · English`} value={form.titleEn} onChangeText={set('titleEn')} maxLength={120} />
      <Input label={`${d.guide.stepBody} · English`} value={form.bodyEn} onChangeText={set('bodyEn')} multiline maxLength={2000} />
      <Input label={d.guide.stepUrl} icon="link" value={form.url} onChangeText={set('url')} autoCapitalize="none" keyboardType="url" placeholder="https://…" />
      {!!form.url.trim() && <Input label={d.guide.stepUrlLabel} value={form.urlLabel} onChangeText={set('urlLabel')} maxLength={60} />}
      {!!form.url.trim() && <Input label={`${d.guide.stepUrlLabel} · English`} value={form.urlLabelEn} onChangeText={set('urlLabelEn')} maxLength={60} />}
      <Button
        label={d.common.save}
        icon="check"
        full
        size="lg"
        disabled={!form.title.trim() || !form.body.trim()}
        onPress={() => onSave({ id: form.id, phase: form.phase, title: form.title.trim(), body: form.body.trim(), url: url || undefined, urlLabel: url ? form.urlLabel.trim() || undefined : undefined, titleEn: form.titleEn.trim() || undefined, bodyEn: form.bodyEn.trim() || undefined, urlLabelEn: url ? form.urlLabelEn.trim() || undefined : undefined })}
      />
    </Sheet>
  );
}

/** A guide's title: the admins' one, or « Guide — {country} » in the reader's language. */
export function useGuideTitle() {
  const { d, f, bi, country } = useI18n();
  return (g: CountryGuide) => bi(g.title, g.titleEn) || f(d.guide.titleFor, { country: country(g.country) });
}
