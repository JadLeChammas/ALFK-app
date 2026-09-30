import { useState } from 'react';
import { View } from 'react-native';

import { AuthFrame } from '@/components/AuthFrame';
import { Button, Input } from '@/components/ui/primitives';
import { Txt } from '@/components/ui/Txt';
import { useStore } from '@/data/store';
import { useI18n } from '@/i18n';

/** Reached only through a recovery session (the e-mailed reset link), which overrides every other state. */
export default function NewPassword() {
  const { d } = useI18n();
  const { me, actions } = useStore();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (pw !== pw2) return setError(d.auth.errors.mismatch);
    const r = actions.completeRecovery(pw);
    if (!r.ok) setError(d.auth.errors[r.error]);
  };

  return (
    <AuthFrame title={d.auth.recoveryTitle} subtitle={d.auth.recoverySub}>
      <View style={{ gap: 16 }}>
        <Txt variant="smallStrong" color="textMuted">{me?.email}</Txt>
        <Input label={d.auth.newPassword} icon="lock" value={pw} onChangeText={(v) => { setPw(v); setError(null); }} secureTextEntry hint={d.auth.passwordHint} autoComplete="new-password" />
        <Input label={d.auth.confirmPassword} icon="lock" value={pw2} onChangeText={(v) => { setPw2(v); setError(null); }} secureTextEntry onSubmitEditing={submit} error={error ?? undefined} />
        <Button label={d.common.save} full size="lg" onPress={submit} disabled={!pw || !pw2} />
        <Button label={d.common.cancel} variant="ghost" full onPress={actions.signOut} />
      </View>
    </AuthFrame>
  );
}
