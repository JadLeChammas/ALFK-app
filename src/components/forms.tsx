import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';

import type { EventCategory, PublicationCategory } from '@/data/types';
import { can } from '@/data/permissions';
import { useStore } from '@/data/store';
import { IMAGES } from '@/data/seed';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { useDialogs } from './ui/Dialogs';
import { FieldRow, Button, Chip, IconButton, Input, Row } from './ui/primitives';
import { Txt } from './ui/Txt';

export function Sheet({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <Pressable onPress={() => {}} style={{ width: '100%', maxWidth: 560, maxHeight: '90%', backgroundColor: colors.surface, borderRadius: radius.hero, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
          <Row style={{ justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Txt variant="h2">{title}</Txt>
            <IconButton icon="x" onPress={onClose} size={36} />
          </Row>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const pad = (n: number) => String(n).padStart(2, '0');

export function EventFormModal({ visible, onClose, onCreated }: { visible: boolean; onClose: () => void; onCreated?: (id: string) => void }) {
  const { d } = useI18n();
  const { actions } = useStore();
  const { toast } = useDialogs();
  const [soon] = useState(() => new Date(Date.now() + 14 * 86_400_000));
  const blank = { title: '', description: '', date: `${soon.getFullYear()}-${pad(soon.getMonth() + 1)}-${pad(soon.getDate())}`, time: '19:00', location: '', cover: IMAGES.party, category: 'soiree' as EventCategory };
  const [form, setForm] = useState(blank);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const date = new Date(`${form.date}T${form.time}:00`);
  const valid = form.title && form.location && !Number.isNaN(date.getTime());

  return (
    <Sheet visible={visible} title={d.events.create} onClose={onClose}>
      <Input label={d.events.titleField} value={form.title} onChangeText={set('title')} />
      <FieldRow>
        <Input label={d.events.dateField} value={form.date} onChangeText={set('date')} containerStyle={{ flex: 1 }} />
        <Input label={d.events.timeField} value={form.time} onChangeText={set('time')} containerStyle={{ minWidth: 120 }} />
      </FieldRow>
      <Input label={d.events.locationField} icon="map-pin" value={form.location} onChangeText={set('location')} />
      <View style={{ gap: 8 }}>
        <Txt variant="smallStrong" color="textMuted">{d.events.category}</Txt>
        <Row gap={8} wrap>
          {(Object.keys(d.events.categories) as EventCategory[]).map((c) => (
            <Chip key={c} label={d.events.categories[c]} active={form.category === c} onPress={() => setForm((f) => ({ ...f, category: c }))} />
          ))}
        </Row>
      </View>
      <Input label={d.events.coverField} icon="image" value={form.cover} onChangeText={set('cover')} autoCapitalize="none" />
      <Input label={d.events.descriptionField} value={form.description} onChangeText={set('description')} multiline />
      <Button
        label={d.common.create}
        full
        size="lg"
        disabled={!valid}
        onPress={() => {
          const id = actions.createEvent({ title: form.title, description: form.description, date: date.toISOString(), location: form.location, cover: form.cover || IMAGES.party, category: form.category });
          toast(d.common.saved);
          setForm(blank);
          onClose();
          onCreated?.(id);
        }}
      />
    </Sheet>
  );
}

export function PublicationFormModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { d } = useI18n();
  const { actions, me } = useStore();
  const { colors } = useTheme();
  const { toast } = useDialogs();
  // Members only propose announcements; the admins check them before they appear.
  const direct = can(me, 'publish');
  const blank = { title: '', excerpt: '', body: '', cover: IMAGES.campus, category: (direct ? 'actualite' : 'annonce') as PublicationCategory };
  const [form, setForm] = useState(blank);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Sheet visible={visible} title={direct ? d.publications.create : d.pubReview.propose} onClose={onClose}>
      {!direct && (
        <Row gap={8} style={{ alignItems: 'flex-start' }}>
          <Feather name="shield" size={15} color={colors.warning} style={{ marginTop: 2 }} />
          <Txt variant="small" color="textMuted" style={{ flex: 1 }}>{d.pubReview.proposeSub}</Txt>
        </Row>
      )}
      <Input label={d.events.titleField} value={form.title} onChangeText={set('title')} />
      {direct && (
        <Row gap={8} wrap>
          {(Object.keys(d.publications.categories) as PublicationCategory[]).map((c) => (
            <Chip key={c} label={d.publications.categories[c]} active={form.category === c} onPress={() => setForm((f) => ({ ...f, category: c }))} />
          ))}
        </Row>
      )}
      <Input label={d.events.coverField} icon="image" value={form.cover} onChangeText={set('cover')} autoCapitalize="none" />
      <Input label={d.publications.excerptField} value={form.excerpt} onChangeText={set('excerpt')} />
      <Input label={d.publications.bodyField} value={form.body} onChangeText={set('body')} multiline />
      <Button
        label={direct ? d.common.create : d.pubReview.submit}
        full
        size="lg"
        disabled={!form.title || !form.body}
        onPress={() => {
          const r = actions.createPublication({ ...form, excerpt: form.excerpt || form.body.slice(0, 140) });
          toast(r.pending ? d.pubReview.submitted : d.common.saved);
          setForm(blank);
          onClose();
        }}
      />
    </Sheet>
  );
}
