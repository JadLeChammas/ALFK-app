import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Row, type IconName } from '@/components/ui/primitives';
import { LogoFull, LogoLockup } from '@/components/ui/Logo';
import { useGutter } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { useStore } from '@/data/store';
import { useI18n } from '@/i18n';
import { enterDemo } from '@/lib/supabase';
import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius } from '@/theme/tokens';

const campus = require('@/assets/images/lfk-campus.png');

/** The only page visible without an account: what the Amicale is, and how to join. */
export default function Welcome() {
  const { d } = useI18n();
  const { colors } = useTheme();
  const { isRemote } = useStore();
  const { isDesktop, isMobile } = useLayout();
  const insets = useSafeAreaInsets();
  const gutter = useGutter();

  const features: { icon: IconName; title: string; sub: string }[] = [
    { icon: 'users', title: d.landing.fDirectory, sub: d.landing.fDirectorySub },
    { icon: 'globe', title: d.landing.fRepere, sub: d.landing.fRepereSub },
    { icon: 'compass', title: d.landing.fOrientation, sub: d.landing.fOrientationSub },
    { icon: 'message-square', title: d.landing.fWhatsapp, sub: d.landing.fWhatsappSub },
    { icon: 'book-open', title: d.landing.fPublications, sub: d.landing.fPublicationsSub },
    { icon: 'calendar', title: d.landing.fCalendar, sub: d.landing.fCalendarSub },
  ];
  const steps = [d.landing.step1, d.landing.step2, d.landing.step3];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: insets.bottom + 48 }}>
      {/* Hero */}
      <View style={{ margin: isMobile ? 0 : 16, borderRadius: isMobile ? 0 : radius.hero, overflow: 'hidden', backgroundColor: '#000' }}>
        <Image source={campus} style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.45 }} contentFit="cover" />
        <LinearGradient colors={['rgba(0,0,0,0.35)', 'rgba(0,0,0,0.92)']} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        <View style={{ paddingTop: insets.top + (isMobile ? 20 : 28), paddingBottom: isMobile ? 36 : 64, paddingHorizontal: gutter, width: '100%', maxWidth: 1240, alignSelf: 'center', gap: isMobile ? 28 : 48 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <View style={{ opacity: 0.95 }}>{isDesktop ? <LogoFull size={120} /> : <LogoWhite />}</View>
            <Button label={d.auth.signIn} icon="log-in" size="sm" variant="secondary" onPress={() => router.push('/connexion')} />
          </Row>
          <View style={{ gap: 18, maxWidth: 680 }}>
            <Txt style={{ color: 'rgba(255,255,255,0.7)', fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase' }}>{d.app.long}</Txt>
            <Txt style={{ color: '#fff', fontFamily: fonts.extrabold, fontSize: isMobile ? 32 : 48, lineHeight: isMobile ? 38 : 56, letterSpacing: -1 }}>{d.landing.title}</Txt>
            <Txt style={{ color: 'rgba(255,255,255,0.8)', fontFamily: fonts.medium, fontSize: isMobile ? 15 : 18, lineHeight: isMobile ? 23 : 28 }}>{d.landing.sub}</Txt>
            <Row gap={10} wrap style={{ marginTop: 6 }}>
              <Button label={d.landing.join} icon="user-plus" size="lg" onPress={() => router.push('/inscription')} />
              <Button label={d.auth.signIn} size="lg" variant="secondary" onPress={() => router.push('/connexion')} />
            </Row>
            <Row gap={8}>
              <Feather name="lock" size={14} color="rgba(255,255,255,0.7)" />
              <Txt style={{ color: 'rgba(255,255,255,0.7)', fontFamily: fonts.semibold, fontSize: 13, flex: 1 }}>{d.auth.privateNote}</Txt>
            </Row>
          </View>
        </View>
      </View>

      <View style={{ width: '100%', maxWidth: 1240, alignSelf: 'center', paddingHorizontal: gutter, paddingTop: isMobile ? 32 : 48, gap: isMobile ? 36 : 56 }}>
        {/* What members find inside */}
        <View style={{ gap: 18 }}>
          <View style={{ gap: 6 }}>
            <Txt variant="h1">{d.landing.featuresTitle}</Txt>
            <Txt color="textMuted">{d.landing.featuresSub}</Txt>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
            {features.map((f) => (
              <View key={f.title} style={{ flexGrow: 1, flexBasis: isMobile ? '100%' : 300, gap: 10, padding: 20, borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
                <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Feather name={f.icon} size={19} color={colors.primary} />
                </View>
                <Txt variant="h3">{f.title}</Txt>
                <Txt variant="small" color="textMuted">{f.sub}</Txt>
              </View>
            ))}
          </View>
        </View>

        {/* How to join */}
        <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 20, padding: isMobile ? 20 : 32, borderRadius: radius.hero, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ flex: 1, gap: 10 }}>
            <Txt variant="h2">{d.landing.joinTitle}</Txt>
            <Txt color="textMuted">{d.landing.joinSub}</Txt>
            <Button label={d.landing.join} icon="arrow-right" onPress={() => router.push('/inscription')} style={{ alignSelf: 'flex-start', marginTop: 8 }} />
          </View>
          <View style={{ flex: 1, gap: 12 }}>
            {steps.map((s, i) => (
              <Row key={s} gap={12} style={{ alignItems: 'flex-start' }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
                  <Txt variant="smallStrong" style={{ color: colors.onInk }}>{i + 1}</Txt>
                </View>
                <Txt style={{ flex: 1, marginTop: 3 }}>{s}</Txt>
              </Row>
            ))}
          </View>
        </View>

        {isRemote && Platform.OS === 'web' && (
          <Row gap={12} wrap style={{ padding: 18, borderRadius: 18, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.borderStrong }}>
            <Feather name="play-circle" size={18} color={colors.primary} />
            <View style={{ flex: 1, minWidth: 220 }}>
              <Txt variant="smallStrong">{d.demo.tryTitle}</Txt>
              <Txt variant="small" color="textMuted">{d.demo.trySub}</Txt>
            </View>
            <Button label={d.demo.tryButton} icon="eye" variant="soft" size="sm" onPress={enterDemo} />
          </Row>
        )}

        <Row gap={16} style={{ justifyContent: 'center' }} wrap>
          <Link href="/mentions-legales"><Txt variant="small" color="textSubtle">{d.nav.legal}</Txt></Link>
          <Link href="/confidentialite"><Txt variant="small" color="textSubtle">{d.legal.privacy}</Txt></Link>
          <Link href="/plan-du-site"><Txt variant="small" color="textSubtle">{d.nav.sitemap}</Txt></Link>
          <Link href="/contact"><Txt variant="small" color="textSubtle">{d.nav.contact}</Txt></Link>
        </Row>
      </View>
    </ScrollView>
  );
}

/** Compact logo on the dark hero (phones and tablets). */
function LogoWhite() {
  return (
    <View style={{ borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.92)', paddingHorizontal: 10, paddingVertical: 6 }}>
      <LogoLockup compact />
    </View>
  );
}
