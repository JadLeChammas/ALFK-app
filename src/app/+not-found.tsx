import { router } from 'expo-router';
import { View } from 'react-native';

import { PublicPage } from '@/components/PublicPage';
import { Button } from '@/components/ui/primitives';
import { Txt } from '@/components/ui/Txt';
import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { fonts } from '@/theme/tokens';

/** « Page not found ». */
export default function NotFound() {
  const { d } = useI18n();
  const { isMobile } = useLayout();
  return (
    <PublicPage title="">
      <View style={{ alignItems: 'center', gap: 14, paddingVertical: isMobile ? 24 : 40 }}>
        <Txt style={{ fontFamily: fonts.display, fontSize: isMobile ? 72 : 104, lineHeight: isMobile ? 76 : 108 }} color="primary">404</Txt>
        <Txt variant="h1" align="center">{d.legal.notFound}</Txt>
        <Txt color="textMuted" align="center" style={{ maxWidth: 520 }}>{d.legal.notFoundSub}</Txt>
        <Button label={d.legal.goHome} icon="home" onPress={() => router.replace('/')} style={{ marginTop: 6 }} />
      </View>
    </PublicPage>
  );
}
