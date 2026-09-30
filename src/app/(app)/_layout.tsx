import { Stack } from 'expo-router';

import { AppShell } from '@/components/shell/AppShell';
import { can } from '@/data/permissions';
import { useMe } from '@/data/store';
import { useTheme } from '@/theme/ThemeProvider';

export default function MemberLayout() {
  const { colors } = useTheme();
  const me = useMe();
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
        <Stack.Protected guard={can(me, 'viewStats')}>
          <Stack.Screen name="statistiques" />
        </Stack.Protected>
      </Stack>
    </AppShell>
  );
}
