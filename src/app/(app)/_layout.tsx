import { Stack } from 'expo-router';
import { useEffect } from 'react';

import { AppShell } from '@/components/shell/AppShell';
import { can, canSeeClubs, inCircle } from '@/data/permissions';
import { useMe, useStore } from '@/data/store';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

export default function MemberLayout() {
  const { colors } = useTheme();
  const me = useMe();
  const { actions } = useStore();
  const { lang } = useI18n();
  // Emails go out in French or English: the member's language on the site decides. The hidden
  // Lebanese mode (an easter egg, on this device only) leaves the emails' language as it was.
  const locale = lang === 'fr' ? 'fr' : 'en';
  useEffect(() => {
    if (lang === 'lb') return;
    if (me.locale !== locale) actions.setLocale(locale);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, me.locale, lang]);
  return (
    <AppShell>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'fade' }}>
        {/* First declared screen = where a fresh sign-in lands. */}
        <Stack.Screen name="index" />
        <Stack.Protected guard={me.role === 'admin'}>
          <Stack.Screen name="admin" />
        </Stack.Protected>
        <Stack.Protected guard={can(me, 'viewEvents')}>
          <Stack.Screen name="evenements/index" />
          <Stack.Screen name="evenements/[id]" />
        </Stack.Protected>
        <Stack.Protected guard={canSeeClubs(me)}>
          <Stack.Screen name="clubs/index" />
          <Stack.Screen name="clubs/[id]" />
        </Stack.Protected>
        <Stack.Protected guard={inCircle(me)}>
          <Stack.Screen name="cercle" />
        </Stack.Protected>
        <Stack.Protected guard={can(me, 'viewStats')}>
          <Stack.Screen name="statistiques" />
        </Stack.Protected>
      </Stack>
    </AppShell>
  );
}
