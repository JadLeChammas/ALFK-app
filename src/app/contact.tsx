import { useState } from 'react';

import { PublicPage } from '@/components/PublicPage';
import { useDialogs } from '@/components/ui/Dialogs';
import { Button, Card, Input } from '@/components/ui/primitives';
import { fullName, useStore } from '@/data/store';
import { useI18n } from '@/i18n';

/** Public contact form — lands in the admin contact inbox (separate from member messages). */
export default function Contact() {
  const { d } = useI18n();
  const { me, actions } = useStore();
  const { toast } = useDialogs();
  const blank = { name: me ? fullName(me) : '', email: me?.email ?? '', subject: '', message: '' };
  const [form, setForm] = useState(blank);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.name && form.email && form.subject && form.message;

  return (
    <PublicPage title={d.legal.contactTitle} subtitle={d.legal.contactSub}>
      <Card style={{ gap: 16 }}>
        <Input label={d.legal.name} value={form.name} onChangeText={set('name')} />
        <Input label={d.auth.email} value={form.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" />
        <Input label={d.legal.subject} value={form.subject} onChangeText={set('subject')} />
        <Input label={d.legal.message} value={form.message} onChangeText={set('message')} multiline />
        <Button
          label={d.common.send}
          icon="send"
          disabled={!valid}
          onPress={() => {
            actions.submitContact(form);
            toast(d.legal.sent);
            setForm({ ...blank, subject: '', message: '' });
          }}
        />
      </Card>
    </PublicPage>
  );
}
