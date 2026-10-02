import { router } from 'expo-router';
import { View } from 'react-native';

import { PublicPage } from '@/components/PublicPage';
import { LogoMark } from '@/components/ui/Logo';
import { Button } from '@/components/ui/primitives';
import { Txt } from '@/components/ui/Txt';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';

export default function NotFound() {
  const { d } = useI18n();
  const { scheme } = useTheme();
  return (
    <PublicPage title="">
      <View style={{ alignItems: 'center', gap: 16, paddingVertical: 48 }}>
        <LogoMark size={120} onDark={scheme === 'dark'} />
        <Txt style={{ fontFamily: fonts.display, fontSize: 120, lineHeight: 120 }} color="primary">404</Txt>
        <Txt variant="h1" align="center">{d.legal.notFound}</Txt>
        <Txt color="textMuted" align="center">{d.legal.notFoundSub}</Txt>
        <Button label={d.legal.goHome} icon="home" onPress={() => router.replace('/')} />
      </View>
    </PublicPage>
  );
}
