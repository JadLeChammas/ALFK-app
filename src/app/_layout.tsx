import {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { DemoBadge } from '@/components/DemoBadge';
import { DialogProvider, useDialogs } from '@/components/ui/Dialogs';
import { StoreProvider, useStore } from '@/data/store';
import { I18nProvider, useI18n } from '@/i18n';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <StoreProvider>
          <DialogProvider>
            <RootNavigator />
            <StoreErrorToast />
            <DemoBadge />
          </DialogProvider>
        </StoreProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

function RootNavigator() {
  const { scheme, colors } = useTheme();
  const { ready, session, me } = useStore();
  const [fontsLoaded] = useFonts({ PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold });
  const loaded = ready && fontsLoaded;

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);

  if (!loaded) return null;

  // Access states — evaluated in priority order. A recovery session overrides everything else.
  const recovery = !!session?.recovery && !!me;
  const signedIn = !!me && !recovery;
  const approved = signedIn && me.approved;

  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = { ...base, colors: { ...base.colors, background: colors.bg, card: colors.surface, text: colors.text, border: colors.border, primary: colors.primary } };

  return (
    <NavThemeProvider value={navTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'fade' }}>
        <Stack.Protected guard={recovery}>
          <Stack.Screen name="nouveau-mot-de-passe" />
        </Stack.Protected>
        <Stack.Protected guard={!recovery && !signedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && !approved}>
          <Stack.Screen name="en-attente" />
        </Stack.Protected>
        <Stack.Protected guard={approved}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Screen name="mentions-legales" />
        <Stack.Screen name="confidentialite" />
        <Stack.Screen name="plan-du-site" />
        <Stack.Screen name="contact" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </NavThemeProvider>
  );
}

/** Surfaces writes the backend refused (the store has already resynced the data). */
function StoreErrorToast() {
  const { error, actions } = useStore();
  const { toast } = useDialogs();
  const { d, f } = useI18n();
  useEffect(() => {
    if (!error) return;
    toast(f(d.errors.saveFailed, { msg: error }), 'danger');
    actions.clearError();
  }, [error]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
