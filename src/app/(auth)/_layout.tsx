import { Stack } from 'expo-router';

import { useTheme } from '@/theme/ThemeProvider';

export default function AuthLayout() {
  const { colors } = useTheme();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'fade' }}>
      {/* First screen = where visitors without an account land. */}
      <Stack.Screen name="bienvenue" />
      <Stack.Screen name="connexion" />
      <Stack.Screen name="inscription" />
      <Stack.Screen name="mot-de-passe-oublie" />
    </Stack>
  );
}
