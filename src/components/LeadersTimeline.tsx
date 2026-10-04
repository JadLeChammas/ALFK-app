import { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';

import { useDialogs } from '@/components/ui/Dialogs';
import { Avatar, Badge, Button, FieldRow, IconButton, Input, Row, SectionHeader, Segmented, Tap } from '@/components/ui/primitives';
import { Txt } from '@/components/ui/Txt';
import { useStore } from '@/data/store';
import { LEADER_KINDS, useSchoolLeaders, type LeaderKind, type SchoolLeader } from '@/data/schoolLeaders';
import { useI18n } from '@/i18n';
import { pickImages } from '@/lib/media';
import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

/**
 * A timeline of round portraits — the lycée's proviseurs or the primary school's directors — from
 * the first to the one in office, like a gallery of former heads. Admins add, edit and delete people.
 */
export function LeadersTimeline({ kind, editable, title }: { kind: LeaderKind; editable?: boolean; title?: string }) {
  const { d } = useI18n();
  const l = d.leaders;
  const { colors } = useTheme();
  const { isMobile } = useLayout();
  const { all, byKind } = useSchoolLeaders();
  const { actions } = useStore();
  const { confirm } = useDialogs();
  const list = byKind(kind);
  const [form, setForm] = useState<SchoolLeader | 'new' | null>(null);
  if (!list.length && !editable) return null;

  const size = isMobile ? 84 : 112;
  const years = (x: SchoolLeader) => (x.from && x.to ? `${x.from} – ${x.to}` : x.from ? `${l.since} ${x.from}` : x.to ? `– ${x.to}` : '');
  const save = (next: SchoolLeader[]) => actions.saveSchoolLeaders(next);

  return (
    <View style={{ gap: 16 }}>
      <SectionHeader title={title ?? l.titles[kind]} icon={kind === 'proviseur' ? 'award' : kind === 'cpe' ? 'users' : 'book-open'} count={String(list.length)} action={editable ? l.add : undefined} onAction={editable ? () => setForm('new') : undefined} />
      {list.length === 0 ? (
        <Txt variant="small" color="textSubtle">{l.empty}</Txt>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 8, paddingHorizontal: 4 }}>
          <View>
            {/* The line joining the portraits, at their middle. */}
            <View style={{ position: 'absolute', left: size / 2, right: size / 2, top: 8 + size / 2, height: 2, backgroundColor: colors.border }} />
            <Row gap={isMobile ? 16 : 28} style={{ alignItems: 'flex-start' }}>
              {list.map((x) => {
                // No end year = in office now (even when the start year is unknown).
                const current = !x.to;
                return (
                  <View key={x.id} style={{ width: size + 76, alignItems: 'center', gap: 8 }}>
                    <View style={{ padding: 3, borderRadius: size, backgroundColor: current ? colors.primary : colors.bg, borderWidth: current ? 0 : 2, borderColor: colors.border }}>
                      <Avatar uri={x.photo} name={x.name} size={size} />
                    </View>
                    <Txt variant="small" color="textSubtle" style={{ fontVariant: ['tabular-nums'] }}>{years(x)}</Txt>
                    <Txt variant="bodyStrong" align="center" numberOfLines={2}>{x.name}</Txt>
                    {!!x.description && <Txt variant="small" color="textMuted" align="center">{x.description}</Txt>}
                    {current && <Badge label={l.current} tone="secondary" />}
                    {editable && (
                      <Row gap={4}>
                        <IconButton icon="edit-2" size={30} label={d.common.edit} onPress={() => setForm(x)} />
                        <IconButton
                          icon="trash-2"
                          size={30}
                          label={d.common.delete}
                          onPress={async () => {
                            if (await confirm({ title: d.common.delete, message: x.name, danger: true, confirmLabel: d.common.delete })) save(all.filter((y) => y.id !== x.id));
                          }}
                        />
                      </Row>
                    )}
                  </View>
                );
              })}
            </Row>
          </View>
        </ScrollView>
      )}
      {form && (
        <LeaderForm
          initial={form === 'new' ? { id: '', kind, name: '' } : form}
          onClose={() => setForm(null)}
          onSave={(entry) => {
            const x = entry.id ? entry : { ...entry, id: `lead-${Date.now().toString(36)}` };
            save(all.some((y) => y.id === x.id) ? all.map((y) => (y.id === x.id ? x : y)) : [...all, x]);
            setForm(null);
          }}
        />
      )}
    </View>
  );
}

function LeaderForm({ initial, onClose, onSave }: { initial: SchoolLeader; onClose: () => void; onSave: (x: SchoolLeader) => void }) {
  const { d } = useI18n();
  const l = d.leaders;
  const { colors } = useTheme();
  const { actions } = useStore();
  const { toast } = useDialogs();
  const [x, setX] = useState(initial);
  const [from, setFrom] = useState(initial.from ? String(initial.from) : '');
  const [to, setTo] = useState(initial.to ? String(initial.to) : '');
  const [uploading, setUploading] = useState(false);
  const year = (v: string) => {
    const n = parseInt(v, 10);
    return n >= 1900 && n <= 2100 ? n : undefined;
  };

  const pickPhoto = async () => {
    const [img] = await pickImages(false);
    if (!img) return;
    setUploading(true);
    try {
      const photo = await actions.uploadImage(img, 'leaders');
      setX((v) => ({ ...v, photo }));
    } catch {
      toast(d.auth.errors.unknown, 'danger');
    }
    setUploading(false);
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <Pressable onPress={() => {}} style={{ width: '100%', maxWidth: 480, backgroundColor: colors.surface, borderRadius: radius.hero, borderWidth: 1, borderColor: colors.border, padding: 20, gap: 14 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt variant="h2">{initial.name ? l.edit : l.add}</Txt>
            <IconButton icon="x" onPress={onClose} size={36} />
          </Row>
          <Row gap={14}>
            <Tap onPress={pickPhoto} accessibilityLabel={l.photo}>
              <Avatar uri={x.photo} name={x.name || '?'} size={72} />
            </Tap>
            <Button label={x.photo ? l.changePhoto : l.photo} icon="image" variant="secondary" size="sm" onPress={pickPhoto} loading={uploading} />
          </Row>
          <Segmented value={x.kind} onChange={(kind) => setX((v) => ({ ...v, kind }))} options={LEADER_KINDS.map((k) => ({ value: k, label: l.kinds[k] }))} />
          <Input label={l.name} value={x.name} onChangeText={(name) => setX((v) => ({ ...v, name }))} />
          <Input label={`${l.description} (${d.common.optional})`} value={x.description ?? ''} onChangeText={(description) => setX((v) => ({ ...v, description }))} multiline maxLength={400} placeholder={l.descriptionPlaceholder} />
          <FieldRow>
            <Input label={l.from} value={from} onChangeText={setFrom} keyboardType="number-pad" maxLength={4} placeholder="1990" containerStyle={{ flex: 1 }} />
            <Input label={l.to} value={to} onChangeText={setTo} keyboardType="number-pad" maxLength={4} placeholder={l.toPlaceholder} containerStyle={{ flex: 1 }} />
          </FieldRow>
          <Button label={d.common.save} icon="check" full disabled={!x.name.trim() || uploading} onPress={() => onSave({ ...x, name: x.name.trim(), description: x.description?.trim() || undefined, from: year(from), to: year(to) })} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
