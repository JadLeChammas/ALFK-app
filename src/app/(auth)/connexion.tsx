import { Feather } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AuthFrame } from '@/components/AuthFrame';
import { Button, Divider, Input, Row, Tap } from '@/components/ui/primitives';
import { Txt } from '@/components/ui/Txt';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '@/data/seed';
import { useStore, type AuthError } from '@/data/store';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

export default function SignIn() {
  const { d } = useI18n();
  const { colors } = useTheme();
  const { actions } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  const submit = (e = email, p = password) => {
    const r = actions.signIn(e, p);
    if (!r.ok) setError(r.error);
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
        <View style={{ gap: 12, padding: 16, borderRadius: 18, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.borderStrong }}>
          <Row gap={8}>
            <Feather name="zap" size={14} color={colors.warning} />
            <Txt variant="smallStrong">{d.auth.demoAccounts}</Txt>
            <Txt variant="small" color="textSubtle">· {DEMO_PASSWORD}</Txt>
          </Row>
          <Row gap={8} wrap>
            {demos.map(([label, mail]) => (
              <Button key={mail} label={label} size="sm" variant="secondary" onPress={() => submit(mail, DEMO_PASSWORD)} />
            ))}
          </Row>
        </View>
      }>
      <View style={{ gap: 16 }}>
        <Input label={d.auth.email} icon="mail" value={email} onChangeText={(v) => { setEmail(v); setError(null); }} autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholder={d.auth.emailPlaceholder} />
        <Input
          label={d.auth.password}
          icon="lock"
          value={password}
          onChangeText={(v) => { setPassword(v); setError(null); }}
          secureTextEntry={!show}
          autoComplete="password"
          onSubmitEditing={() => submit()}
          right={
            <Tap onPress={() => setShow((s) => !s)} hitSlop={8}>
              <Feather name={show ? 'eye-off' : 'eye'} size={17} color={colors.textSubtle} />
            </Tap>
          }
        />
        <Link href="/mot-de-passe-oublie" style={{ alignSelf: 'flex-end' }}>
          <Txt variant="smallStrong" color="primary">{d.auth.forgot}</Txt>
        </Link>
        {error && (
          <Row gap={8} style={{ backgroundColor: colors.dangerSoft, padding: 12, borderRadius: 12 }}>
            <Feather name="alert-circle" size={16} color={colors.danger} />
            <Txt variant="smallStrong" color="danger" style={{ flex: 1 }}>{d.auth.errors[error]}</Txt>
          </Row>
        )}
        <Button label={d.auth.signIn} onPress={() => submit()} full size="lg" disabled={!email || !password} />
        <Row gap={12}>
          <Divider style={{ flex: 1 }} />
          <Txt variant="small" color="textSubtle">{d.auth.noAccount}</Txt>
          <Divider style={{ flex: 1 }} />
        </Row>
        <Button label={d.auth.signUp} variant="secondary" full size="lg" onPress={() => router.push('/inscription')} />
      </View>
    </AuthFrame>
  );
}
