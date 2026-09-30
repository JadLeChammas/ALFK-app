import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AuthFrame } from '@/components/AuthFrame';
import { FieldRow, Button, Chip, Input, Row, Segmented } from '@/components/ui/primitives';
import { Select } from '@/components/ui/Select';
import { Flag } from '@/components/ui/Flag';
import { Txt } from '@/components/ui/Txt';
import { COUNTRIES, UNIVERSITIES } from '@/data/countries';
import { SELF_SIGNUP_ROLES } from '@/data/permissions';
import { useStore, type AuthError } from '@/data/store';
import type { Gender, Role } from '@/data/types';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

export default function SignUp() {
  const { d, lang } = useI18n();
  const { colors } = useTheme();
  const { actions } = useStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', gender: 'F' as Gender, role: 'alumni' as Role, promo: '', school: '', city: '', country: 'FR' });
  const [error, setError] = useState<AuthError | 'missing' | null>(null);
  const set = (k: keyof typeof form) => (v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setError(null);
  };

  const next = () => {
    if (!form.firstName || !form.lastName || !form.email || !form.password) return setError('missing');
    if (form.password.length < 8) return setError('weak_password');
    setStep(2);
  };

  const submit = () => {
    const promo = parseInt(form.promo, 10);
    const r = actions.signUp({
      ...form,
      promo: Number.isFinite(promo) ? promo : undefined,
      school: form.school || undefined,
      city: form.city || undefined,
    });
    if (!r.ok) {
      setError(r.error);
      if (r.error !== 'weak_password') setStep(1);
    }
  };

  const suggestions = UNIVERSITIES[form.country] ?? [];

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
        {[d.auth.step1, d.auth.step2].map((label, i) => {
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
          {error && <Txt variant="smallStrong" color="danger">{d.auth.errors[error]}</Txt>}
          <Button label={d.auth.continue} iconRight="arrow-right" full size="lg" onPress={next} />
        </View>
      ) : (
        <View style={{ gap: 16 }}>
          <Input label={d.auth.promo} icon="award" value={form.promo} onChangeText={set('promo')} keyboardType="number-pad" maxLength={4} placeholder="2020" />
          <Select
            label={d.auth.country}
            value={form.country}
            onChange={(c) => setForm((f) => ({ ...f, country: c }))}
            searchable
            options={COUNTRIES.map((c) => ({ value: c.code, label: c[lang], leading: <Flag code={c.code} /> }))}
          />
          <Input label={d.auth.city} icon="map-pin" value={form.city} onChangeText={set('city')} />
          <Input label={d.auth.school} icon="book" value={form.school} onChangeText={set('school')} />
          {suggestions.length > 0 && (
            <Row gap={6} wrap>
              {suggestions.slice(0, 5).map((s) => (
                <Chip key={s} label={s} active={form.school === s} onPress={() => setForm((f) => ({ ...f, school: s }))} />
              ))}
            </Row>
          )}
          {error && <Txt variant="smallStrong" color="danger">{d.auth.errors[error]}</Txt>}
          <Row gap={10}>
            <Button label={d.nav.back} variant="secondary" icon="arrow-left" size="lg" onPress={() => setStep(1)} />
            <Button label={d.auth.signUp} size="lg" onPress={submit} style={{ flex: 1 }} />
          </Row>
        </View>
      )}
    </AuthFrame>
  );
}
