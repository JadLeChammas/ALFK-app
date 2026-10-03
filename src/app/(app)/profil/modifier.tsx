import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { PlaceSuggestions } from '@/components/PlaceSuggestions';
import { UniversityPicker } from '@/components/UniversityPicker';
import { useDialogs } from '@/components/ui/Dialogs';
import { FieldRow, Avatar, Button, Card, Input, Row, Segmented, Switch, Tap } from '@/components/ui/primitives';
import { BackLink, Columns, PageHeader, Screen } from '@/components/ui/Screen';
import { DateField, PhoneField } from '@/components/ui/fields';
import { Select } from '@/components/ui/Select';
import { Flag } from '@/components/ui/Flag';
import { Txt } from '@/components/ui/Txt';
import { sortedCountries } from '@/data/countries';
import { userFields } from '@/data/fields';
import { FieldsPicker } from '@/components/FieldsPicker';
import { formatPhone, isoToFrDate, isValidPhoneNumber, LFK_SCHOOL, parseFrDate, parsePhone, requiresContact } from '@/data/members';
import { fullName, useApprovedMembers, useMe, useStore } from '@/data/store';
import type { OtherSchool, Situation } from '@/data/types';
import { useI18n } from '@/i18n';
import { pickImages } from '@/lib/media';
import { useTheme } from '@/theme/ThemeProvider';
import { NationalityPicker } from '@/components/NationalityPicker';
import { CityPicker } from '@/components/CityPicker';
import { AvatarCropper } from '@/components/AvatarCropper';
import type { PickedImage } from '@/data/remote';
import { OtherSchoolsEditor } from '@/components/OtherSchools';

export default function EditProfile() {
  const { d, lang } = useI18n();
  const { colors } = useTheme();
  const { actions } = useStore();
  const { toast } = useDialogs();
  const me = useMe();
  const [form, setForm] = useState({
    firstName: me.firstName,
    lastName: me.lastName.toLocaleUpperCase('fr'),
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
  const [nationalities, setNationalities] = useState<string[]>(me.nationalities ?? []);
  const [otherSchools, setOtherSchools] = useState<OtherSchool[]>(me.otherSchools ?? []);
  const [fields, setFields] = useState<string[]>(userFields(me));
  const [schoolCountry, setSchoolCountry] = useState<string | undefined>(me.schoolCountry);
  // Former students share their studies with the lycée students (Orientation space).
  const graduate = me.role === 'alumni' || me.role === 'admin';
  // Honorary members (account created by an admin) give their organisation instead of studies.
  const honorary = me.role === 'honneur';
  // Universities and companies other members already entered (to pick the same spelling).
  const members = useApprovedMembers();
  const knownEmployers = members.map((u) => u.employer).filter((x): x is string => !!x);
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
      fieldOfStudy: graduate ? fields[0] : undefined,
      fields: graduate && fields.length ? fields : undefined,
      schoolCountry: form.school ? schoolCountry ?? form.country : undefined,
      mentor: graduate ? mentor : undefined,
      situation: graduate ? situation : undefined,
      employer: working || honorary ? form.employer.trim() || undefined : undefined,
      jobTitle: working ? form.jobTitle.trim() || undefined : undefined,
      nationalities: nationalities.length ? nationalities : undefined,
      otherSchools: me.role !== 'eleve' && otherSchools.length ? otherSchools : undefined,
    });
    if (!r.ok) {
      if (r.error === 'birth_date' || r.error === 'phone') setFieldError(r.error);
      else toast(d.auth.errors[r.error], 'danger');
      return;
    }
    toast(d.common.saved);
    if (router.canGoBack()) router.back();
    else router.replace('/profil');
  };

  const [uploading, setUploading] = useState(false);
  // A picked photo is adjusted (placed and zoomed) before being saved.
  const [cropping, setCropping] = useState<PickedImage | null>(null);
  const changePhoto = async () => {
    const [img] = await pickImages(false);
    if (img) setCropping(img);
  };
  const savePhoto = async (img: PickedImage) => {
    setCropping(null);
    // The new photo shows at once everywhere on this device; the upload follows.
    const previous = form.avatar;
    setForm((f) => ({ ...f, avatar: img.uri }));
    actions.previewAvatar(img.uri);
    setUploading(true);
    try {
      const url = await actions.uploadImage(img, 'avatars');
      setForm((f) => ({ ...f, avatar: url }));
      // Saved on the profile right away: no need to press « Enregistrer » for the photo.
      const r = actions.updateProfile({ avatar: url });
      toast(r.ok ? d.crop.saved : d.auth.errors.unknown, r.ok ? 'success' : 'danger');
    } catch (e) {
      setForm((f) => ({ ...f, avatar: previous }));
      if (previous) actions.previewAvatar(previous);
      toast(`${d.auth.errors.unknown} (${(e as Error)?.message ?? e})`, 'danger');
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
      {cropping && <AvatarCropper image={cropping} onCancel={() => setCropping(null)} onDone={savePhoto} />}
      <PageHeader title={d.profile.edit} right={<Button label={d.common.save} icon="check" onPress={save} />} />
      <Columns
        asideWidth={320}
        main={
          <Card style={{ gap: 16 }}>
            <Txt variant="h3">{d.profile.info}</Txt>
            <FieldRow>
              <Input label={d.auth.firstName} value={form.firstName} onChangeText={set('firstName')} containerStyle={{ flex: 1 }} />
              <Input label={d.auth.lastName} value={form.lastName} onChangeText={(v) => set('lastName')(v.toLocaleUpperCase('fr'))} autoCapitalize="characters" containerStyle={{ flex: 1 }} />
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
                <View style={{ flex: 1, gap: 8 }}>
                  <Input label={d.situation.employer} icon="briefcase" value={form.employer} onChangeText={set('employer')} />
                  <PlaceSuggestions value={form.employer} options={knownEmployers} onPick={set('employer')} max={4} />
                </View>
                <Input label={`${d.situation.jobTitle} (${d.common.optional})`} icon="award" value={form.jobTitle} onChangeText={set('jobTitle')} containerStyle={{ flex: 1 }} />
              </FieldRow>
            )}
            {honorary && <Input label={d.honoraryAdmin.organisation} icon="briefcase" value={form.employer} onChangeText={set('employer')} placeholder={d.honoraryAdmin.organisationPlaceholder} />}
            {!honorary && (
              <FieldRow>
                {me.role === 'eleve' ? (
                  <Input label={d.auth.school} icon="lock" value={LFK_SCHOOL} editable={false} hint={d.auth.schoolAuto} containerStyle={{ flex: 2 }} />
                ) : (
                  <View style={{ flex: 2 }}>
                    <UniversityPicker label={working ? d.situation.graduatedFrom : d.auth.school} optional={working} value={form.school} onChange={(v, cc) => { set('school')(v); setSchoolCountry(cc); }} country={form.country} city={form.city} />
                  </View>
                )}
                <Input label={d.profile.promoLabel} icon="award" value={form.promo} onChangeText={set('promo')} keyboardType="number-pad" maxLength={4} containerStyle={{ flex: 1 }} />
              </FieldRow>
            )}
            <FieldRow style={{ alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <CityPicker label={d.auth.city} value={form.city} onChange={set('city')} country={form.country} />
              </View>
              <View style={{ flex: 1 }}>
                <Select label={d.auth.country} value={form.country} onChange={set('country')} searchable options={sortedCountries(lang).map((c) => ({ value: c.code, label: c.name, leading: <Flag code={c.code} /> }))} />
              </View>
            </FieldRow>
            {me.role !== 'eleve' && !honorary && <OtherSchoolsEditor value={otherSchools} onChange={setOtherSchools} country={form.country} />}
            <NationalityPicker value={nationalities} onChange={setNationalities} />
            {graduate && (
              <>
                <FieldsPicker value={fields} onChange={setFields} />
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
              {!!form.avatar && <Button label={d.crop.adjust} variant="ghost" size="sm" icon="crop" onPress={() => setCropping({ uri: form.avatar as string })} />}
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
