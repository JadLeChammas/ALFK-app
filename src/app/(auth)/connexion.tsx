import { Feather } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useRef, useState } from 'react';
import { Platform, View, type TextInput } from 'react-native';

import { AuthFrame } from '@/components/AuthFrame';
import { CredentialForm, offerToSavePassword, type CredentialFormHandle } from '@/components/ui/CredentialForm';
import { Button, Divider, Input, Row, Tap } from '@/components/ui/primitives';
import { Txt } from '@/components/ui/Txt';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '@/data/seed';
import { useStore, type AuthError } from '@/data/store';
import { useDemoVisible } from '@/data/demoSetting';
import { enterDemo, getRemember, getRememberedEmail, isDemoForced, setRemember, setRememberedEmail } from '@/lib/supabase';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

export default function SignIn() {
  const demoVisible = useDemoVisible();
  const { d } = useI18n();
  const { colors } = useTheme();
  const { actions, isRemote } = useStore();
  const [email, setEmail] = useState(getRememberedEmail);
  const passwordRef = useRef<TextInput>(null);
  const formRef = useRef<CredentialFormHandle>(null);
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [remember, setRememberState] = useState(getRemember);
  const [error, setError] = useState<AuthError | null>(null);
  const [busy, setBusy] = useState(false);

  /** `fromForm`: typed in the form (not a demo button) — then the browser is asked to save the login. */
  const submit = async (e = email, p = password, fromForm = false) => {
    setBusy(true);
    setRemember(remember);
    const r = await actions.signIn(e, p);
    setBusy(false);
    if (!r.ok) return setError(r.error);
    setRememberedEmail(remember ? e.trim() : null);
    if (fromForm) void offerToSavePassword(e.trim(), p);
  };
  // The form was sent (button, « Enter », or the browser's own autofill submit).
  const onFormSubmit = () => {
    if (busy || !email.trim() || !password) return;
    void submit(email, password, true);
  };

  const demos: [string, string][] = [
    [d.auth.demoAdmin, DEMO_ACCOUNTS.admin],
    [d.auth.demoMember, DEMO_ACCOUNTS.member],
    [d.auth.demoEleve, DEMO_ACCOUNTS.eleve],
    [d.auth.demoDirection, DEMO_ACCOUNTS.direction],
    [d.auth.demoPending, DEMO_ACCOUNTS.pending],
  ];

  return (
    <AuthFrame
      title={d.auth.welcome}
      subtitle={d.auth.welcomeSub}
      footer={
        isRemote ? (
          Platform.OS === 'web' && demoVisible && (
            <View style={{ gap: 10, padding: 16, borderRadius: 18, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.borderStrong }}>
              <Row gap={8}>
                <Feather name="play-circle" size={15} color={colors.primary} />
                <Txt variant="smallStrong">{d.demo.tryTitle}</Txt>
              </Row>
              <Txt variant="small" color="textMuted">{d.demo.trySub}</Txt>
              <Button label={d.demo.tryButton} icon="eye" variant="soft" size="sm" onPress={enterDemo} />
            </View>
          )
        ) : (
        <View style={{ gap: 12, padding: 16, borderRadius: 18, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.borderStrong }}>
          <Row gap={8}>
            <Feather name="zap" size={14} color={colors.warning} />
            <Txt variant="smallStrong">{isDemoForced ? d.demo.badge : d.auth.demoAccounts}</Txt>
            <Txt variant="small" color="textSubtle">· {DEMO_PASSWORD}</Txt>
          </Row>
          <Row gap={8} wrap>
            {demos.map(([label, mail]) => (
              <Button key={mail} label={label} size="sm" variant="secondary" onPress={() => submit(mail, DEMO_PASSWORD)} />
            ))}
          </Row>
        </View>
        )
      }>
      <CredentialForm ref={formRef} onSubmit={onFormSubmit}>
      <View style={{ gap: 16 }}>
        {/* « username » + « current-password » in a real form: password managers (iCloud Keychain, Chrome, 1Password…) offer to save and fill them in. */}
        <Input
          label={d.auth.email}
          icon="mail"
          value={email}
          onChangeText={(v) => { setEmail(v); setError(null); }}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          autoComplete="username"
          textContentType="username"
          nativeID="email"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          placeholder={d.auth.emailPlaceholder}
        />
        <Input
          label={d.auth.password}
          icon="lock"
          value={password}
          onChangeText={(v) => { setPassword(v); setError(null); }}
          ref={passwordRef}
          secureTextEntry={!show}
          autoComplete="current-password"
          textContentType="password"
          nativeID="password"
          returnKeyType="go"
          onSubmitEditing={() => formRef.current?.submit()}
          right={
            <Tap onPress={() => setShow((s) => !s)} hitSlop={8}>
              <Feather name={show ? 'eye-off' : 'eye'} size={17} color={colors.textSubtle} />
            </Tap>
          }
        />
        <Row style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <Tap onPress={() => setRememberState((v) => !v)} accessibilityRole="checkbox" aria-checked={remember}>
            <Row gap={8}>
              <View style={{ width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: remember ? colors.primary : colors.borderStrong, backgroundColor: remember ? colors.primary : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                {remember && <Feather name="check" size={13} color="#fff" />}
              </View>
              <Txt variant="small">{d.auth.remember}</Txt>
            </Row>
          </Tap>
          <Link href="/mot-de-passe-oublie">
            <Txt variant="smallStrong" color="primary">{d.auth.forgot}</Txt>
          </Link>
        </Row>
        {error && (
          <Row gap={8} style={{ backgroundColor: colors.dangerSoft, padding: 12, borderRadius: 12 }}>
            <Feather name="alert-circle" size={16} color={colors.danger} />
            <Txt variant="smallStrong" color="danger" style={{ flex: 1 }}>{d.auth.errors[error]}</Txt>
          </Row>
        )}
        <Button label={d.auth.signIn} onPress={() => formRef.current?.submit()} full size="lg" disabled={!email || !password} loading={busy} />
        <Row gap={12}>
          <Divider style={{ flex: 1 }} />
          <Txt variant="small" color="textSubtle">{d.auth.noAccount}</Txt>
          <Divider style={{ flex: 1 }} />
        </Row>
        <Button label={d.auth.signUp} variant="secondary" full size="lg" onPress={() => router.push('/inscription')} />
      </View>
      </CredentialForm>
    </AuthFrame>
  );
}
