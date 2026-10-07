import { InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif';
import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { ComicNeue_400Regular, ComicNeue_700Bold } from '@expo-google-fonts/comic-neue';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold, useFonts } from '@expo-google-fonts/inter';
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider, router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';

import { DemoBadge } from '@/components/DemoBadge';
import { EasterEggs } from '@/components/EasterEggs';
import { FutureLayer } from '@/components/FutureLayer';
import { FunModes } from '@/components/FunModes';
import { HiddenLanguages } from '@/components/HiddenLanguages';
import { RetroLayer } from '@/components/RetroLayer';
import { UrgentMessages } from '@/components/UrgentMessages';
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
            <View style={{ flex: 1 }}>
              <RootNavigator />
            </View>
            <StoreErrorToast />
            {/* The admins' urgent messages: a pop-up over every page until acknowledged. */}
            <UrgentMessages />
            <DemoBadge />
            <RetroLayer />
            <FutureLayer />
            <HiddenLanguages />
            <FunModes />
            <EasterEggs />
          </DialogProvider>
        </StoreProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

function RootNavigator() {
  const { scheme, colors } = useTheme();
  const { ready, session, me } = useStore();
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold, InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic, BebasNeue_400Regular, ComicNeue_400Regular, ComicNeue_700Bold });
  const loaded = ready && fontsLoaded;

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);

  if (!loaded) return null;

  // Access states — evaluated in priority order. A recovery session overrides everything else.
  const recovery = !!session?.recovery && !!me;
  const signedIn = !!me && !recovery;
  const approved = signedIn && me.approved;
  // A former Terminale student made alumni by an admin fills in the account first (completer.tsx).
  const completing = approved && !!me.needsCompletion;

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
        <Stack.Protected guard={completing}>
          <Stack.Screen name="completer" />
        </Stack.Protected>
        <Stack.Protected guard={approved && !completing}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        {/* Public pages, open with or without an account. */}
        <Stack.Screen name="association" />
        <Stack.Screen name="histoire" />
        <Stack.Screen name="bureau" />
        <Stack.Screen name="partenaires" />
        <Stack.Screen name="actualites/index" />
        <Stack.Screen name="actualites/[id]" />
        <Stack.Screen name="adherer" />
        <Stack.Screen name="mentions-legales" />
        <Stack.Screen name="confidentialite" />
        <Stack.Screen name="cgu" />
        <Stack.Screen name="plan-du-site" />
        <Stack.Screen name="contact" />
        <Stack.Screen name="desinscription" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </NavThemeProvider>
  );
}

/** Surfaces writes the backend refused (the store has already resynced the data). */
function StoreErrorToast() {
  const { error, notice, actions } = useStore();
  const { toast, confirm } = useDialogs();
  const { d, f } = useI18n();
  useEffect(() => {
    if (!error) return;
    toast(f(d.errors.saveFailed, { msg: error }), 'danger');
    actions.clearError();
  }, [error]); // eslint-disable-line react-hooks/exhaustive-deps

  // A restricted account tried to write (or someone tried to write to one): a neutral message only.
  useEffect(() => {
    if (!notice) return;
    actions.clearNotice();
    if (notice.kind === 'recipient') {
      toast(d.unavailable.recipient, 'danger');
      return;
    }
    confirm({ title: d.unavailable.title, message: d.unavailable.body, confirmLabel: d.unavailable.contact }).then((go) => {
      if (go) router.push('/contact');
    });
  }, [notice]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
