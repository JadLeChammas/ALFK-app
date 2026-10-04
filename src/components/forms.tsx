import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';

import type { EventCategory, Publication, PublicationCategory } from '@/data/types';
import { can } from '@/data/permissions';
import { fullName, useStore } from '@/data/store';
import { IMAGES } from '@/data/seed';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { useDialogs } from './ui/Dialogs';
import { FieldRow, Button, Chip, IconButton, Input, Row } from './ui/primitives';
import { Select } from './ui/Select';
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

/** Writes a publication, or edits one (`editing`). */
export function PublicationFormModal({ visible, onClose, editing }: { visible: boolean; onClose: () => void; editing?: Publication }) {
  const { d } = useI18n();
  const { actions, me, db } = useStore();
  const { colors } = useTheme();
  const { toast } = useDialogs();
  // Members only propose announcements; the admins check them before they appear.
  const direct = can(me, 'publish');
  const blank = { title: '', excerpt: '', body: '', cover: IMAGES.campus, category: (direct ? 'actualite' : 'annonce') as PublicationCategory };
  const [form, setForm] = useState(editing ? { title: editing.title, excerpt: editing.excerpt, body: editing.body, cover: editing.cover, category: editing.category } : blank);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  // Admins choose whose name the publication carries (the president, the proviseur…).
  const admin = me?.role === 'admin';
  const [authorId, setAuthorId] = useState(editing?.authorId ?? me?.id ?? '');
  const authors = db.users
    .filter((u) => u.approved && (u.role === 'admin' || u.role === 'honneur' || u.id === authorId))
    .sort((a, b) => fullName(a).localeCompare(fullName(b)))
    .map((u) => ({ value: u.id, label: [fullName(u), u.fonction].filter(Boolean).join(' · ') }));

  return (
    <Sheet visible={visible} title={editing ? d.publications.edit : direct ? d.publications.create : d.pubReview.propose} onClose={onClose}>
      {!direct && (
        <Row gap={8} style={{ alignItems: 'flex-start' }}>
          <Feather name="shield" size={15} color={colors.warning} style={{ marginTop: 2 }} />
          <Txt variant="small" color="textMuted" style={{ flex: 1 }}>{d.pubReview.proposeSub}</Txt>
        </Row>
      )}
      <Input label={d.events.titleField} value={form.title} onChangeText={set('title')} />
      {admin && <Select label={d.publications.author} value={authorId} onChange={setAuthorId} searchable options={authors} />}
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
        label={editing ? d.common.save : direct ? d.common.create : d.pubReview.submit}
        full
        size="lg"
        disabled={!form.title || !form.body}
        onPress={() => {
          const data = { ...form, excerpt: form.excerpt || form.body.slice(0, 140) };
          if (editing) {
            const r = actions.updatePublication(editing.id, { ...data, authorId: admin ? authorId : undefined });
            toast(r.pending ? d.publications.editPending : d.common.saved);
            onClose();
            return;
          }
          const r = actions.createPublication(data, admin ? authorId : undefined);
          toast(r.pending ? d.pubReview.submitted : d.common.saved);
          setForm(blank);
          onClose();
        }}
      />
    </Sheet>
  );
}
