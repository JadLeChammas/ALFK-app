import { Feather } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { AdminNav } from '@/components/AdminNav';
import { useDialogs } from '@/components/ui/Dialogs';
import { Badge, Button, Card, Chip, IconButton, Input, Row, Segmented } from '@/components/ui/primitives';
import { PageHeader, Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { DEFAULT_TEMPLATES, EMAIL_EVENTS, type EmailEvent, type EmailLocale, type EmailTemplates } from '@/data/emailTemplates';
import { useStore } from '@/data/store';
import type { Role } from '@/data/types';
import { useI18n } from '@/i18n';
import { pickAttachment } from '@/lib/media';
import { useTheme } from '@/theme/ThemeProvider';

// Honorary members do not receive these emails.
const AUDIENCES: Role[] = ['alumni', 'eleve', 'admin'];

/**
 * Admin → Emails: write an email to groups of members (with attachments; logo and signature added),
 * edit the automatic emails (French and English) and the signature, sync the Brevo lists.
 * Sending goes through api/email.ts (Brevo key in Vercel).
 */
export default function AdminEmails() {
  const { d } = useI18n();
  const e = d.emails;
  const { isRemote, actions } = useStore();
  const [status, setStatus] = useState<{ configured: boolean; lists: boolean; sender: string } | null>(null);
  useEffect(() => {
    if (!isRemote) return;
    actions.emailStatus().then((s) => setStatus({ configured: !!s.configured, lists: !!s.lists, sender: s.sender ?? '' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRemote]);

  return (
    <Screen maxWidth={960}>
      <PageHeader title={e.title} subtitle={e.subtitle} />
      <AdminNav />
      {!isRemote ? (
        <Notice icon="info" text={e.demo} />
      ) : status && !status.configured ? (
        <Notice icon="alert-triangle" text={e.notConfigured} warn />
      ) : null}
      <Compose />
      <AutoEmails />
      <Signature />
      <BrevoLists listsReady={!!status?.lists} />
    </Screen>
  );
}

function Notice({ icon, text, warn }: { icon: 'info' | 'alert-triangle'; text: string; warn?: boolean }) {
  const { colors } = useTheme();
  return (
    <Row gap={10} style={{ padding: 14, borderRadius: 14, backgroundColor: warn ? colors.warningSoft : colors.surfaceAlt, alignItems: 'flex-start' }}>
      <Feather name={icon} size={16} color={warn ? colors.warning : colors.textMuted} style={{ marginTop: 2 }} />
      <Txt variant="small" style={{ flex: 1 }}>{text}</Txt>
    </Row>
  );
}

/** Writing an email to groups of members. */
function Compose() {
  const { d, f } = useI18n();
  const e = d.emails;
  const { colors } = useTheme();
  const { db, actions } = useStore();
  const { confirm, toast } = useDialogs();
  const [audience, setAudience] = useState<Role[]>(['alumni']);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [files, setFiles] = useState<{ path: string; name: string }[]>([]);
  const [busy, setBusy] = useState<'test' | 'send' | 'file' | null>(null);

  // Members receive these emails only if they accept the news; admins always.
  const count = useMemo(
    () => db.users.filter((u) => u.approved && audience.includes(u.role) && (u.role === 'admin' || u.marketingOptIn)).length,
    [db.users, audience]
  );
  const toggle = (r: Role) => setAudience((a) => (a.includes(r) ? a.filter((x) => x !== r) : [...a, r]));
  const ready = !!subject.trim() && !!body.trim();

  const attach = async () => {
    const doc = await pickAttachment();
    if (!doc) return;
    if (doc.size && doc.size > 10 * 1024 * 1024) return toast(e.tooBig, 'danger');
    setBusy('file');
    try {
      const file = await actions.uploadMailAttachment(doc);
      setFiles((x) => [...x, file]);
    } catch {
      toast(d.auth.errors.unknown, 'danger');
    }
    setBusy(null);
  };

  const send = async (test: boolean) => {
    if (!test && !(await confirm({ title: e.send, message: f(e.confirm, { n: count }), confirmLabel: e.send }))) return;
    setBusy(test ? 'test' : 'send');
    const r = await actions.sendEmail({ audience, subject, body, attachments: files, test });
    setBusy(null);
    if (!r.ok) return toast(r.error === 'demo' ? e.demo : `${d.auth.errors.unknown} (${r.error})`, 'danger');
    toast(test ? e.testSent : f(e.sent, { n: r.sent ?? 0 }), 'success');
    if (!test) {
      setSubject('');
      setBody('');
      setFiles([]);
    }
  };

  return (
    <Card style={{ gap: 14 }}>
      <Txt variant="h3">{e.compose}</Txt>
      <View style={{ gap: 8 }}>
        <Txt variant="smallStrong" color="textMuted">{e.to}</Txt>
        <Row gap={8} wrap>
          {AUDIENCES.map((r) => <Chip key={r} label={d.roles[r]} active={audience.includes(r)} onPress={() => toggle(r)} />)}
        </Row>
        <Txt variant="small" color="textSubtle">{f(e.recipients, { n: count })}</Txt>
      </View>
      <Input label={e.subject} value={subject} onChangeText={setSubject} />
      <Input label={e.message} value={body} onChangeText={setBody} multiline hint={e.messageHint} />
      <View style={{ gap: 8 }}>
        {files.map((x, i) => (
          <Row key={x.path} gap={10} style={{ padding: 10, borderRadius: 12, backgroundColor: colors.surfaceAlt }}>
            <Feather name="paperclip" size={15} color={colors.textMuted} />
            <Txt variant="small" style={{ flex: 1 }} numberOfLines={1}>{x.name}</Txt>
            <IconButton icon="x" size={28} label={d.common.delete} onPress={() => setFiles((list) => list.filter((_, k) => k !== i))} />
          </Row>
        ))}
        <Button label={e.attach} icon="paperclip" variant="secondary" size="sm" onPress={attach} loading={busy === 'file'} style={{ alignSelf: 'flex-start' }} />
      </View>
      <Row gap={10} wrap>
        <Button label={e.test} icon="eye" variant="secondary" onPress={() => send(true)} loading={busy === 'test'} disabled={!ready} />
        <Button label={e.send} icon="send" onPress={() => send(false)} loading={busy === 'send'} disabled={!ready || !audience.length || count === 0} />
      </Row>
    </Card>
  );
}

/** The automatic emails: texts in French and English (empty = the default text). */
function AutoEmails() {
  const { d } = useI18n();
  const e = d.emails;
  const { db, actions } = useStore();
  const { toast } = useDialogs();
  const saved = useMemo<EmailTemplates>(() => {
    try {
      return JSON.parse(db.settings.emailTemplates ?? '{}') ?? {};
    } catch {
      return {};
    }
  }, [db.settings.emailTemplates]);
  const [event, setEvent] = useState<EmailEvent>('signupReceived');
  const [locale, setLocale] = useState<EmailLocale>('fr');
  const current = saved[event]?.[locale];

  const save = (text: { subject: string; body: string } | null) => {
    const next: EmailTemplates = { ...saved, [event]: { ...saved[event], [locale]: text ?? undefined } };
    actions.saveEmailTemplates(next);
    toast(d.common.saved);
  };

  return (
    <Card style={{ gap: 14 }}>
      <View style={{ gap: 4 }}>
        <Txt variant="h3">{e.auto}</Txt>
        <Txt variant="small" color="textMuted">{e.autoSub}</Txt>
      </View>
      <Row gap={8} wrap>
        {EMAIL_EVENTS.map((x) => <Chip key={x} label={e.events[x]} active={x === event} onPress={() => setEvent(x)} />)}
      </Row>
      <Segmented value={locale} onChange={setLocale} options={[{ value: 'fr', label: 'Français' }, { value: 'en', label: 'English' }]} />
      {/* A fresh editor for each email, language and saved version. */}
      <TemplateEditor key={`${event}-${locale}-${db.settings.emailTemplates ?? ''}`} initial={{ subject: current?.subject || DEFAULT_TEMPLATES[event][locale].subject, body: current?.body || DEFAULT_TEMPLATES[event][locale].body }} customised={!!current} onSave={save} />
    </Card>
  );
}

function TemplateEditor({ initial, customised, onSave }: { initial: { subject: string; body: string }; customised: boolean; onSave: (text: { subject: string; body: string } | null) => void }) {
  const { d } = useI18n();
  const e = d.emails;
  const [subject, setSubject] = useState(initial.subject);
  const [body, setBody] = useState(initial.body);
  return (
    <>
      <Input label={e.subject} value={subject} onChangeText={setSubject} />
      <Input label={e.message} value={body} onChangeText={setBody} multiline hint={e.variables} />
      <Row gap={10} wrap>
        <Button label={d.common.save} icon="check" onPress={() => onSave({ subject, body })} />
        <Button label={e.reset} icon="rotate-ccw" variant="ghost" onPress={() => onSave(null)} />
        {customised && <Badge label={e.customised} tone="info" />}
      </Row>
    </>
  );
}

/** The signature added at the end of every email. */
function Signature() {
  const { d } = useI18n();
  const e = d.emails;
  const { db, actions } = useStore();
  const { toast } = useDialogs();
  const [text, setText] = useState(db.settings.emailSignature ?? '');
  return (
    <Card style={{ gap: 14 }}>
      <View style={{ gap: 4 }}>
        <Txt variant="h3">{e.signature}</Txt>
        <Txt variant="small" color="textMuted">{e.signatureSub}</Txt>
      </View>
      <Input value={text} onChangeText={setText} multiline placeholder={e.signaturePlaceholder} />
      <Button
        label={d.common.save}
        icon="check"
        onPress={() => {
          actions.saveEmailSignature(text);
          toast(d.common.saved);
        }}
        style={{ alignSelf: 'flex-start' }}
      />
    </Card>
  );
}

/** Members who accept the news → Brevo lists (for campaigns written in Brevo). */
function BrevoLists({ listsReady }: { listsReady: boolean }) {
  const { d, f } = useI18n();
  const e = d.emails;
  const { db, actions, isRemote } = useStore();
  const { toast } = useDialogs();
  const [busy, setBusy] = useState(false);
  const optedIn = db.users.filter((u) => u.approved && u.marketingOptIn).length;
  return (
    <Card style={{ gap: 12 }}>
      <View style={{ gap: 4 }}>
        <Txt variant="h3">{e.lists}</Txt>
        <Txt variant="small" color="textMuted">{f(e.listsSub, { n: optedIn })}</Txt>
      </View>
      <Button
        label={e.sync}
        icon="refresh-cw"
        variant="secondary"
        disabled={!isRemote || !listsReady}
        loading={busy}
        onPress={async () => {
          setBusy(true);
          const r = await actions.syncContacts();
          setBusy(false);
          toast(r.ok ? e.synced : `${d.auth.errors.unknown} (${r.error})`, r.ok ? 'success' : 'danger');
        }}
        style={{ alignSelf: 'flex-start' }}
      />
      {isRemote && !listsReady && <Txt variant="small" color="textSubtle">{e.listsMissing}</Txt>}
    </Card>
  );
}
