import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';

import { AuthFrame } from '@/components/AuthFrame';
import { Button } from '@/components/ui/primitives';
import { callEmailApi } from '@/data/remote';
import { useStore } from '@/data/store';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

/** The unsubscribe link of the news emails (signed, no sign-in needed). Public page. */
export default function Unsubscribe() {
  const { d } = useI18n();
  const { colors } = useTheme();
  const { isRemote } = useStore();
  const { u, t } = useLocalSearchParams<{ u?: string; t?: string }>();
  const valid = isRemote && !!u && !!t;
  const [result, setResult] = useState<'done' | 'error' | null>(null);
  const state = !valid ? 'error' : (result ?? 'busy');

  useEffect(() => {
    if (valid) callEmailApi('unsubscribe', { u, t }, false).then((r) => setResult(r.ok ? 'done' : 'error'));
  }, [valid, u, t]);

  return (
    <AuthFrame title={d.emails.unsubTitle} subtitle={state === 'done' ? d.emails.unsubDone : state === 'error' ? d.emails.unsubError : undefined}>
      {state === 'busy' ? <ActivityIndicator color={colors.primary} /> : <Button label={d.nav.home} full onPress={() => router.replace('/')} />}
    </AuthFrame>
  );
}
