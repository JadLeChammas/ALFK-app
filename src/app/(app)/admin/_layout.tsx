import { Stack } from 'expo-router';

import { useTheme } from '@/theme/ThemeProvider';

/** Only mounted for admins — see Stack.Protected in (app)/_layout.tsx. */
export default function AdminLayout() {
  const { colors } = useTheme();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'fade' }} />;
}
