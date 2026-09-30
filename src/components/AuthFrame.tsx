import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStore } from '@/data/store';
import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius } from '@/theme/tokens';
import { LogoFull, LogoMark } from './ui/Logo';
import { Row } from './ui/primitives';
import { Txt } from './ui/Txt';

const campus = require('@/assets/images/lfk-campus.png');

/** Split layout for auth screens: brand panel on desktop, compact header on mobile. */
export function AuthFrame({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  const { colors } = useTheme();
  const { d } = useI18n();
  const { me } = useStore();
  const { isDesktop } = useLayout();
  const insets = useSafeAreaInsets();

  const form = (
    <View style={{ width: '100%', maxWidth: 440, gap: 24 }}>
      {!me && (
        <Link href="/bienvenue" style={{ alignSelf: 'flex-start' }}>
          <Row gap={6}>
            <Feather name="arrow-left" size={14} color={colors.textMuted} />
            <Txt variant="smallStrong" color="textMuted">{d.nav.home}</Txt>
          </Row>
        </Link>
      )}
      {!isDesktop && (
        <View style={{ alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <LogoMark size={72} />
          <Txt variant="caption">{d.app.long}</Txt>
        </View>
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
        <Link href="/plan-du-site"><Txt variant="small" color="textSubtle">{d.nav.sitemap}</Txt></Link>
        <Link href="/contact"><Txt variant="small" color="textSubtle">{d.nav.contact}</Txt></Link>
      </Row>
    </View>
  );

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.bg }}>
      {isDesktop && (
        <View style={{ flex: 1.05, margin: 16, borderRadius: radius.hero, overflow: 'hidden', backgroundColor: '#000' }}>
          <Image source={campus} style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.45 }} contentFit="cover" />
          <LinearGradient colors={['rgba(0,0,0,0.25)', 'rgba(0,0,0,0.92)']} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
          <View style={{ flex: 1, padding: 48, justifyContent: 'space-between' }}>
            <LogoFull size={200} />
            <View style={{ gap: 16, maxWidth: 520 }}>
              <Txt style={{ color: '#fff', fontFamily: fonts.extrabold, fontSize: 40, lineHeight: 46, letterSpacing: -1 }}>{d.home.heroTitle}</Txt>
              <Txt style={{ color: 'rgba(255,255,255,0.75)', fontFamily: fonts.medium, fontSize: 16, lineHeight: 24 }}>{d.home.heroSub}</Txt>
              <Row gap={8} style={{ marginTop: 8 }}>
                <Feather name="lock" size={14} color="rgba(255,255,255,0.7)" />
                <Txt style={{ color: 'rgba(255,255,255,0.7)', fontFamily: fonts.semibold, fontSize: 13 }}>{d.auth.privateNote}</Txt>
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
