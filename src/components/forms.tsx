import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';

import type { EventCategory, Publication, PublicationCategory } from '@/data/types';
import { can } from '@/data/permissions';
import { fullName, isUnavailable, useStore } from '@/data/store';
import { IMAGES } from '@/data/seed';
import { useI18n } from '@/i18n';
import { pickImages } from '@/lib/media';
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

/**
 * A cover image: a preview, « Téléverser une image » (from the computer or the phone, stored with the
 * site's photos) and, for those who have one, the image's web address.
 */
export function CoverPicker({ value, onChange, folder, onBusy }: { value: string; onChange: (url: string) => void; folder: string; onBusy?: (busy: boolean) => void }) {
  const { d } = useI18n();
  const c = d.cover;
  const { colors } = useTheme();
  const { actions } = useStore();
  const { toast } = useDialogs();
  const [uploading, setUploading] = useState(false);
  const [byUrl, setByUrl] = useState(false);
  const busy = (b: boolean) => {
    setUploading(b);
    onBusy?.(b);
  };
  const upload = async () => {
    const [img] = await pickImages(false);
    if (!img) return;
    busy(true);
    try {
      onChange(await actions.uploadImage(img, folder));
    } catch (e) {
      if (!isUnavailable(e)) toast(d.auth.errors.unknown, 'danger');
    }
    busy(false);
  };
  return (
    <View style={{ gap: 8 }}>
      <Txt variant="smallStrong" color="textMuted">{c.label}</Txt>
      {!!value && <Image source={{ uri: value }} style={{ width: '100%', height: 160, borderRadius: radius.card, backgroundColor: colors.surfaceAlt }} contentFit="cover" />}
      <Row gap={8} wrap>
        <Button label={value ? c.change : c.upload} icon="upload" variant="secondary" size="sm" onPress={upload} loading={uploading} />
        {!byUrl && <Button label={c.orUrl} icon="link" variant="ghost" size="sm" onPress={() => setByUrl(true)} />}
      </Row>
      {byUrl && <Input placeholder="https://…" icon="link" value={value} onChangeText={onChange} autoCapitalize="none" keyboardType="url" />}
      <Txt variant="small" color="textSubtle">{c.hint}</Txt>
    </View>
  );
}

export function EventFormModal({ visible, onClose, onCreated }: { visible: boolean; onClose: () => void; onCreated?: (id: string) => void }) {
  const { d } = useI18n();
  const { actions } = useStore();
  const { toast } = useDialogs();
  const [soon] = useState(() => new Date(Date.now() + 14 * 86_400_000));
  const blank = { title: '', description: '', date: `${soon.getFullYear()}-${pad(soon.getMonth() + 1)}-${pad(soon.getDate())}`, time: '19:00', location: '', cover: IMAGES.party, category: 'soiree' as EventCategory };
  const [form, setForm] = useState(blank);
  const [uploading, setUploading] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const date = new Date(`${form.date}T${form.time}:00`);
  const valid = form.title && form.location && !Number.isNaN(date.getTime()) && !uploading;

  return (
    <Sheet visible={visible} title={d.events.create} onClose={onClose}>
      <Input label={d.events.titleField} value={form.title} onChangeText={set('title')} maxLength={300} />
      <FieldRow>
        <Input label={d.events.dateField} value={form.date} onChangeText={set('date')} containerStyle={{ flex: 1 }} />
        <Input label={d.events.timeField} value={form.time} onChangeText={set('time')} containerStyle={{ minWidth: 120 }} />
      </FieldRow>
      <Input label={d.events.locationField} icon="map-pin" value={form.location} onChangeText={set('location')} maxLength={300} />
      <View style={{ gap: 8 }}>
        <Txt variant="smallStrong" color="textMuted">{d.events.category}</Txt>
        <Row gap={8} wrap>
          {(Object.keys(d.events.categories) as EventCategory[]).map((c) => (
            <Chip key={c} label={d.events.categories[c]} active={form.category === c} onPress={() => setForm((f) => ({ ...f, category: c }))} />
          ))}
        </Row>
      </View>
      <CoverPicker value={form.cover} onChange={set('cover')} folder="events" onBusy={setUploading} />
      <Input label={d.events.descriptionField} value={form.description} onChangeText={set('description')} multiline maxLength={10000} />
      <Button
        label={d.common.create}
        full
        size="lg"
        disabled={!valid}
        onPress={() => {
          const id = actions.createEvent({ title: form.title, description: form.description, date: date.toISOString(), location: form.location, cover: form.cover || IMAGES.party, category: form.category });
          if (!id) return;
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
  // Members only (default) or also public on alfk.org — chosen by the admins.
  const [visibility, setVisibility] = useState<'members' | 'public'>(editing?.visibility ?? 'members');
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const [uploading, setUploading] = useState(false);
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
      <Input label={d.events.titleField} value={form.title} onChangeText={set('title')} maxLength={300} />
      {admin && <Select label={d.publications.author} value={authorId} onChange={setAuthorId} searchable options={authors} />}
      {direct && (
        <Row gap={8} wrap>
          {(Object.keys(d.publications.categories) as PublicationCategory[]).map((c) => (
            <Chip key={c} label={d.publications.categories[c]} active={form.category === c} onPress={() => setForm((f) => ({ ...f, category: c }))} />
          ))}
        </Row>
      )}
      {admin && (
        <View style={{ gap: 8 }}>
          <Txt variant="smallStrong" color="textMuted">{d.publications.visibilityLabel}</Txt>
          <Row gap={8} wrap>
            <Chip label={d.publications.visibilityMembers} icon="lock" active={visibility === 'members'} onPress={() => setVisibility('members')} />
            <Chip label={d.publications.visibilityPublic} icon="globe" active={visibility === 'public'} onPress={() => setVisibility('public')} />
          </Row>
          <Txt variant="small" color="textSubtle">{visibility === 'public' ? d.publications.visibilityPublicHint : d.publications.visibilityMembersHint}</Txt>
        </View>
      )}
      <CoverPicker value={form.cover} onChange={set('cover')} folder="publications" onBusy={setUploading} />
      <Input label={d.publications.excerptField} value={form.excerpt} onChangeText={set('excerpt')} maxLength={2000} />
      <Input label={d.publications.bodyField} value={form.body} onChangeText={set('body')} multiline maxLength={50000} />
      <Button
        label={editing ? d.common.save : direct ? d.common.create : d.pubReview.submit}
        full
        size="lg"
        disabled={!form.title || !form.body || uploading}
        onPress={() => {
          const data = { ...form, excerpt: form.excerpt || form.body.slice(0, 140) };
          if (editing) {
            const r = actions.updatePublication(editing.id, { ...data, authorId: admin ? authorId : undefined, visibility: admin ? visibility : undefined });
            if ('blocked' in r) return;
            toast(r.pending ? d.publications.editPending : d.common.saved);
            onClose();
            return;
          }
          const r = actions.createPublication({ ...data, visibility: admin ? visibility : 'members' }, admin ? authorId : undefined);
          if ('blocked' in r) return;
          toast(r.pending ? d.pubReview.submitted : d.common.saved);
          setForm(blank);
          onClose();
        }}
      />
    </Sheet>
  );
}
