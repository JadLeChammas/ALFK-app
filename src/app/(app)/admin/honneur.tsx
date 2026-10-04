import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AdminNav } from '@/components/AdminNav';
import { useDialogs } from '@/components/ui/Dialogs';
import { Avatar, Button, Card, EmptyState, FieldRow, Input, ListRow, Segmented, SectionHeader } from '@/components/ui/primitives';
import { Columns, PageHeader, Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { fullName, useStore, type AuthError } from '@/data/store';
import type { Gender } from '@/data/types';
import { useI18n } from '@/i18n';

/**
 * Honorary members' accounts: they do not sign up themselves. An admin creates the account with an
 * e-mail and a password (approved at once, no proof of schooling); the member fills in the rest on
 * their profile page.
 */
export default function HonoraryAccounts() {
  const { d } = useI18n();
  const h = d.honoraryAdmin;
  const { db, actions } = useStore();
  const { toast } = useDialogs();
  const blank = { firstName: '', lastName: '', email: '', password: '', fonction: '', gender: 'N' as Gender };
  const [form, setForm] = useState(blank);
  const [error, setError] = useState<AuthError | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => {
    setForm((x) => ({ ...x, [k]: v }));
    setError(null);
  };
  const honorary = db.users.filter((u) => u.role === 'honneur').sort((a, b) => fullName(a).localeCompare(fullName(b)));

  const submit = async () => {
    setBusy(true);
    const r = await actions.createUser({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      password: form.password,
      gender: form.gender,
      role: 'honneur',
      fonction: form.fonction.trim() || undefined,
    });
    setBusy(false);
    if (!r.ok) {
      setDetail(r.detail ?? null);
      return setError(r.error);
    }
    toast(h.created, 'success');
    setForm(blank);
  };

  return (
    <Screen>
      <PageHeader title={h.title} subtitle={h.subtitle} right={<Button label={h.openCircle} icon="award" variant="secondary" onPress={() => router.push('/cercle')} />} />
      <AdminNav />
      <Columns
        main={
          <Card style={{ gap: 14 }}>
            <View style={{ gap: 4 }}>
              <Txt variant="h3">{h.formTitle}</Txt>
              <Txt variant="small" color="textMuted">{h.formHint}</Txt>
            </View>
            <FieldRow>
              <Input label={d.auth.firstName} value={form.firstName} onChangeText={set('firstName')} maxLength={80} containerStyle={{ flex: 1 }} />
              <Input label={d.auth.lastName} value={form.lastName} onChangeText={(v) => set('lastName')(v.toLocaleUpperCase('fr'))} maxLength={80} autoCapitalize="characters" containerStyle={{ flex: 1 }} />
            </FieldRow>
            <Input label={d.auth.email} icon="mail" value={form.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" />
            <Input label={d.admin.initialPassword} icon="lock" value={form.password} onChangeText={set('password')} hint={d.auth.passwordHint} autoCapitalize="none" />
            <Input label={h.fonctionOptional} icon="briefcase" value={form.fonction} onChangeText={set('fonction')} />
            <View style={{ gap: 8 }}>
              <Txt variant="smallStrong" color="textMuted">{d.auth.gender}</Txt>
              <Segmented value={form.gender} onChange={(g) => setForm((x) => ({ ...x, gender: g }))} options={[{ value: 'F', label: d.gender.F }, { value: 'M', label: d.gender.M }, { value: 'N', label: d.gender.N }]} />
            </View>
            {error && <Txt variant="smallStrong" color="danger">{d.auth.errors[error]}{error === 'unknown' && detail ? ` (${detail})` : ''}</Txt>}
            <Button label={h.create} icon="user-plus" full size="lg" onPress={submit} loading={busy} disabled={!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.password} />
          </Card>
        }
        aside={
          <Card style={{ gap: 4 }}>
            <SectionHeader title={h.list} icon="award" count={String(honorary.length)} />
            {honorary.length === 0 ? (
              <EmptyState icon="award" title={h.empty} />
            ) : (
              honorary.map((u, i) => (
                <ListRow
                  key={u.id}
                  leading={<Avatar uri={u.avatar} name={fullName(u)} size={34} />}
                  title={fullName(u)}
                  subtitle={[u.fonction, u.employer].filter(Boolean).join(' · ') || u.email}
                  onPress={() => router.push(`/membre/${u.id}`)}
                  last={i === honorary.length - 1}
                />
              ))
            )}
          </Card>
        }
      />
    </Screen>
  );
}
