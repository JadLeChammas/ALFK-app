import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { useDialogs } from '@/components/ui/Dialogs';
import { Button, Input, Tap } from '@/components/ui/primitives';
import { Txt } from '@/components/ui/Txt';
import { useStore } from '@/data/store';
import { useI18n } from '@/i18n';

/**
 * The code e-mailed by Supabase to confirm the address. Once it is right, the member is signed in and
 * their request goes to the admins (sign-up), or they can carry on (sign-in before confirming).
 */
export function VerifyEmailCode({ email, extras, startWait = 60 }: { email: string; extras?: { locale?: 'fr' | 'en'; marketing?: boolean }; startWait?: number }) {
  const { d, f } = useI18n();
  const v = d.verify;
  const { actions } = useStore();
  const { toast } = useDialogs();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  // Sign-up: the code was just sent, « send again » after a minute. Sign-in: available at once.
  const [wait, setWait] = useState(startWait);
  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const check = async () => {
    setBusy(true);
    const r = await actions.verifyEmailCode(email, code, extras);
    setBusy(false);
    if (!r.ok) setError(true);
  };
  const resend = async () => {
    const r = await actions.resendEmailCode(email);
    toast(r.ok ? v.resent : d.auth.errors.unknown, r.ok ? 'success' : 'danger');
    setWait(60);
  };

  return (
    <View style={{ gap: 14 }}>
      <Txt color="textMuted">{f(v.sentTo, { email })}</Txt>
      <Input
        label={v.code}
        icon="key"
        value={code}
        onChangeText={(t) => {
          setCode(t.replace(/\D/g, '').slice(0, 10));
          setError(false);
        }}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        maxLength={10}
        placeholder="123456"
        onSubmitEditing={check}
        error={error ? v.wrong : undefined}
      />
      <Button label={v.confirm} icon="check" full size="lg" onPress={check} loading={busy} disabled={code.length < 6} />
      {wait > 0 ? (
        <Txt variant="small" color="textSubtle" align="center">{f(v.resendIn, { s: wait })}</Txt>
      ) : (
        <Tap onPress={resend} style={{ alignSelf: 'center' }}>
          <Txt variant="smallStrong" color="primary">{v.resend}</Txt>
        </Tap>
      )}
      <Txt variant="small" color="textSubtle" align="center">{v.spamHint}</Txt>
    </View>
  );
}
