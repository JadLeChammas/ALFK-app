import { Feather } from '@expo/vector-icons';
import { Seo } from '@/components/Seo';
import { Link, router } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStore } from '@/data/store';
import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';
import { brand, fonts, radius } from '@/theme/tokens';
import { useRetroTaps } from '@/lib/retro';
import { Globe } from './fx/Globe';
import { useDestinationMarkers } from './site/blocks';
import { PublicSettingsButton } from './site/PublicSettings';
import { Logo } from './ui/Logo';
import { Row, Tap } from './ui/primitives';
import { Txt } from './ui/Txt';

/** Split layout for auth screens: navy panel with the spinning globe on desktop, compact header on mobile. */
export function AuthFrame({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  const { colors, scheme } = useTheme();
  const { d } = useI18n();
  const { me } = useStore();
  const { isDesktop } = useLayout();
  const insets = useSafeAreaInsets();
  const markers = useDestinationMarkers();
  // The public home page only exists for visitors (not for a pending or recovering account).
  const home = me ? undefined : () => router.push('/bienvenue');
  const logoTap = useRetroTaps(home);

  const form = (
    <View style={{ width: '100%', maxWidth: 440, gap: 24 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        {!me ? (
          <Link href="/bienvenue">
            <Row gap={6}>
              <Feather name="arrow-left" size={14} color={colors.textMuted} />
              <Txt variant="smallStrong" color="textMuted">{d.nav.home}</Txt>
            </Row>
          </Link>
        ) : (
          <View />
        )}
        <PublicSettingsButton />
      </Row>
      {!isDesktop && (
        <Tap onPress={logoTap} accessibilityLabel={d.nav.home} style={{ alignItems: 'center', marginBottom: 8 }}>
          <Logo height={72} onDark={scheme === 'dark'} />
        </Tap>
      )}
      <View style={{ gap: 8 }}>
        <Txt variant="h1">{title}</Txt>
        {subtitle && <Txt color="textMuted">{subtitle}</Txt>}
      </View>
      {children}
      {footer}
      <Row gap={16} style={{ justifyContent: 'center', marginTop: 8 }} wrap>
        <Link href="/mentions-legales"><Txt variant="small" color="textSubtle">{d.nav.legal}</Txt></Link>
        <Link href="/confidentialite"><Txt variant="small" color="textSubtle">{d.legal.privacy}</Txt></Link>
        <Link href="/cgu"><Txt variant="small" color="textSubtle">{d.legal.cgu}</Txt></Link>
        <Link href="/plan-du-site"><Txt variant="small" color="textSubtle">{d.nav.sitemap}</Txt></Link>
        <Link href="/contact"><Txt variant="small" color="textSubtle">{d.nav.contact}</Txt></Link>
      </Row>
    </View>
  );

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.bg }}>
      <Seo title={title} description={subtitle} />
      {isDesktop && (
        <View style={{ flex: 1.05, margin: 16, borderRadius: radius.hero, overflow: 'hidden', backgroundColor: brand.navy }}>
          <View style={{ flex: 1, padding: 48, justifyContent: 'space-between', gap: 24 }}>
            <Tap onPress={logoTap} accessibilityLabel={d.nav.home} style={{ alignSelf: 'flex-start' }}>
              <Logo height={64} onDark />
            </Tap>
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <Globe tone="dark" markers={markers} maxSize={440} />
            </View>
            <View style={{ gap: 14, maxWidth: 520 }}>
              <Txt style={{ color: '#fff', fontFamily: fonts.serif, fontSize: 40, lineHeight: 44, letterSpacing: -0.4 }}>
                {d.site.home.s1Title}
                {'\n'}
                <Txt style={{ color: brand.sky, fontFamily: fonts.serifItalic, fontSize: 40, lineHeight: 44 }}>{d.site.home.s1Italic}</Txt>
              </Txt>
              <Row gap={8}>
                <Feather name="lock" size={14} color={brand.sky} />
                <Txt style={{ color: brand.sky, fontFamily: fonts.semibold, fontSize: 13 }}>{d.auth.privateNote}</Txt>
              </Row>
            </View>
          </View>
        </View>
      )}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }}
          keyboardShouldPersistTaps="handled">
          {form}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
