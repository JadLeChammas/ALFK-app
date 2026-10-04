import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { LFK_NAME, useLfkEntry } from '@/components/cv/CvView';
import { Sheet } from '@/components/forms';
import { UniversityPicker } from '@/components/UniversityPicker';
import { useDialogs } from '@/components/ui/Dialogs';
import { Button, Card, Chip, IconButton, Input, Row, SectionHeader, type IconName } from '@/components/ui/primitives';
import { BackLink, PageHeader, Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { useMe, useStore } from '@/data/store';
import type { Cv, CvEntry, CvLanguage, CvSection } from '@/data/types';
import { LANGUAGES, useI18n } from '@/i18n';
import { period, sortEntries } from '@/lib/cvPdf';
import { pickPdf, PROOF_MAX_BYTES } from '@/lib/media';
import { useTheme } from '@/theme/ThemeProvider';
import { isFileRejected } from '@/lib/fileSafety';

const SECTIONS: { key: CvSection; icon: IconName }[] = [
  { key: 'experience', icon: 'briefcase' },
  { key: 'education', icon: 'book' },
  { key: 'projects', icon: 'layers' },
  { key: 'associations', icon: 'heart' },
];

const newId = () => `cv${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
/** 'YYYY-MM' ⇄ 'MM/YYYY' as typed. */
const toTyped = (ym?: string) => (ym ? `${ym.slice(5, 7)}/${ym.slice(0, 4)}` : '');
const fromTyped = (v: string) => {
  const [m, y] = v.split('/').map((x) => parseInt(x, 10));
  return m >= 1 && m <= 12 && y >= 1950 && y <= 2100 ? `${y}-${String(m).padStart(2, '0')}` : null;
};
const maskMonth = (v: string) => {
  const digits = v.replace(/\D/g, '').slice(0, 6);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
};
const withHttp = (v: string) => (v && !/^https?:\/\//i.test(v) ? `https://${v}` : v);

/** Build or edit one's CV (shown to members, exportable as a PDF), and attach a PDF CV. */
export default function CvEditor() {
  const { d, lang } = useI18n();
  const { colors } = useTheme();
  const { actions } = useStore();
  const { confirm, toast } = useDialogs();
  const me = useMe();
  const lfk = useLfkEntry(me);
  const [cv, setCv] = useState<Cv>(me.cv ?? {});
  const [editing, setEditing] = useState<{ section: CvSection; entry: CvEntry } | null>(null);
  const [uploading, setUploading] = useState(false);
  const locale = LANGUAGES.find((l) => l.code === lang)?.locale ?? 'fr-FR';

  const save = (next: Cv = cv, quiet = false) => {
    const r = actions.updateProfile({ cv: next });
    if (!quiet) toast(r.ok ? d.common.saved : d.errors.saveFailed, r.ok ? 'success' : 'danger');
    return r.ok;
  };
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/profil'));
  const setEntries = (section: CvSection, list: CvEntry[]) => setCv((c) => ({ ...c, [section]: list }));

  const attach = async () => {
    const doc = await pickPdf();
    if (!doc) return;
    if (doc.size && doc.size > PROOF_MAX_BYTES) {
      toast(d.cv.fileTooBig, 'danger');
      return;
    }
    setUploading(true);
    try {
      const path = await actions.uploadCvFile(doc);
      const next = { ...cv, file: { path, name: doc.name, uploadedAt: new Date().toISOString() } };
      setCv(next);
      save(next);
    } catch (e) {
      toast(isFileRejected(e) ? d.auth.errors[e.reason] : d.errors.saveFailed, 'danger');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Screen maxWidth={860}>
      <BackLink label={d.nav.profile} href="/profil" />
      <PageHeader title={me.cv ? d.cv.edit : d.cv.create} subtitle={d.cv.subtitle} right={<Button label={d.common.save} icon="check" onPress={() => save() && leave()} />} />

      <Card style={{ gap: 14 }}>
        <SectionHeader title={d.cv.profile} icon="user" />
        <Input label={d.cv.headline} value={cv.headline ?? ''} onChangeText={(v) => setCv((c) => ({ ...c, headline: v || undefined }))} placeholder={d.cv.headlinePlaceholder} maxLength={140} />
        <Input label={d.cv.linkedin} icon="linkedin" value={cv.linkedin ?? ''} onChangeText={(v) => setCv((c) => ({ ...c, linkedin: v.trim() ? withHttp(v.trim()) : undefined }))} placeholder="linkedin.com/in/…" autoCapitalize="none" keyboardType="url" />
        <Input label={d.cv.website} icon="link" value={cv.website ?? ''} onChangeText={(v) => setCv((c) => ({ ...c, website: v.trim() ? withHttp(v.trim()) : undefined }))} placeholder="https://…" autoCapitalize="none" keyboardType="url" />
      </Card>

      {SECTIONS.map(({ key, icon }) => {
        const list = sortEntries(cv[key]);
        return (
          <Card key={key} style={{ gap: 12 }}>
            <SectionHeader title={d.cv[key]} icon={icon} action={d.common.add} onAction={() => setEditing({ section: key, entry: { id: newId(), title: '' } })} />
            {list.map((e) => (
              <Row key={e.id} gap={10} style={{ paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.border }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt variant="bodyStrong" numberOfLines={1}>{e.title}</Txt>
                  <Txt variant="small" color="textSubtle" numberOfLines={1}>{[e.org, period(e, locale, d.cv.present)].filter(Boolean).join(' · ')}</Txt>
                </View>
                <IconButton icon="edit-2" size={32} label={d.common.edit} onPress={() => setEditing({ section: key, entry: e })} />
                <IconButton
                  icon="trash-2"
                  size={32}
                  label={d.common.delete}
                  onPress={async () => {
                    if (await confirm({ title: d.common.delete, message: e.title, danger: true, confirmLabel: d.common.delete })) setEntries(key, (cv[key] ?? []).filter((x) => x.id !== e.id));
                  }}
                />
              </Row>
            ))}
            {key === 'education' && lfk && (
              <Row gap={10} style={{ paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.border }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt variant="bodyStrong">{lfk.title}</Txt>
                  <Txt variant="small" color="textSubtle">{`${LFK_NAME} · ${period(lfk, locale, d.cv.present)}`}</Txt>
                </View>
                <Feather name="lock" size={14} color={colors.textSubtle} />
              </Row>
            )}
            {!list.length && !(key === 'education' && lfk) && <Txt variant="small" color="textSubtle">{d.cv.sectionEmpty}</Txt>}
          </Card>
        );
      })}

      <Card style={{ gap: 12 }}>
        <SectionHeader title={d.cv.languages} icon="globe" />
        <LanguagesEditor value={cv.languages ?? []} onChange={(languages) => setCv((c) => ({ ...c, languages }))} />
      </Card>
      <Card style={{ gap: 12 }}>
        <SectionHeader title={d.cv.skills} icon="zap" />
        <TagsEditor value={cv.skills ?? []} onChange={(skills) => setCv((c) => ({ ...c, skills }))} placeholder={d.cv.addSkill} />
      </Card>
      <Card style={{ gap: 12 }}>
        <SectionHeader title={d.cv.interests} icon="smile" />
        <TagsEditor value={cv.interests ?? []} onChange={(interests) => setCv((c) => ({ ...c, interests }))} placeholder={d.cv.addInterest} />
      </Card>

      <Card style={{ gap: 12 }}>
        <SectionHeader title={d.cv.file} icon="paperclip" />
        <Txt variant="small" color="textMuted">{d.cv.fileHint}</Txt>
        {cv.file && (
          <Row gap={10} style={{ padding: 12, borderRadius: 14, backgroundColor: colors.surfaceAlt }}>
            <Feather name="file-text" size={20} color={colors.primary} />
            <Txt variant="smallStrong" style={{ flex: 1 }} numberOfLines={1}>{cv.file.name}</Txt>
            <IconButton
              icon="x"
              size={32}
              label={d.cv.removeFile}
              onPress={() => {
                const next = { ...cv, file: undefined };
                setCv(next);
                save(next);
              }}
            />
          </Row>
        )}
        <Button label={uploading ? d.cv.uploading : cv.file ? d.cv.replaceFile : d.cv.upload} icon="upload" variant="secondary" disabled={uploading} onPress={attach} />
      </Card>

      <Button label={d.common.save} icon="check" size="lg" full onPress={() => save() && leave()} />

      {editing && (
        <EntrySheet
          section={editing.section}
          entry={editing.entry}
          onClose={() => setEditing(null)}
          onSave={(e) => {
            const list = cv[editing.section] ?? [];
            setEntries(editing.section, list.some((x) => x.id === e.id) ? list.map((x) => (x.id === e.id ? e : x)) : [...list, e]);
            setEditing(null);
          }}
        />
      )}
    </Screen>
  );
}

function EntrySheet({ section, entry, onClose, onSave }: { section: CvSection; entry: CvEntry; onClose: () => void; onSave: (e: CvEntry) => void }) {
  const { d } = useI18n();
  const me = useMe();
  const [form, setForm] = useState({
    title: entry.title,
    org: entry.org ?? '',
    place: entry.place ?? '',
    start: toTyped(entry.start),
    end: toTyped(entry.end),
    ongoing: !!entry.start && !entry.end,
    description: entry.description ?? '',
    url: entry.url ?? '',
  });
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const start = form.start ? fromTyped(form.start) : undefined;
  const end = form.ongoing || !form.end ? undefined : fromTyped(form.end);
  const badStart = form.start.length === 7 && !start;
  const badEnd = !form.ongoing && form.end.length === 7 && (!end || (!!start && end < start));
  const ok = !!form.title.trim() && start !== null && end !== null && !badEnd;

  return (
    <Sheet visible title={d.cv[section]} onClose={onClose}>
      <Input label={d.cv.entryTitle[section]} value={form.title} onChangeText={set('title')} maxLength={120} />
      {section === 'education' ? (
        <UniversityPicker label={d.cv.entryOrg.education} value={form.org} onChange={set('org')} country={me.country} city={me.city} />
      ) : (
        <Input label={d.cv.entryOrg[section]} value={form.org} onChangeText={set('org')} maxLength={120} />
      )}
      <Input label={d.cv.place} icon="map-pin" value={form.place} onChangeText={set('place')} maxLength={80} />
      <Row gap={12}>
        <Input label={d.cv.start} value={form.start} onChangeText={(v) => set('start')(maskMonth(v))} placeholder="09/2024" keyboardType="number-pad" maxLength={7} containerStyle={{ flex: 1 }} error={badStart ? d.cv.invalidMonth : undefined} />
        {!form.ongoing && (
          <Input label={d.cv.end} value={form.end} onChangeText={(v) => set('end')(maskMonth(v))} placeholder="06/2026" keyboardType="number-pad" maxLength={7} containerStyle={{ flex: 1 }} error={badEnd ? d.cv.invalidMonth : undefined} />
        )}
      </Row>
      <Row gap={8}>
        <Chip label={d.cv.ongoing} icon={form.ongoing ? 'check' : undefined} active={form.ongoing} onPress={() => setForm((f) => ({ ...f, ongoing: !f.ongoing }))} />
      </Row>
      <Input label={d.cv.description} value={form.description} onChangeText={set('description')} multiline maxLength={600} />
      {section === 'projects' && <Input label={d.cv.url} icon="link" value={form.url} onChangeText={set('url')} autoCapitalize="none" keyboardType="url" />}
      <Button
        label={d.common.save}
        icon="check"
        full
        size="lg"
        disabled={!ok}
        onPress={() =>
          onSave({
            id: entry.id,
            title: form.title.trim(),
            org: form.org.trim() || undefined,
            place: form.place.trim() || undefined,
            start: start ?? undefined,
            end: end ?? undefined,
            description: form.description.trim() || undefined,
            url: form.url.trim() ? withHttp(form.url.trim()) : undefined,
          })
        }
      />
    </Sheet>
  );
}

function TagsEditor({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const { d } = useI18n();
  const { colors } = useTheme();
  const [text, setText] = useState('');
  const add = () => {
    const items = text.split(',').map((s) => s.trim()).filter((s) => s && !value.some((v) => v.toLowerCase() === s.toLowerCase()));
    if (items.length) onChange([...value, ...items].slice(0, 30));
    setText('');
  };
  return (
    <View style={{ gap: 10 }}>
      {value.length > 0 && (
        <Row gap={6} wrap>
          {value.map((s) => (
            <Row key={s} gap={4} style={{ paddingLeft: 10, paddingRight: 4, paddingVertical: 3, borderRadius: 999, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border }}>
              <Txt variant="small">{s}</Txt>
              <IconButton icon="x" size={22} label={d.common.delete} onPress={() => onChange(value.filter((x) => x !== s))} />
            </Row>
          ))}
        </Row>
      )}
      <Row gap={8}>
        <Input value={text} onChangeText={setText} placeholder={placeholder} onSubmitEditing={add} containerStyle={{ flex: 1 }} maxLength={40} />
        <Button label={d.common.add} icon="plus" variant="secondary" disabled={!text.trim()} onPress={add} />
      </Row>
    </View>
  );
}

function LanguagesEditor({ value, onChange }: { value: CvLanguage[]; onChange: (v: CvLanguage[]) => void }) {
  const { d } = useI18n();
  const [name, setName] = useState('');
  const setLevel = (i: number, level: CvLanguage['level']) => onChange(value.map((l, j) => (j === i ? { ...l, level } : l)));
  return (
    <View style={{ gap: 14 }}>
      {value.map((l, i) => (
        <View key={l.name} style={{ gap: 8 }}>
          <Row gap={8}>
            <Txt variant="bodyStrong" style={{ flex: 1 }}>{l.name}</Txt>
            <IconButton icon="trash-2" size={30} label={d.common.delete} onPress={() => onChange(value.filter((_, j) => j !== i))} />
          </Row>
          <Row gap={6} wrap>
            {d.cv.levels.map((label, k) => (
              <Chip key={label} label={label} active={l.level === k + 1} onPress={() => setLevel(i, (k + 1) as CvLanguage['level'])} />
            ))}
          </Row>
        </View>
      ))}
      <Row gap={8}>
        <Input value={name} onChangeText={setName} placeholder={d.cv.addLanguage} containerStyle={{ flex: 1 }} maxLength={30} />
        <Button
          label={d.common.add}
          icon="plus"
          variant="secondary"
          disabled={!name.trim() || value.some((l) => l.name.toLowerCase() === name.trim().toLowerCase())}
          onPress={() => {
            onChange([...value, { name: name.trim(), level: 3 }]);
            setName('');
          }}
        />
      </Row>
    </View>
  );
}
