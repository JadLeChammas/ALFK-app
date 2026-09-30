import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AuthFrame } from '@/components/AuthFrame';
import { Button, Input } from '@/components/ui/primitives';
import { Txt } from '@/components/ui/Txt';
import { useStore, type AuthError } from '@/data/store';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

export default function ForgotPassword() {
  const { d } = useI18n();
  const { colors } = useTheme();
  const { actions } = useStore();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  const submit = () => {
    const r = actions.requestPasswordReset(email);
    if (r.ok) setSent(true);
    else setError(r.error);
  };

  if (sent) {
    return (
      <AuthFrame title={d.auth.linkSent} subtitle={d.auth.linkSentSub}>
        <View style={{ gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, backgroundColor: colors.successSoft }}>
            <Feather name="mail" size={20} color={colors.success} />
            <Txt variant="bodyStrong" style={{ flex: 1 }}>{email}</Txt>
          </View>
          <Button label={d.auth.openDemoLink} icon="external-link" full size="lg" onPress={() => actions.openRecoveryLink(email)} />
          <Button label={d.auth.backToSignIn} variant="ghost" full onPress={() => router.replace('/connexion')} />
        </View>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame title={d.auth.forgotTitle} subtitle={d.auth.forgotSub}>
      <View style={{ gap: 16 }}>
        <Input label={d.auth.email} icon="mail" value={email} onChangeText={(v) => { setEmail(v); setError(null); }} autoCapitalize="none" keyboardType="email-address" onSubmitEditing={submit} error={error ? d.auth.errors[error] : undefined} />
        <Button label={d.auth.sendLink} full size="lg" onPress={submit} disabled={!email} />
        <Button label={d.auth.backToSignIn} variant="ghost" icon="arrow-left" full onPress={() => router.replace('/connexion')} />
      </View>
    </AuthFrame>
  );
}
