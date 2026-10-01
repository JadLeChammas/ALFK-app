import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, View } from 'react-native';

import { Sheet } from '@/components/forms';
import { useDialogs } from '@/components/ui/Dialogs';
import { Button, Card, Chip, IconButton, Input, Row, Tap, type IconName } from '@/components/ui/primitives';
import { PageHeader, Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { PHASES, useGuide, type GuidePhase, type GuideStep } from '@/data/guide';
import { useMe, useStore } from '@/data/store';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

const PHASE_ICON: Record<GuidePhase, IconName> = { before: 'briefcase', arrival: 'map-pin', months: 'home', year: 'repeat' };
const doneKey = (userId: string) => `lfk.guide.done.${userId}`;

/** « Arriver en France »: what to do before leaving and after arriving. Admins edit the content. */
export default function Guide() {
  const { d, f } = useI18n();
  const { colors } = useTheme();
  const { actions } = useStore();
  const { confirm, toast } = useDialogs();
  const me = useMe();
  const { steps, custom } = useGuide();
  const admin = me.role === 'admin';
  const [editMode, setEditMode] = useState(false);
  const [editing, setEditing] = useState<GuideStep | null>(null);
  // Each member's own progress, kept on the device.
  const [done, setDone] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(doneKey(me.id))
      .then((raw) => raw && setDone(JSON.parse(raw)))
      .catch(() => {});
  }, [me.id]);
  const toggle = (id: string) => {
    const next = done.includes(id) ? done.filter((x) => x !== id) : [...done, id];
    setDone(next);
    AsyncStorage.setItem(doneKey(me.id), JSON.stringify(next)).catch(() => {});
  };

  const save = (next: GuideStep[]) => {
    actions.saveGuide(next);
    toast(d.common.saved);
  };
  const move = (step: GuideStep, delta: -1 | 1) => {
    const same = steps.filter((s) => s.phase === step.phase);
    const i = same.findIndex((s) => s.id === step.id);
    const other = same[i + delta];
    if (!other) return;
    const a = steps.indexOf(step);
    const b = steps.indexOf(other);
    const next = [...steps];
    [next[a], next[b]] = [next[b], next[a]];
    save(next);
  };
  const remove = async (step: GuideStep) => {
    if (await confirm({ title: d.common.delete, message: step.title, danger: true, confirmLabel: d.common.delete })) save(steps.filter((s) => s.id !== step.id));
  };

  const total = steps.length;
  const doneCount = steps.filter((s) => done.includes(s.id)).length;

  return (
    <Screen maxWidth={900}>
      <PageHeader
        title={d.guide.title}
        subtitle={d.guide.subtitle}
        right={admin && <Button label={editMode ? d.guide.doneEditing : d.guide.edit} icon={editMode ? 'check' : 'edit-2'} variant={editMode ? 'primary' : 'secondary'} onPress={() => setEditMode(!editMode)} />}
      />

      <Card style={{ gap: 10 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt variant="bodyStrong">{d.guide.progress}</Txt>
          <Txt variant="smallStrong" color="primary">{f(d.guide.progressCount, { n: doneCount, total })}</Txt>
        </Row>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.surfaceAlt, overflow: 'hidden' }}>
          <View style={{ width: `${total ? (doneCount / total) * 100 : 0}%`, height: '100%', backgroundColor: colors.success }} />
        </View>
        <Txt variant="small" color="textSubtle">{d.guide.disclaimer}</Txt>
      </Card>

      {PHASES.map((phase) => {
        const list = steps.filter((s) => s.phase === phase);
        if (!list.length && !editMode) return null;
        return (
          <View key={phase} style={{ gap: 12 }}>
            <Row gap={10}>
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' }}>
                <Feather name={PHASE_ICON[phase]} size={16} color="#fff" />
              </View>
              <Txt variant="h2" style={{ flex: 1 }}>{d.guide.phases[phase]}</Txt>
              {editMode && <Button label={d.common.add} icon="plus" size="sm" variant="secondary" onPress={() => setEditing({ id: `g${Date.now().toString(36)}`, phase, title: '', body: '' })} />}
            </Row>
            {list.map((s, i) => {
              const checked = done.includes(s.id);
              return (
                <Card key={s.id} style={{ gap: 10, opacity: checked && !editMode ? 0.75 : 1 }}>
                  <Row gap={12} style={{ alignItems: 'flex-start' }}>
                    <Tap
                      onPress={() => toggle(s.id)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked }}
                      accessibilityLabel={d.guide.markDone}
                      style={{ width: 28, height: 28, borderRadius: 8, marginTop: 1, borderWidth: 2, borderColor: checked ? colors.success : colors.borderStrong, backgroundColor: checked ? colors.success : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                      {checked && <Feather name="check" size={16} color="#fff" />}
                    </Tap>
                    <View style={{ flex: 1, gap: 6 }}>
                      <Txt variant="h3" style={{ textDecorationLine: checked ? 'line-through' : 'none' }}>{`${i + 1}. ${s.title}`}</Txt>
                      <Txt color="textMuted">{s.body}</Txt>
                      {!!s.url && (
                        <Row>
                          <Button label={s.urlLabel || d.guide.openLink} icon="external-link" size="sm" variant="secondary" onPress={() => Linking.openURL(s.url!)} />
                        </Row>
                      )}
                    </View>
                  </Row>
                  {editMode && (
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

      <Card style={{ gap: 10 }}>
        <Txt variant="h3">{d.guide.helpTitle}</Txt>
        <Txt color="textMuted">{d.guide.helpSub}</Txt>
        <Row gap={8} wrap>
          <Button label={d.nav.questions} icon="help-circle" onPress={() => router.push('/questions')} />
          <Button label={d.nav.repere} icon="globe" variant="secondary" onPress={() => router.push('/repere?country=FR')} />
        </Row>
      </Card>

      {editMode && custom && (
        <Button
          label={d.guide.reset}
          icon="rotate-ccw"
          variant="ghost"
          onPress={async () => {
            if (await confirm({ title: d.guide.reset, message: d.guide.resetConfirm, danger: true, confirmLabel: d.guide.reset })) actions.saveGuide(null);
          }}
        />
      )}

      {editing && (
        <StepSheet
          step={editing}
          onClose={() => setEditing(null)}
          onSave={(s) => {
            save(steps.some((x) => x.id === s.id) ? steps.map((x) => (x.id === s.id ? s : x)) : [...steps, s]);
            setEditing(null);
          }}
        />
      )}
    </Screen>
  );
}

function StepSheet({ step, onClose, onSave }: { step: GuideStep; onClose: () => void; onSave: (s: GuideStep) => void }) {
  const { d } = useI18n();
  const [form, setForm] = useState({ ...step, url: step.url ?? '', urlLabel: step.urlLabel ?? '' });
  const set = (k: 'title' | 'body' | 'url' | 'urlLabel') => (v: string) => setForm((x) => ({ ...x, [k]: v }));
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
      <Input label={d.guide.stepUrl} icon="link" value={form.url} onChangeText={set('url')} autoCapitalize="none" keyboardType="url" placeholder="https://…" />
      {!!form.url.trim() && <Input label={d.guide.stepUrlLabel} value={form.urlLabel} onChangeText={set('urlLabel')} maxLength={60} placeholder="France-Visas" />}
      <Button
        label={d.common.save}
        icon="check"
        full
        size="lg"
        disabled={!form.title.trim() || !form.body.trim()}
        onPress={() => onSave({ id: form.id, phase: form.phase, title: form.title.trim(), body: form.body.trim(), url: url || undefined, urlLabel: url ? form.urlLabel.trim() || undefined : undefined })}
      />
    </Sheet>
  );
}
