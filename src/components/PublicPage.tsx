import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStore } from '@/data/store';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { LogoLockup } from './ui/Logo';
import { Button, Tap } from './ui/primitives';
import { useGutter } from './ui/Screen';
import { Txt } from './ui/Txt';

/** Frame for pages reachable whatever the login state (legal, sitemap, contact, 404). */
export function PublicPage({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const { colors } = useTheme();
  const { d } = useI18n();
  const { me } = useStore();
  const insets = useSafeAreaInsets();
  const gutter = useGutter();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 64, paddingHorizontal: gutter }}>
      <View style={{ width: '100%', maxWidth: 820, alignSelf: 'center', gap: 28 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Tap onPress={() => router.replace('/')}>
            <LogoLockup compact />
          </Tap>
          <Button label={me ? d.legal.goHome : d.auth.signIn} variant="secondary" size="sm" icon={me ? 'home' : 'log-in'} onPress={() => router.replace('/')} />
        </View>
        <View style={{ gap: 8 }}>
          {!!title && <Txt variant="display">{title}</Txt>}
          {subtitle && <Txt color="textMuted">{subtitle}</Txt>}
        </View>
        {children}
      </View>
    </ScrollView>
  );
}
