import { Feather } from '@expo/vector-icons';
import { Link, router, usePathname } from 'expo-router';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Platform, Pressable, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, FadeIn, interpolateColor, useAnimatedScrollHandler, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MaskedText } from '@/components/fx/MaskedText';
import { AppShell } from '@/components/shell/AppShell';
import { Logo, LogoMark } from '@/components/ui/Logo';
import { Button, Tap, type IconName } from '@/components/ui/primitives';
import { useGutter } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { useStore } from '@/data/store';
import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';
import { brand, fonts } from '@/theme/tokens';
import { useRetroTaps } from '@/lib/retro';
import { rollCredits } from '@/components/EasterEggs';
import { HiDevCredit } from './HiDevCredit';
import { INSTAGRAM_HANDLE, InstagramButton, InstagramLink, instagramLinkProps } from './Instagram';
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
    { href: '/histoire', label: d.site.nav.lfk, icon: 'book' as IconName },
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
      return { bg: brand.navy, fg: '#FFFFFF', muted: 'rgba(231, 236, 242,0.85)', rule: 'rgba(231, 236, 242,0.2)', accent: '#E05A5D', card: 'rgba(231, 236, 242,0.08)', cardFg: '#FFFFFF', cardMuted: 'rgba(231, 236, 242,0.85)' };
    case 'red':
      return { bg: brand.red, fg: '#FFFFFF', muted: 'rgba(255,255,255,0.82)', rule: 'rgba(255,255,255,0.28)', accent: brand.sky, card: 'rgba(0,0,0,0.12)', cardFg: '#FFFFFF', cardMuted: 'rgba(255,255,255,0.82)' };
    case 'blue':
      // Soft Gold band: navy text reads better than white on gold.
      return { bg: brand.blue, fg: brand.navy, muted: 'rgba(14, 42, 71, 0.78)', rule: 'rgba(14, 42, 71, 0.2)', accent: brand.red, card: brand.navy, cardFg: '#FFFFFF', cardMuted: brand.sky };
    default:
      return dark
        ? { bg: '#081523', fg: '#FFFFFF', muted: 'rgba(231, 236, 242,0.8)', rule: 'rgba(231, 236, 242,0.16)', accent: '#E05A5D', card: brand.navy, cardFg: '#FFFFFF', cardMuted: brand.sky }
        : { bg: brand.sky, fg: brand.navy, muted: 'rgba(14, 42, 71,0.74)', rule: 'rgba(14, 42, 71,0.16)', accent: brand.red, card: brand.navy, cardFg: '#FFFFFF', cardMuted: brand.sky };
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
        <LogoMark size={72} onDark />
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
    backgroundColor: !overlay || open ? brand.navy : interpolateColor(scrollY.value, [0, 90], ['rgba(14, 42, 71,0)', 'rgba(14, 42, 71,1)']),
  }));
  const line = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  const logoTap = useRetroTaps(() => go(me ? '/' : '/bienvenue'));
  return (
    <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, paddingTop: insets.top, zIndex: 10 }, bar]}>
      <Container style={{ height: HEADER_H, flexDirection: 'row', alignItems: 'center', gap: isDesktop ? 24 : 10 }}>
        <Tap onPress={logoTap} accessibilityLabel={d.nav.home} style={{ flexDirection: 'row', alignItems: 'center', flex: isDesktop ? undefined : 1 }}>
          <Logo height={isDesktop ? 48 : 42} onDark />
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
              <Tap key={l.href} onPress={() => go(l.href)} style={{ height: 52, justifyContent: 'center', borderTopWidth: 1, borderTopColor: 'rgba(231, 236, 242,0.15)' }}>
                <Txt style={{ fontFamily: fonts.serif, fontSize: 26, color: pathname === l.href ? '#FF8A8C' : '#fff' }}>{l.label}</Txt>
              </Tap>
            ))}
            <InstagramLink variant="row" muted="rgba(231, 236, 242,0.65)" />
            {!me && <Button label={d.site.nav.signIn} variant="onDark" full onPress={() => go('/connexion')} style={{ marginTop: 12 }} />}
          </Container>
        </Animated.View>
      )}
      <Animated.View style={[{ position: 'absolute', left: 0, bottom: 0, height: 2, backgroundColor: brand.red }, line]} />
    </Animated.View>
  );
}

/**
 * Port of 21st.dev « Agency Footer » (shadcnspace footer-01): a brand column (logo, tagline,
 * call to action) next to grouped link columns, a hairline, then the bar with the legal links,
 * copyright and credit. Phones first: full-width stacked buttons, two tight link columns,
 * legal links as one small row. A huge, faint « ALFK » in the logo's wide tracking closes the page.
 */
function SiteFooter() {
  const { d, f } = useI18n();
  const { width, isMobile, isDesktop } = useLayout();
  const { me } = useStore();
  const links = useSiteLinks();
  const groups = [
    { title: d.site.nav.association, links: links.slice(1).map((l) => ({ label: l.label, href: l.href })) },
    {
      title: d.nav.more,
      links: [
        me ? { label: d.site.nav.mySpace, href: '/' } : { label: d.site.nav.signIn, href: '/connexion' },
        ...(me ? [] : [{ label: d.auth.signUp, href: '/inscription' }]),
        { label: d.nav.contact, href: '/contact' },
      ],
    },
  ];
  const legal = [
    { label: d.nav.legal, href: '/mentions-legales' },
    { label: d.legal.privacy, href: '/confidentialite' },
    { label: d.nav.sitemap, href: '/plan-du-site' },
  ];
  const muted = 'rgba(231, 236, 242,0.68)';
  const rule = 'rgba(231, 236, 242,0.14)';
  const giant = Math.max(96, Math.min(300, width * 0.2));

  return (
    <View style={{ backgroundColor: brand.navy, overflow: 'hidden' }}>
      <Container style={{ paddingTop: isMobile ? 44 : 72, paddingBottom: isMobile ? 28 : 48 }}>
        <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: isDesktop ? 48 : 32 }}>
          {/* Brand */}
          <View style={{ flex: isDesktop ? 5 : undefined, gap: isMobile ? 16 : 20, maxWidth: isMobile ? undefined : 440 }}>
            <Logo height={isMobile ? 60 : 76} onDark />
            <Txt style={{ fontFamily: fonts.regular, fontSize: isMobile ? 14 : 15, lineHeight: isMobile ? 21 : 24, color: muted }}>{d.site.footer.tagline}</Txt>
            {/* Social: round Instagram button (hover fill, 21st.dev « Social Media ») and its handle. */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <InstagramButton />
              <Tap {...instagramLinkProps()} role="link" accessibilityLabel={`Instagram ${INSTAGRAM_HANDLE}`} hoverStyle={{ opacity: 0.8 }}>
                <Txt style={{ fontFamily: fonts.medium, fontSize: 12, color: muted }}>{d.site.footer.followUs}</Txt>
                <Txt style={{ fontFamily: fonts.semibold, fontSize: 15, color: '#FFFFFF' }}>{INSTAGRAM_HANDLE}</Txt>
              </Tap>
            </View>
            <View style={isMobile ? { gap: 10, marginTop: 4 } : { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              <Button full={isMobile} label={d.site.footer.band} variant="white" iconRight="arrow-right" onPress={() => router.push('/adherer')} />
              <Button full={isMobile} label={d.site.footer.contact} variant="onDark" icon="mail" onPress={() => router.push('/contact')} />
            </View>
          </View>
          {isDesktop && <View style={{ flex: 1 }} />}
          {/* Link columns */}
          <View style={{ flex: isDesktop ? 5 : undefined, flexDirection: 'row', gap: isMobile ? 16 : 24, paddingTop: isMobile ? 24 : 0, borderTopWidth: isMobile ? 1 : 0, borderTopColor: rule }}>
            {groups.map((g) => (
              <View key={g.title} style={{ flex: 1, gap: isMobile ? 12 : 14 }}>
                <Txt style={{ fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase', color: brand.blue }}>{g.title}</Txt>
                {g.links.map((l) => (
                  <Link key={l.href} href={l.href as never}>
                    <Txt numberOfLines={1} style={{ fontFamily: fonts.medium, fontSize: isMobile ? 14 : 15, color: '#FFFFFF' }}>{l.label}</Txt>
                  </Link>
                ))}
              </View>
            ))}
          </View>
        </View>
      </Container>

      <View style={{ borderTopWidth: 1, borderTopColor: rule }}>
        <Container style={{ flexDirection: isDesktop ? 'row' : 'column', alignItems: isDesktop ? 'center' : 'stretch', justifyContent: 'space-between', paddingVertical: isMobile ? 20 : 18, gap: isMobile ? 14 : 12 }}>
          <View style={{ gap: 8, flexShrink: 1 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 18, rowGap: 6 }}>
              {legal.map((l) => (
                <Link key={l.href} href={l.href as never}>
                  <Txt style={{ fontFamily: fonts.medium, fontSize: 12, color: 'rgba(231, 236, 242,0.85)', textDecorationLine: 'underline', textDecorationColor: 'rgba(231, 236, 242,0.3)' }}>{l.label}</Txt>
                </Link>
              ))}
            </View>
            <Txt style={{ fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, color: muted }} onPress={rollCredits} suppressHighlighting>
              {f(d.site.footer.copyright, { year: new Date().getFullYear() })}
            </Txt>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
            <Txt style={{ fontFamily: fonts.semibold, fontSize: 12, letterSpacing: 1.4, color: '#FFFFFF' }}>alfk.org</Txt>
            <HiDevCredit />
          </View>
        </Container>
      </View>

      {/* Closing wordmark, cut by the bottom of the page like the delassus footer */}
      <View pointerEvents="none" style={{ height: giant * 0.62, overflow: 'hidden', alignItems: 'center' }}>
        <Txt numberOfLines={1} style={{ fontFamily: fonts.bold, fontSize: giant, lineHeight: giant * 1.1, letterSpacing: giant * 0.18, color: 'rgba(231, 236, 242,0.06)', marginRight: -giant * 0.18 }}>
          ALFK
        </Txt>
      </View>
    </View>
  );
}

export { Reveal };
