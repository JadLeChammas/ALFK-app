import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { useDialogs } from '@/components/ui/Dialogs';
import { FieldRow, Avatar, Button, Card, Input, Row, Tap } from '@/components/ui/primitives';
import { BackLink, Columns, PageHeader, Screen } from '@/components/ui/Screen';
import { Select } from '@/components/ui/Select';
import { Flag } from '@/components/ui/Flag';
import { Txt } from '@/components/ui/Txt';
import { COUNTRIES } from '@/data/countries';
import { fullName, useMe, useStore } from '@/data/store';
import { useI18n } from '@/i18n';
import { pickImages } from '@/lib/media';
import { useTheme } from '@/theme/ThemeProvider';

export default function EditProfile() {
  const { d, lang } = useI18n();
  const { colors } = useTheme();
  const { actions } = useStore();
  const { toast } = useDialogs();
  const me = useMe();
  const [form, setForm] = useState({
    firstName: me.firstName,
    lastName: me.lastName,
    phone: me.phone ?? '',
    birthDate: me.birthDate ?? '',
    school: me.school ?? '',
    promo: me.promo ? String(me.promo) : '',
    city: me.city ?? '',
    country: me.country ?? 'FR',
    bio: me.bio ?? '',
    avatar: me.avatar,
  });
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwError, setPwError] = useState<string | null>(null);

  const save = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) return;
    const promo = parseInt(form.promo, 10);
    actions.updateProfile({
      ...form,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      promo: Number.isFinite(promo) ? promo : undefined,
      birthDate: /^\d{4}-\d{2}-\d{2}$/.test(form.birthDate) ? form.birthDate : undefined,
      phone: form.phone || undefined,
      school: form.school || undefined,
      city: form.city || undefined,
      bio: form.bio || undefined,
    });
    toast(d.common.saved);
    router.back();
  };

  const [uploading, setUploading] = useState(false);
  const changePhoto = async () => {
    const [img] = await pickImages(false);
    if (!img) return;
    setUploading(true);
    try {
      const url = await actions.uploadImage(img, 'avatars');
      setForm((f) => ({ ...f, avatar: url }));
    } catch {
      toast(d.auth.errors.unknown, 'danger');
    } finally {
      setUploading(false);
    }
  };

  const changePassword = async () => {
    if (pw.next !== pw.confirm) return setPwError(d.auth.errors.mismatch);
    const r = await actions.changePassword(pw.current, pw.next);
    if (!r.ok) return setPwError(d.auth.errors[r.error]);
    setPw({ current: '', next: '', confirm: '' });
    setPwError(null);
    toast(d.settings.passwordChanged);
  };

  return (
    <Screen maxWidth={1040}>
      <BackLink label={d.nav.profile} href="/profil" />
      <PageHeader title={d.profile.edit} right={<Button label={d.common.save} icon="check" onPress={save} />} />
      <Columns
        asideWidth={320}
        main={
          <Card style={{ gap: 16 }}>
            <Txt variant="h3">{d.profile.info}</Txt>
            <FieldRow>
              <Input label={d.auth.firstName} value={form.firstName} onChangeText={set('firstName')} containerStyle={{ flex: 1 }} />
              <Input label={d.auth.lastName} value={form.lastName} onChangeText={set('lastName')} containerStyle={{ flex: 1 }} />
            </FieldRow>
            <FieldRow>
              <Input label={d.profile.phone} icon="phone" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" containerStyle={{ flex: 1 }} />
              <Input label={d.profile.birthDate} icon="gift" value={form.birthDate} onChangeText={set('birthDate')} placeholder={d.profile.birthDateHint} containerStyle={{ flex: 1 }} />
            </FieldRow>
            <FieldRow>
              <Input label={d.auth.school} icon="book" value={form.school} onChangeText={set('school')} containerStyle={{ flex: 2 }} />
              <Input label={d.profile.promoLabel} icon="award" value={form.promo} onChangeText={set('promo')} keyboardType="number-pad" maxLength={4} containerStyle={{ flex: 1 }} />
            </FieldRow>
            <FieldRow style={{ alignItems: 'flex-start' }}>
              <Input label={d.auth.city} icon="map-pin" value={form.city} onChangeText={set('city')} containerStyle={{ flex: 1 }} />
              <View style={{ flex: 1 }}>
                <Select label={d.auth.country} value={form.country} onChange={set('country')} searchable options={COUNTRIES.map((c) => ({ value: c.code, label: c[lang], leading: <Flag code={c.code} /> }))} />
              </View>
            </FieldRow>
            <Input label={d.profile.bio} value={form.bio} onChangeText={set('bio')} multiline />
            <View style={{ gap: 6 }}>
              <Txt variant="smallStrong" color="textMuted">{d.auth.gender}</Txt>
              <Row gap={10} style={{ height: 48, borderRadius: 14, paddingHorizontal: 14, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border }}>
                <Feather name="lock" size={15} color={colors.textSubtle} />
                <Txt color="textMuted" style={{ flex: 1 }}>{d.gender[me.gender]}</Txt>
                <Txt variant="small" color="textSubtle">{d.profile.genderLocked}</Txt>
              </Row>
            </View>
          </Card>
        }
        aside={
          <>
            <Card style={{ alignItems: 'center', gap: 14 }}>
              <Tap onPress={changePhoto}>
                <Avatar uri={form.avatar} name={fullName(me)} size={128} />
                <View style={{ position: 'absolute', right: 4, bottom: 4, width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.surface }}>
                  <Feather name="camera" size={15} color="#fff" />
                </View>
              </Tap>
              <Button label={d.profile.changePhoto} variant="secondary" size="sm" icon="image" onPress={changePhoto} loading={uploading} />
            </Card>
            <Card style={{ gap: 14 }}>
              <Txt variant="h3">{d.settings.changePassword}</Txt>
              <Input label={d.auth.currentPassword} value={pw.current} onChangeText={(v) => setPw((p) => ({ ...p, current: v }))} secureTextEntry />
              <Input label={d.auth.newPassword} value={pw.next} onChangeText={(v) => setPw((p) => ({ ...p, next: v }))} secureTextEntry hint={d.auth.passwordHint} />
              <Input label={d.auth.confirmPassword} value={pw.confirm} onChangeText={(v) => setPw((p) => ({ ...p, confirm: v }))} secureTextEntry error={pwError ?? undefined} />
              <Button label={d.common.save} variant="secondary" onPress={changePassword} disabled={!pw.current || !pw.next} />
            </Card>
          </>
        }
      />
    </Screen>
  );
}
