import type { ReactNode } from 'react';
import { View } from 'react-native';

import { SiteFrame } from './site/SiteFrame';
import { useGutter } from './ui/Screen';
import { Txt } from './ui/Txt';
import { useTheme } from '@/theme/ThemeProvider';

/** Frame for pages reachable whatever the login state (legal, sitemap, contact, 404) — inside the public site. */
export function PublicPage({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const { colors } = useTheme();
  const gutter = useGutter();
  return (
    <SiteFrame>
      <View style={{ width: '100%', maxWidth: 820 + gutter * 2, alignSelf: 'center', paddingHorizontal: gutter, paddingTop: 40, gap: 28 }}>
        <View style={{ gap: 8 }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.primary, marginBottom: 6 }} />
          {!!title && <Txt variant="display">{title}</Txt>}
          {subtitle && <Txt color="textMuted">{subtitle}</Txt>}
        </View>
        {children}
      </View>
    </SiteFrame>
  );
}
