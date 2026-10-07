import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AdminNav } from '@/components/AdminNav';
import { LegalText } from '@/components/LegalText';
import { useDialogs } from '@/components/ui/Dialogs';
import { Badge, Button, Card, Input, Row, Segmented } from '@/components/ui/primitives';
import { PageHeader, Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { LEGAL_DOCS, parseLegalTexts, type LegalDoc, type LegalLocale } from '@/data/legal';
import { useStore } from '@/data/store';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

const PAGE: Record<LegalDoc, string> = { cgu: '/cgu', privacy: '/confidentialite', mentions: '/mentions-legales' };

/**
 * Admins: write and publish the terms of use, the privacy policy and the legal notice (French and
 * English). What is typed stays a draft on this screen: the site changes only on « Publier ».
 * « Retirer » puts back the site's built-in text.
 */
export default function AdminLegalTexts() {
  const { d, f, formatDate } = useI18n();
  const l = d.legalAdmin;
  const { colors } = useTheme();
  const { db, actions } = useStore();
  const { confirm, toast } = useDialogs();
  const published = parseLegalTexts(db.settings.legalTexts);
  const [doc, setDoc] = useState<LegalDoc>('cgu');
  const [locale, setLocale] = useState<LegalLocale>('fr');
  // Drafts per document and language, kept until published (or the page is left).
  const [drafts, setDrafts] = useState<Partial<Record<`${LegalDoc}.${LegalLocale}`, string>>>({});
  const [preview, setPreview] = useState(false);
  const key = `${doc}.${locale}` as const;
  const live = published[doc]?.[locale] ?? '';
  const value = drafts[key] ?? live;
  const changed = value.trim() !== live.trim();
  const names: Record<LegalDoc, string> = { cgu: d.legal.cgu, privacy: d.legal.privacy, mentions: d.nav.legal };

  const publish = async () => {
    if (!value.trim()) return;
    if (!(await confirm({ title: l.publish, message: f(l.publishConfirm, { name: names[doc] }), confirmLabel: l.publish }))) return;
    const next = { ...published, [doc]: { ...published[doc], [locale]: value.trim(), updatedAt: new Date().toISOString() } };
    actions.setLegalTexts(JSON.stringify(next));
    setDrafts((x) => ({ ...x, [key]: undefined }));
    toast(l.published, 'success');
  };
  const withdraw = async () => {
    if (!(await confirm({ title: l.withdraw, message: f(l.withdrawConfirm, { name: names[doc] }), danger: true, confirmLabel: l.withdraw }))) return;
    const entry = { ...published[doc] };
    delete entry[locale];
    const next = { ...published, [doc]: entry };
    actions.setLegalTexts(JSON.stringify(next));
    setDrafts((x) => ({ ...x, [key]: undefined }));
    toast(l.withdrawn, 'success');
  };

  return (
    <Screen maxWidth={1000}>
      <PageHeader title={l.title} subtitle={l.subtitle} />
      <AdminNav />

      <Segmented value={doc} onChange={(v) => { setDoc(v); setPreview(false); }} options={LEGAL_DOCS.map((k) => ({ value: k, label: names[k] }))} />

      <Card style={{ gap: 14 }}>
        <Row gap={10} wrap style={{ justifyContent: 'space-between' }}>
          <Segmented value={locale} onChange={setLocale} options={[{ value: 'fr', label: 'Français' }, { value: 'en', label: 'English' }]} />
          {live ? (
            <Badge label={published[doc]?.updatedAt ? f(l.liveSince, { date: formatDate(published[doc]!.updatedAt!, { year: true }) }) : l.live} tone="success" icon="check" />
          ) : (
            <Badge label={l.notLive} tone="neutral" icon="clock" />
          )}
        </Row>
        <Row gap={8} style={{ alignItems: 'flex-start' }}>
          <Feather name="info" size={14} color={colors.textSubtle} style={{ marginTop: 2 }} />
          <Txt variant="small" color="textSubtle" style={{ flex: 1 }}>{live ? l.hintLive : l.hintDraft}</Txt>
        </Row>
        {preview ? (
          value.trim() ? <LegalText text={value} /> : <Txt color="textMuted">{l.empty}</Txt>
        ) : (
          <Input
            value={value}
            onChangeText={(v) => setDrafts((x) => ({ ...x, [key]: v }))}
            multiline
            placeholder={l.placeholder}
            style={{ minHeight: 420, fontFamily: undefined }}
            maxLength={60000}
          />
        )}
        <Txt variant="small" color="textSubtle">{l.format}</Txt>
        <Row gap={8} wrap>
          <Button label={preview ? l.edit : l.preview} icon={preview ? 'edit-2' : 'eye'} variant="secondary" size="sm" onPress={() => setPreview((p) => !p)} />
          <Button label={l.publish} icon="upload-cloud" size="sm" onPress={publish} disabled={!value.trim() || !changed} />
          {changed && !!live && <Button label={l.discard} icon="rotate-ccw" variant="ghost" size="sm" onPress={() => setDrafts((x) => ({ ...x, [key]: undefined }))} />}
          {!!live && <Button label={l.withdraw} icon="x-circle" variant="ghost" size="sm" onPress={withdraw} />}
          <View style={{ flex: 1 }} />
          <Button label={l.seePage} icon="external-link" variant="ghost" size="sm" onPress={() => router.push(PAGE[doc] as never)} />
        </Row>
      </Card>
    </Screen>
  );
}
