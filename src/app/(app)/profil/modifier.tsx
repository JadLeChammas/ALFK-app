import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { useDialogs } from '@/components/ui/Dialogs';
import { FieldRow, Avatar, Button, Card, Input, Row, Segmented, Switch, Tap } from '@/components/ui/primitives';
import { BackLink, Columns, PageHeader, Screen } from '@/components/ui/Screen';
import { DateField, PhoneField } from '@/components/ui/fields';
import { Select } from '@/components/ui/Select';
import { Flag } from '@/components/ui/Flag';
import { Txt } from '@/components/ui/Txt';
import { COUNTRIES } from '@/data/countries';
import { FIELDS } from '@/data/fields';
import { formatPhone, isoToFrDate, isValidPhoneNumber, LFK_SCHOOL, parseFrDate, parsePhone, requiresContact } from '@/data/members';
import { fullName, useMe, useStore } from '@/data/store';
import type { Situation } from '@/data/types';
import { useI18n } from '@/i18n';
import { pickImages } from '@/lib/media';
import { useTheme } from '@/theme/ThemeProvider';

export default function EditProfile() {
  const { d, country } = useI18n();
  const { colors } = useTheme();
  const { actions } = useStore();
  const { toast } = useDialogs();
  const me = useMe();
  const [form, setForm] = useState({
    firstName: me.firstName,
    lastName: me.lastName,
    dial: parsePhone(me.phone).dial,
    phoneNumber: parsePhone(me.phone).number,
    birth: isoToFrDate(me.birthDate),
    school: me.role === 'eleve' ? LFK_SCHOOL : me.school ?? '',
    promo: me.promo ? String(me.promo) : '',
    city: me.city ?? '',
    country: me.country ?? 'FR',
    bio: me.bio ?? '',
    avatar: me.avatar,
    fieldOfStudy: me.fieldOfStudy ?? '',
    employer: me.employer ?? '',
    jobTitle: me.jobTitle ?? '',
  });
  const [mentor, setMentor] = useState(!!me.mentor);
  // Former students share their studies with the lycée students (Orientation space).
  const graduate = me.role === 'alumni' || me.role === 'admin';
  const [situation, setSituation] = useState<Situation>(me.situation ?? 'student');
  const working = graduate && situation === 'working';
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwError, setPwError] = useState<string | null>(null);

  const [fieldError, setFieldError] = useState<'birth_date' | 'phone' | null>(null);
  const mandatory = requiresContact(me.role);

  const save = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) return;
    const promo = parseInt(form.promo, 10);
    const birthDate = form.birth ? parseFrDate(form.birth) : undefined;
    if (birthDate === null || (mandatory && !birthDate)) return setFieldError('birth_date');
    const hasPhone = form.phoneNumber.trim() !== '';
    if ((mandatory || hasPhone) && !isValidPhoneNumber(form.phoneNumber)) return setFieldError('phone');
    const { dial, phoneNumber, birth, ...rest } = form;
    const r = actions.updateProfile({
      ...rest,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      promo: Number.isFinite(promo) ? promo : undefined,
      birthDate,
      phone: hasPhone ? formatPhone(dial, phoneNumber) : undefined,
      school: form.school || undefined,
      city: form.city || undefined,
      bio: form.bio || undefined,
      fieldOfStudy: graduate ? form.fieldOfStudy || undefined : undefined,
      mentor: graduate ? mentor : undefined,
      situation: graduate ? situation : undefined,
      employer: working ? form.employer.trim() || undefined : undefined,
      jobTitle: working ? form.jobTitle.trim() || undefined : undefined,
    });
    if (!r.ok) {
      if (r.error === 'birth_date' || r.error === 'phone') setFieldError(r.error);
      else toast(d.auth.errors[r.error], 'danger');
      return;
    }
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
              <PhoneField
                label={d.profile.phone}
                dial={form.dial}
                number={form.phoneNumber}
                onDial={set('dial')}
                onNumber={(v) => { set('phoneNumber')(v); setFieldError(null); }}
                required={mandatory}
                error={fieldError === 'phone' ? d.auth.errors.phone : undefined}
              />
              <DateField
                label={d.profile.birthDate}
                value={form.birth}
                onChange={(v) => { set('birth')(v); setFieldError(null); }}
                required={mandatory}
                error={fieldError === 'birth_date' ? d.auth.errors.birth_date : undefined}
              />
            </FieldRow>
            {graduate && (
              <View style={{ gap: 8 }}>
                <Txt variant="smallStrong" color="textMuted">{d.situation.label}</Txt>
                <Segmented
                  value={situation}
                  onChange={setSituation}
                  options={[
                    { value: 'student', label: d.situation.student, icon: 'book-open' },
                    { value: 'working', label: d.situation.working, icon: 'briefcase' },
                  ]}
                />
              </View>
            )}
            {working && (
              <FieldRow>
                <Input label={d.situation.employer} icon="briefcase" value={form.employer} onChangeText={set('employer')} containerStyle={{ flex: 1 }} />
                <Input label={`${d.situation.jobTitle} (${d.common.optional})`} icon="award" value={form.jobTitle} onChangeText={set('jobTitle')} containerStyle={{ flex: 1 }} />
              </FieldRow>
            )}
            <FieldRow>
              {me.role === 'eleve' ? (
                <Input label={d.auth.school} icon="lock" value={LFK_SCHOOL} editable={false} hint={d.auth.schoolAuto} containerStyle={{ flex: 2 }} />
              ) : (
                <Input label={working ? `${d.situation.graduatedFrom} (${d.common.optional})` : d.auth.school} icon="book" value={form.school} onChangeText={set('school')} containerStyle={{ flex: 2 }} />
              )}
              <Input label={d.profile.promoLabel} icon="award" value={form.promo} onChangeText={set('promo')} keyboardType="number-pad" maxLength={4} containerStyle={{ flex: 1 }} />
            </FieldRow>
            <FieldRow style={{ alignItems: 'flex-start' }}>
              <Input label={d.auth.city} icon="map-pin" value={form.city} onChangeText={set('city')} containerStyle={{ flex: 1 }} />
              <View style={{ flex: 1 }}>
                <Select label={d.auth.country} value={form.country} onChange={set('country')} searchable options={COUNTRIES.map((c) => ({ value: c.code, label: country(c.code), leading: <Flag code={c.code} /> }))} />
              </View>
            </FieldRow>
            {graduate && (
              <>
                <Select
                  label={d.orientation.field}
                  value={form.fieldOfStudy}
                  onChange={set('fieldOfStudy')}
                  options={[{ value: '', label: '—' }, ...FIELDS.map((k) => ({ value: k, label: d.fields[k] }))]}
                />
                <Row gap={12} style={{ padding: 14, borderRadius: 14, backgroundColor: colors.surfaceAlt }}>
                  <Feather name="compass" size={18} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Txt variant="bodyStrong">{d.profile.mentor}</Txt>
                    <Txt variant="small" color="textMuted">{d.profile.mentorHint}</Txt>
                  </View>
                  <Switch value={mentor} onValueChange={setMentor} />
                </Row>
              </>
            )}
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
