import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Switch, View } from 'react-native';

import { AuthFrame } from '@/components/AuthFrame';
import { NationalityPicker } from '@/components/NationalityPicker';
import { OtherSchoolsEditor } from '@/components/OtherSchools';
import { CityPicker } from '@/components/CityPicker';
import { UniversityPicker } from '@/components/UniversityPicker';
import { ProofPicker } from '@/components/ProofPicker';
import { Avatar, FieldRow, Button, Chip, Input, Row, Segmented, Tap } from '@/components/ui/primitives';
import { DateField, PhoneField } from '@/components/ui/fields';
import { Select } from '@/components/ui/Select';
import { Flag } from '@/components/ui/Flag';
import { Txt } from '@/components/ui/Txt';
import { sortedCountries } from '@/data/countries';
import { FIELDS } from '@/data/fields';
import { formatPhone, isValidPhoneNumber, LFK_SCHOOL, parseFrDate } from '@/data/members';
import { SELF_SIGNUP_ROLES } from '@/data/permissions';
import type { PickedDoc, PickedImage } from '@/data/remote';
import { pickImages } from '@/lib/media';
import { useStore, type AuthError } from '@/data/store';
import type { Gender, OtherSchool, Role, Situation } from '@/data/types';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { AvatarCropper } from '@/components/AvatarCropper';

export default function SignUp() {
  const { d, lang } = useI18n();
  const { colors } = useTheme();
  const { actions } = useStore();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [proof, setProof] = useState<PickedDoc | null>(null);
  // Same questions as the profile: nationalities, photo, a few words, and (alumni) answering students.
  const [nationalities, setNationalities] = useState<string[]>([]);
  const [otherSchools, setOtherSchools] = useState<OtherSchool[]>([]);
  const [photo, setPhoto] = useState<PickedImage | null>(null);
  const [bio, setBio] = useState('');
  const [mentor, setMentor] = useState(false);
  const [cropping, setCropping] = useState<PickedImage | null>(null);
  const choosePhoto = async () => {
    const [img] = await pickImages(false);
    if (img) setCropping(img);
  };
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', gender: 'F' as Gender, role: 'alumni' as Role, promo: '', school: '', city: '', country: 'FR', birth: '', dial: '+965', phoneNumber: '', fieldOfStudy: '', situation: 'student' as Situation, employer: '', jobTitle: '' });
  const [error, setError] = useState<AuthError | 'missing' | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const set = (k: keyof typeof form) => (v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setError(null);
  };

  const next = () => {
    if (!form.firstName || !form.lastName || !form.email || !form.password) return setError('missing');
    if (form.password.length < 8) return setError('weak_password');
    if (!parseFrDate(form.birth)) return setError('birth_date');
    if (!isValidPhoneNumber(form.phoneNumber)) return setError('phone');
    setStep(2);
  };

  const [busy, setBusy] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState(false);

  const submit = async () => {
    // The proof of schooling is mandatory: no account without it.
    if (!proof) return setError('proof');
    const promo = parseInt(form.promo, 10);
    setBusy(true);
    const { birth, dial, phoneNumber, fieldOfStudy, situation, employer, jobTitle, ...rest } = form;
    const alumni = form.role === 'alumni';
    const working = alumni && situation === 'working';
    const r = await actions.signUp({
      ...rest,
      fieldOfStudy: alumni && fieldOfStudy ? fieldOfStudy : undefined,
      situation: alumni ? situation : undefined,
      employer: working ? employer.trim() || undefined : undefined,
      jobTitle: working ? jobTitle.trim() || undefined : undefined,
      promo: Number.isFinite(promo) ? promo : undefined,
      school: form.role === 'eleve' ? LFK_SCHOOL : form.school || undefined,
      city: form.city || undefined,
      birthDate: parseFrDate(birth) ?? undefined,
      phone: formatPhone(dial, phoneNumber),
      nationalities: nationalities.length ? nationalities : undefined,
      bio: bio.trim() || undefined,
      mentor: alumni ? mentor : undefined,
      otherSchools: alumni && otherSchools.length ? otherSchools : undefined,
    }, proof, photo);
    setBusy(false);
    if (!r.ok) {
      setError(r.error);
      if (r.error !== 'weak_password' && r.error !== 'unknown' && r.error !== 'proof') setStep(1);
    } else if (r.confirmEmail) {
      setConfirmEmail(true);
    }
  };

  if (confirmEmail) {
    return (
      <AuthFrame title={d.auth.confirmTitle} subtitle={d.auth.confirmSub}>
        <Button label={d.auth.backToSignIn} full size="lg" onPress={() => router.replace('/connexion')} />
      </AuthFrame>
    );
  }


  return (
    <AuthFrame
      title={d.auth.signUpTitle}
      subtitle={d.auth.signUpSub}
      footer={
        <Row gap={6} style={{ justifyContent: 'center' }}>
          <Txt variant="small" color="textMuted">{d.auth.haveAccount}</Txt>
          <Txt variant="smallStrong" color="primary" onPress={() => router.replace('/connexion')}>{d.auth.signIn}</Txt>
        </Row>
      }>
      <Row gap={8}>
        {[d.auth.step1, d.auth.step2, d.auth.step3].map((label, i) => {
          const active = step === i + 1;
          const done = step > i + 1;
          return (
            <View key={label} style={{ flex: 1, gap: 8 }}>
              <View style={{ height: 4, borderRadius: 2, backgroundColor: active || done ? colors.primary : colors.border }} />
              <Txt variant="smallStrong" color={active ? 'text' : 'textSubtle'}>{`${i + 1}. ${label}`}</Txt>
            </View>
          );
        })}
      </Row>

      {step === 1 ? (
        <View style={{ gap: 16 }}>
          <FieldRow>
            <Input label={d.auth.firstName} value={form.firstName} onChangeText={set('firstName')} containerStyle={{ flex: 1 }} autoComplete="given-name" />
            <Input label={d.auth.lastName} value={form.lastName} onChangeText={set('lastName')} containerStyle={{ flex: 1 }} autoComplete="family-name" />
          </FieldRow>
          <Input label={d.auth.email} icon="mail" value={form.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
          <Input label={d.auth.password} icon="lock" value={form.password} onChangeText={set('password')} secureTextEntry hint={d.auth.passwordHint} autoComplete="new-password" />
          <DateField label={d.auth.birthDate} value={form.birth} onChange={set('birth')} required error={error === 'birth_date' ? d.auth.errors.birth_date : undefined} />
          <PhoneField
            label={d.auth.phone}
            dial={form.dial}
            number={form.phoneNumber}
            onDial={set('dial')}
            onNumber={set('phoneNumber')}
            required
            error={error === 'phone' ? d.auth.errors.phone : undefined}
          />
          <View style={{ gap: 8 }}>
            <Txt variant="smallStrong" color="textMuted">{d.auth.gender}</Txt>
            <Segmented value={form.gender} onChange={(g) => setForm((f) => ({ ...f, gender: g }))} options={[{ value: 'F', label: d.gender.F }, { value: 'M', label: d.gender.M }]} />
            <Row gap={6}>
              <Feather name="lock" size={12} color={colors.textSubtle} />
              <Txt variant="small" color="textSubtle">{d.auth.genderLocked}</Txt>
            </Row>
          </View>
          <View style={{ gap: 8 }}>
            <Txt variant="smallStrong" color="textMuted">{d.auth.status}</Txt>
            <Row gap={8} wrap>
              {SELF_SIGNUP_ROLES.map((r) => (
                <Chip key={r} label={d.roles[r]} active={form.role === r} onPress={() => setForm((f) => ({ ...f, role: r }))} />
              ))}
            </Row>
          </View>
          {error && error !== 'birth_date' && error !== 'phone' && <Txt variant="smallStrong" color="danger">{d.auth.errors[error]}</Txt>}
          <Button label={d.auth.continue} iconRight="arrow-right" full size="lg" onPress={next} />
        </View>
      ) : step === 2 ? (
        <View style={{ gap: 16 }}>
          <Input label={d.auth.promo} icon="award" value={form.promo} onChangeText={set('promo')} keyboardType="number-pad" maxLength={4} placeholder="2020" />
          {form.role === 'alumni' && (
            <View style={{ gap: 8 }}>
              <Txt variant="smallStrong" color="textMuted">{d.situation.label}</Txt>
              <Segmented
                value={form.situation}
                onChange={(v) => setForm((f) => ({ ...f, situation: v }))}
                options={[
                  { value: 'student', label: d.situation.student, icon: 'book-open' },
                  { value: 'working', label: d.situation.working, icon: 'briefcase' },
                ]}
              />
              <Txt variant="small" color="textSubtle">{d.situation.whereHint}</Txt>
            </View>
          )}
          <Select
            label={d.auth.country}
            value={form.country}
            onChange={(c) => setForm((f) => ({ ...f, country: c }))}
            searchable
            options={sortedCountries(lang).map((c) => ({ value: c.code, label: c.name, leading: <Flag code={c.code} /> }))}
          />
          <CityPicker label={d.auth.city} value={form.city} onChange={set('city')} country={form.country} />
          {form.role === 'eleve' ? (
            // Students are at the LFK: the school is set for them and cannot be changed.
            <Input label={d.auth.school} icon="lock" value={LFK_SCHOOL} editable={false} hint={d.auth.schoolAuto} />
          ) : form.situation === 'working' ? (
            <>
              <Input label={d.situation.employer} icon="briefcase" value={form.employer} onChangeText={set('employer')} />
              <Input label={d.situation.jobTitle} icon="award" value={form.jobTitle} onChangeText={set('jobTitle')} />
              <UniversityPicker label={d.situation.graduatedFrom} value={form.school} onChange={set('school')} country={form.country} city={form.city} />
            </>
          ) : (
            <UniversityPicker label={d.auth.school} value={form.school} onChange={set('school')} country={form.country} city={form.city} />
          )}
          {form.role === 'alumni' && <OtherSchoolsEditor value={otherSchools} onChange={setOtherSchools} country={form.country} />}
          <NationalityPicker value={nationalities} onChange={setNationalities} />
          {step === 2 && error === 'missing' && (
            <Txt variant="smallStrong" color="danger">{missingFields.length ? `${d.auth.errors.missing} — ${missingFields.join(', ')}` : d.auth.errors.missing}</Txt>
          )}
          {form.role === 'alumni' && (
            <Select
              label={d.orientation.field}
              value={form.fieldOfStudy}
              onChange={set('fieldOfStudy')}
              options={FIELDS.map((k) => ({ value: k, label: d.fields[k] }))}
              placeholder={d.orientation.field}
            />
          )}
          {form.role === 'alumni' && (
            <Row gap={12} style={{ padding: 14, borderRadius: 14, backgroundColor: colors.surfaceAlt }}>
              <Feather name="compass" size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Txt variant="bodyStrong">{d.profile.mentor}</Txt>
                <Txt variant="small" color="textMuted">{d.profile.mentorHint}</Txt>
              </View>
              <Switch value={mentor} onValueChange={setMentor} />
            </Row>
          )}
          <Row gap={10}>
            <Button label={d.nav.back} variant="secondary" icon="arrow-left" size="lg" onPress={() => setStep(1)} />
            <Button
              label={d.auth.continue}
              iconRight="arrow-right"
              size="lg"
              style={{ flex: 1 }}
              onPress={() => {
                // Every field of this step is required, except other universities (exchange…), the photo and the bio.
                const alumni = form.role === 'alumni';
                const working = alumni && form.situation === 'working';
                const year = parseInt(form.promo, 10);
                const lacking = [
                  !(year >= 1960 && year <= new Date().getFullYear() + 6) && d.auth.promo,
                  !form.country && d.auth.country,
                  !form.city.trim() && d.auth.city,
                  alumni && !form.school.trim() && (working ? d.situation.graduatedFrom : d.auth.school),
                  working && !form.employer.trim() && d.situation.employer,
                  working && !form.jobTitle.trim() && d.situation.jobTitle,
                  alumni && !form.fieldOfStudy && d.orientation.field,
                  nationalities.length === 0 && d.nat.label,
                ].filter((x): x is string => !!x);
                setMissingFields(lacking);
                if (lacking.length) return setError('missing');
                setStep(3);
              }}
            />
          </Row>
        </View>
      ) : (
        <View style={{ gap: 16 }}>
          <Row gap={16} style={{ padding: 14, borderRadius: 18, backgroundColor: colors.surfaceAlt }}>
            <Tap onPress={choosePhoto} accessibilityLabel={d.profile.changePhoto}>
              <Avatar uri={photo?.uri} name={`${form.firstName} ${form.lastName}`.trim() || '?'} size={72} />
              <View style={{ position: 'absolute', right: -2, bottom: -2, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.surface }}>
                <Feather name="camera" size={13} color="#fff" />
              </View>
            </Tap>
            <View style={{ flex: 1, gap: 6 }}>
              <Txt variant="bodyStrong">{`${d.auth.photo} (${d.common.optional})`}</Txt>
              <Button label={photo ? d.profile.changePhoto : d.auth.addPhoto} icon="image" size="sm" variant="secondary" onPress={choosePhoto} style={{ alignSelf: 'flex-start' }} />
            </View>
          </Row>
          {cropping && <AvatarCropper image={cropping} onCancel={() => setCropping(null)} onDone={(img) => { setPhoto(img); setCropping(null); }} />}
          <Input label={`${d.profile.bio} (${d.common.optional})`} value={bio} onChangeText={setBio} multiline maxLength={600} />
          <ProofPicker value={proof} onChange={(p) => { setProof(p); setError(null); }} error={error === 'proof'} />
          <Row gap={8} style={{ alignItems: 'flex-start' }}>
            <Feather name="lock" size={13} color={colors.textSubtle} style={{ marginTop: 2 }} />
            <Txt variant="small" color="textSubtle" style={{ flex: 1 }}>{d.proof.privacy}</Txt>
          </Row>
          {error && error !== 'proof' && <Txt variant="smallStrong" color="danger">{d.auth.errors[error]}</Txt>}
          <Row gap={10}>
            <Button label={d.nav.back} variant="secondary" icon="arrow-left" size="lg" onPress={() => setStep(2)} />
            <Button label={d.auth.signUp} size="lg" onPress={submit} style={{ flex: 1 }} loading={busy} disabled={!proof} />
          </Row>
        </View>
      )}
    </AuthFrame>
  );
}
