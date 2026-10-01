import { Feather } from '@expo/vector-icons';
import { Link, router, usePathname } from 'expo-router';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Platform, Pressable, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, FadeIn, interpolateColor, useAnimatedScrollHandler, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MaskedText } from '@/components/fx/MaskedText';
import { AppShell } from '@/components/shell/AppShell';
import { LogoMark } from '@/components/ui/Logo';
import { Button, Tap, type IconName } from '@/components/ui/primitives';
import { useGutter } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { useStore } from '@/data/store';
import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';
import { brand, fonts, radius } from '@/theme/tokens';
import { useRetroTaps } from '@/lib/retro';
import { rollCredits } from '@/components/EasterEggs';
import { PublicSettingsButton } from './PublicSettings';
import { Reveal } from './Reveal';

export const SITE_MAX = 1152; // max-w-6xl

/** Links of the public association site — shared by the header, the footer and the sitemap. */
export function useSiteLinks() {
  const { d } = useI18n();
  const { me } = useStore();
  return [
    { href: me ? '/' : '/bienvenue', label: d.nav.home, icon: 'home' as IconName },
    { href: '/association', label: d.site.nav.association, icon: 'heart' as IconName },
    { href: '/bureau', label: d.site.nav.bureau, icon: 'users' as IconName },
    { href: '/partenaires', label: d.site.nav.partners, icon: 'briefcase' as IconName },
    { href: '/adherer', label: d.site.nav.join, icon: 'user-plus' as IconName },
  ];
}

/* ───────────────────────── Tones ─────────────────────────
 * The public site never sits on white: every band is a brand colour. A band publishes its tone
 * through context so headings, rules, links and blocks inside pick matching colours.
 */
export type Tone = 'page' | 'navy' | 'red' | 'blue';
export type TonePalette = { bg: string; fg: string; muted: string; rule: string; accent: string; card: string; cardFg: string; cardMuted: string };

export function tonePalette(tone: Tone, dark: boolean): TonePalette {
  switch (tone) {
    case 'navy':
      return { bg: brand.navy, fg: '#FFFFFF', muted: 'rgba(200,211,229,0.85)', rule: 'rgba(200,211,229,0.2)', accent: '#FF6B6E', card: 'rgba(200,211,229,0.08)', cardFg: '#FFFFFF', cardMuted: 'rgba(200,211,229,0.85)' };
    case 'red':
      return { bg: brand.red, fg: '#FFFFFF', muted: 'rgba(255,255,255,0.82)', rule: 'rgba(255,255,255,0.28)', accent: brand.sky, card: 'rgba(0,0,0,0.12)', cardFg: '#FFFFFF', cardMuted: 'rgba(255,255,255,0.82)' };
    case 'blue':
      return { bg: brand.blue, fg: '#FFFFFF', muted: 'rgba(255,255,255,0.88)', rule: 'rgba(255,255,255,0.3)', accent: brand.navy, card: brand.navy, cardFg: '#FFFFFF', cardMuted: brand.sky };
    default:
      return dark
        ? { bg: '#07112B', fg: '#FFFFFF', muted: 'rgba(200,211,229,0.8)', rule: 'rgba(200,211,229,0.16)', accent: '#FF6B6E', card: brand.navy, cardFg: '#FFFFFF', cardMuted: brand.sky }
        : { bg: brand.sky, fg: brand.navy, muted: 'rgba(0,32,106,0.74)', rule: 'rgba(0,32,106,0.16)', accent: brand.red, card: brand.navy, cardFg: '#FFFFFF', cardMuted: brand.sky };
  }
}

const ToneContext = createContext<Tone>('page');

/** Colours of the band this component sits in. */
export function useTone(): TonePalette & { tone: Tone; onColor: boolean } {
  const tone = useContext(ToneContext);
  const { scheme } = useTheme();
  const p = tonePalette(tone, scheme === 'dark');
  return { ...p, tone, onColor: tone !== 'page' || scheme === 'dark' };
}

export function ToneProvider({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <ToneContext.Provider value={tone}>{children}</ToneContext.Provider>;
}

/** Public pages of the association: header, content, footer. Works signed in or out. */
export const HEADER_H = 64;

/**
 * Public pages of the association: header, content, footer. Works signed in or out.
 * `overlay`: the first band runs under a transparent header (landing, photo heroes) and the header
 * turns navy once the page scrolls — as on delassus.com. A red line under the header tracks
 * reading progress, and each page arrives behind a layered colour wipe.
 */
export function SiteFrame({ children, overlay }: { children: ReactNode; overlay?: boolean }) {
  const { scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const progress = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
    const max = e.contentSize.height - e.layoutMeasurement.height;
    progress.value = max > 0 ? Math.min(1, Math.max(0, e.contentOffset.y / max)) : 0;
  });
  const { me, session } = useStore();
  // Approved members read these pages inside their space, with the sidebar on the left.
  if (me?.approved && !session?.recovery) {
    return (
      <AppShell>
        <Animated.ScrollView style={{ flex: 1, backgroundColor: tonePalette('page', scheme === 'dark').bg }} contentContainerStyle={{ flexGrow: 1, paddingBottom: 96 }}>
          <ToneProvider tone="page">{children}</ToneProvider>
        </Animated.ScrollView>
      </AppShell>
    );
  }
  return (
    <View style={{ flex: 1, backgroundColor: tonePalette('page', scheme === 'dark').bg }}>
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, paddingTop: overlay ? 0 : HEADER_H + insets.top }}>
        <View style={{ flexGrow: 1 }}>
          <ToneProvider tone="page">{children}</ToneProvider>
        </View>
        <SiteFooter />
      </Animated.ScrollView>
      <SiteHeader scrollY={scrollY} progress={progress} overlay={!!overlay} />
      <PageWipe />
    </View>
  );
}

/** Two brand panels slide off the screen when a page opens (delassus.com page transitions). */
function PageWipe() {
  const reduced = useReducedMotion();
  const a = useSharedValue(0);
  const b = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    const ease = Easing.bezier(0.77, 0, 0.18, 1);
    a.value = withDelay(80, withTiming(1, { duration: 750, easing: ease }));
    b.value = withDelay(220, withTiming(1, { duration: 750, easing: ease }));
  }, [reduced, a, b]);
  const { height } = useWindowDimensions();
  const top = useAnimatedStyle(() => ({ transform: [{ translateY: -a.value * (height + 4) }] }));
  const under = useAnimatedStyle(() => ({ transform: [{ translateY: -b.value * (height + 4) }] }));
  if (reduced) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
      <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: brand.red }, under]} />
      <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: brand.navy, alignItems: 'center', justifyContent: 'center' }, top]}>
        <LogoMark size={56} />
      </Animated.View>
    </View>
  );
}

/** Centered container of the public site (max-w-6xl, px-6). */
export function Container({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const gutter = useGutter();
  return <View style={[{ width: '100%', maxWidth: SITE_MAX + gutter * 2, alignSelf: 'center', paddingHorizontal: gutter }, style]}>{children}</View>;
}

/** A full-bleed band of the site (py-20 sm:py-28 in the source blocks) in one brand tone. */
export function Section({ children, style, tone = 'page', tint }: { children: ReactNode; style?: StyleProp<ViewStyle>; tone?: Tone; /** @deprecated use tone */ tint?: boolean }) {
  const { scheme } = useTheme();
  const { isMobile } = useLayout();
  const t = tint && tone === 'page' ? 'blue' : tone;
  return (
    <ToneProvider tone={t}>
      <View style={{ paddingVertical: isMobile ? 56 : 96, backgroundColor: tonePalette(t, scheme === 'dark').bg }}>
        <Container style={style}>{children}</Container>
      </View>
    </ToneProvider>
  );
}

/**
 * Serif section heading. The title slides up word by word as it scrolls into view
 * (Text Reveal Mask); the accent line is set in italic in the band's accent colour.
 */
export function SerifHeading({ title, accent, lead, center, light, size = 'md' }: { title: string; accent?: string; lead?: string; center?: boolean; light?: boolean; size?: 'md' | 'lg' | 'xl' }) {
  const tone = useTone();
  const { isMobile } = useLayout();
  const fg = light ? '#fff' : tone.fg;
  const fs = { md: isMobile ? 32 : 42, lg: isMobile ? 38 : 54, xl: isMobile ? 44 : 68 }[size];
  const line = { fontFamily: fonts.serif, fontSize: fs, lineHeight: fs * 1.06, letterSpacing: -0.5, color: fg };
  const marked = accent ? `${title}\n${accent.split(/\s+/).map((w) => `*${w}*`).join(' ')}` : title;
  return (
    <View style={{ gap: 16, alignItems: center ? 'center' : 'flex-start', maxWidth: center ? 780 : 680, alignSelf: center ? 'center' : 'flex-start', width: '100%' }}>
      <MaskedText text={marked} style={line} emphasisStyle={{ fontFamily: fonts.serifItalic, color: light ? brand.sky : tone.accent }} align={center ? 'center' : 'left'} />
      {lead && (
        <Reveal index={2}>
          <Txt style={{ fontFamily: fonts.regular, fontSize: isMobile ? 15 : 17, lineHeight: isMobile ? 23 : 27, color: light ? 'rgba(255,255,255,0.78)' : tone.muted, textAlign: center ? 'center' : 'left', maxWidth: 580 }}>{lead}</Txt>
        </Reveal>
      )}
    </View>
  );
}

/** Text-only CTA with an arrow that slides on hover (the `link` variant of the source blocks). */
export function LinkCta({ label, onPress, light }: { label: string; onPress: () => void; light?: boolean }) {
  const tone = useTone();
  const [hovered, setHovered] = useState(false);
  const fg = light ? '#fff' : tone.fg;
  return (
    <Pressable onPress={onPress} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)} accessibilityRole="link" style={{ flexDirection: 'row', alignItems: 'center', gap: hovered ? 10 : 6, height: 40, ...(Platform.OS === 'web' ? ({ transitionProperty: 'gap', transitionDuration: '200ms' } as object) : {}) }}>
      <Txt style={{ fontFamily: fonts.semibold, fontSize: 14, color: fg, textDecorationLine: hovered ? 'underline' : 'none' }}>{label}</Txt>
      <Feather name="arrow-right" size={15} color={fg} />
    </Pressable>
  );
}

function SiteHeader({ scrollY, progress, overlay }: { scrollY: SharedValue<number>; progress: SharedValue<number>; overlay: boolean }) {
  const { d } = useI18n();
  const { me } = useStore();
  const { isDesktop } = useLayout();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const links = useSiteLinks();
  const [open, setOpen] = useState(false);
  const go = (href: string) => {
    setOpen(false);
    router.push(href as never);
  };
  // Transparent over the hero, navy once the page moves (or right away when the menu is open).
  const bar = useAnimatedStyle(() => ({
    backgroundColor: !overlay || open ? brand.navy : interpolateColor(scrollY.value, [0, 90], ['rgba(0,32,106,0)', 'rgba(0,32,106,1)']),
  }));
  const line = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  const logoTap = useRetroTaps(() => go(me ? '/' : '/bienvenue'));
  return (
    <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, paddingTop: insets.top, zIndex: 10 }, bar]}>
      <Container style={{ height: HEADER_H, flexDirection: 'row', alignItems: 'center', gap: isDesktop ? 24 : 10 }}>
        <Tap onPress={logoTap} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: isDesktop ? undefined : 1 }}>
          <LogoMark size={30} />
          <Txt numberOfLines={1} style={{ fontFamily: fonts.serif, fontSize: isDesktop ? 22 : 20, lineHeight: 26, color: '#fff', flexShrink: 1 }}>{d.app.name}</Txt>
        </Tap>
        {isDesktop && (
          <View style={{ flex: 1, flexDirection: 'row', gap: 28 }}>
            {links.slice(1).map((l) => {
              const active = pathname === l.href;
              return (
                <Tap key={l.href} onPress={() => go(l.href)} style={{ height: 64, justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: active ? brand.red : 'transparent' }} hoverStyle={{ opacity: 0.75 }}>
                  <Txt style={{ fontFamily: fonts.medium, fontSize: 14, color: active ? '#fff' : brand.sky }}>{l.label}</Txt>
                </Tap>
              );
            })}
          </View>
        )}
        <PublicSettingsButton light />
        {me ? (
          <Button label={d.site.nav.mySpace} size="sm" onPress={() => router.replace('/')} />
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            {isDesktop && (
              <Tap onPress={() => go('/connexion')} hoverStyle={{ opacity: 0.75 }}>
                <Txt style={{ fontFamily: fonts.medium, fontSize: 14, color: '#fff' }}>{d.site.nav.signIn}</Txt>
              </Tap>
            )}
            <Button label={d.site.nav.cta} size="sm" onPress={() => go('/inscription')} />
          </View>
        )}
        {!isDesktop && (
          <Tap onPress={() => setOpen((o) => !o)} accessibilityLabel={d.site.nav.menu} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name={open ? 'x' : 'menu'} size={20} color="#fff" />
          </Tap>
        )}
      </Container>
      {!isDesktop && open && (
        <Animated.View entering={FadeIn.duration(180)}>
          <Container style={{ paddingBottom: 16 }}>
            {links.map((l) => (
              <Tap key={l.href} onPress={() => go(l.href)} style={{ height: 52, justifyContent: 'center', borderTopWidth: 1, borderTopColor: 'rgba(200,211,229,0.15)' }}>
                <Txt style={{ fontFamily: fonts.serif, fontSize: 26, color: pathname === l.href ? '#FF8A8C' : '#fff' }}>{l.label}</Txt>
              </Tap>
            ))}
            {!me && <Button label={d.site.nav.signIn} variant="onDark" full onPress={() => go('/connexion')} style={{ marginTop: 12 }} />}
          </Container>
        </Animated.View>
      )}
      <Animated.View style={[{ position: 'absolute', left: 0, bottom: 0, height: 2, backgroundColor: brand.red }, line]} />
    </Animated.View>
  );
}

/**
 * Port of 21st.dev "Footer with Suite" (scrollxui): two columns of small uppercase tracked
 * links, an oversized wordmark spanning the width, and a thin bottom bar.
 */
function SiteFooter() {
  const { d, f } = useI18n();
  const { width, isMobile } = useLayout();
  const links = useSiteLinks();
  const gutter = useGutter();
  const nav = links.slice(1).map((l) => ({ label: l.label, href: l.href }));
  const more = [
    { label: d.auth.signUp, href: '/inscription' },
    { label: d.nav.contact, href: '/contact' },
    { label: d.nav.legal, href: '/mentions-legales' },
    { label: d.nav.sitemap, href: '/plan-du-site' },
  ];
  const upper = { fontFamily: fonts.medium, fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase' as const, lineHeight: 20 };
  const wordSize = Math.max(48, Math.min(208, width * 0.13));
  const rule = 'rgba(200,211,229,0.15)';

  return (
    <View style={{ backgroundColor: brand.navy, overflow: 'hidden' }}>
      <Container style={{ flexDirection: 'row', gap: 32, paddingTop: 56, paddingBottom: 16 }}>
        <View style={{ flex: 1 }}>
          {nav.map((l) => (
            <Link key={l.href} href={l.href as never}>
              <Txt style={[upper, { color: '#fff' }]}>{l.label}</Txt>
            </Link>
          ))}
          <View style={{ height: 20 }} />
          {more.map((l) => (
            <Link key={l.href} href={l.href as never}>
              <Txt style={[upper, { color: brand.sky }]}>{l.label}</Txt>
            </Link>
          ))}
        </View>
        <View style={{ flex: 1, gap: 16 }}>
          <Txt style={[upper, { color: '#fff' }]}>{d.app.long}</Txt>
          <Txt style={[upper, { color: brand.sky }]}>{d.site.footer.tagline}</Txt>
          <Link href="/contact">
            <Txt style={[upper, { color: '#FF8A8C' }]}>{d.site.footer.contact} &rarr;</Txt>
          </Link>
          <Txt style={[upper, { color: 'rgba(200,211,229,0.6)' }]} onPress={rollCredits} suppressHighlighting>{f(d.site.footer.copyright, { year: new Date().getFullYear() })}</Txt>
        </View>
      </Container>
      <Txt
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{ fontFamily: fonts.serif, fontSize: wordSize, lineHeight: wordSize * 1.05, color: '#fff', textAlign: 'center', paddingHorizontal: isMobile ? gutter : 0, letterSpacing: -wordSize * 0.02 }}>
        {d.app.name}
      </Txt>
      <View style={{ borderTopWidth: 1, borderTopColor: rule, marginTop: 4 }}>
        <Container style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, gap: 12 }}>
          <Txt style={{ fontFamily: fonts.medium, fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', color: brand.sky, flexShrink: 1 }} numberOfLines={1}>
            ALFK · Koweït
          </Txt>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {[brand.red, brand.white, brand.sky, brand.blue].map((c) => (
              <View key={c} style={{ width: 14, height: 4, borderRadius: radius.sm, backgroundColor: c }} />
            ))}
          </View>
        </Container>
      </View>
    </View>
  );
}

export { Reveal };
