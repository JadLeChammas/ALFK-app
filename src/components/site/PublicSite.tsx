import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link, router, usePathname } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Easing, Platform, ScrollView, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { countryByCode } from '@/data/countries';
import { usePublicOverview } from '@/data/public';
import { useStore } from '@/data/store';
import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius } from '@/theme/tokens';
import { AppShell } from '../shell/AppShell';
import { Flag } from '../ui/Flag';
import { LogoMark } from '../ui/Logo';
import { Button, Tap } from '../ui/primitives';
import { useGutter } from '../ui/Screen';
import { Txt } from '../ui/Txt';
import { WorldArcs } from '../ui/WorldDots';

/** Brand colours of the public pages (the same in light and dark mode). */
export const NAVY = '#00206A';
export const NAVY_DEEP = '#001852';
export const RED = '#AE0000';
export const MIST = '#C8D3E5';

export const MAX_SITE = 1200;

/** Big serif title: a straight part and an italic part, like on a magazine cover. */
export function SerifTitle({ text, italic, color, size = 48, align, style }: { text: string; italic?: string; color?: string; size?: number; align?: 'left' | 'center'; style?: StyleProp<TextStyle> }) {
  const { colors } = useTheme();
  return (
    <Txt style={[{ fontFamily: fonts.serif, fontSize: size, lineHeight: size * 1.08, color: color ?? colors.text, textAlign: align }, style]}>
      {text}
      {italic ? (
        <>
          {' '}
          <Txt style={{ fontFamily: fonts.serifItalic, fontSize: size, lineHeight: size * 1.08, color: color ?? colors.text }}>{italic}</Txt>
        </>
      ) : null}
    </Txt>
  );
}

export function Eyebrow({ label, color, align }: { label: string; color?: string; align?: 'left' | 'center' }) {
  const { colors } = useTheme();
  return <Txt style={{ fontFamily: fonts.semibold, fontSize: 12, letterSpacing: 1.6, textTransform: 'uppercase', color: color ?? colors.accent, textAlign: align }}>{label}</Txt>;
}

/** Centered column with the page gutter. */
export function Container({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const gutter = useGutter();
  return <View style={[{ width: '100%', maxWidth: MAX_SITE + gutter * 2, alignSelf: 'center', paddingHorizontal: gutter }, style]}>{children}</View>;
}

/** A full-width band: navy, or the page background. */
export function Band({ children, dark, style }: { children: ReactNode; dark?: boolean; style?: StyleProp<ViewStyle> }) {
  const { isMobile } = useLayout();
  return (
    <View style={[{ backgroundColor: dark ? NAVY : 'transparent', paddingVertical: isMobile ? 48 : 88 }, style]}>
      <Container>{children}</Container>
    </View>
  );
}

function useSiteNav() {
  const { d } = useI18n();
  return [
    { href: '/association', label: d.site.nav.association },
    { href: '/bureau', label: d.site.nav.bureau },
    { href: '/partenaires', label: d.site.nav.partners },
    { href: '/adherer', label: d.site.nav.join },
  ];
}

function Header() {
  const { d } = useI18n();
  const { me } = useStore();
  const { isDesktop } = useLayout();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const nav = useSiteNav();
  const [open, setOpen] = useState(false);
  const member = !!me;

  return (
    <View style={{ backgroundColor: NAVY, paddingTop: insets.top, zIndex: 10 }}>
      <Container style={{ height: 68, flexDirection: 'row', alignItems: 'center', gap: 24 }}>
        <Tap onPress={() => router.push(member ? '/' : '/bienvenue')} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <LogoMark size={34} />
          <Txt style={{ fontFamily: fonts.serif, fontSize: 24, color: '#fff' }}>{d.app.name}</Txt>
        </Tap>
        {isDesktop && (
          <View style={{ flexDirection: 'row', gap: 22 }}>
            {nav.map((n) => (
              <Link key={n.href} href={n.href as never}>
                <Txt style={{ fontFamily: fonts.semibold, fontSize: 14, color: pathname === n.href ? '#fff' : MIST }}>{n.label}</Txt>
              </Link>
            ))}
          </View>
        )}
        <View style={{ flex: 1 }} />
        {isDesktop ? (
          member ? (
            <Button label={d.site.nav.mySpace} icon="arrow-right" variant="accent" size="sm" onPress={() => router.push('/')} />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <Link href="/connexion"><Txt style={{ fontFamily: fonts.semibold, fontSize: 14, color: '#fff' }}>{d.site.nav.signIn}</Txt></Link>
              <Button label={d.site.nav.cta} variant="accent" size="sm" onPress={() => router.push('/inscription')} />
            </View>
          )
        ) : (
          <Tap onPress={() => setOpen((o) => !o)} accessibilityLabel={d.site.nav.menu} style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <Feather name={open ? 'x' : 'menu'} size={20} color="#fff" />
          </Tap>
        )}
      </Container>
      {!isDesktop && open && (
        <Container style={{ paddingBottom: 18, gap: 4 }}>
          {nav.map((n) => (
            <Tap key={n.href} onPress={() => { setOpen(false); router.push(n.href as never); }} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' }}>
              <Txt style={{ fontFamily: fonts.semibold, fontSize: 16, color: '#fff' }}>{n.label}</Txt>
            </Tap>
          ))}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            {member ? (
              <Button label={d.site.nav.mySpace} icon="arrow-right" variant="accent" onPress={() => router.push('/')} style={{ flex: 1 }} />
            ) : (
              <>
                <Button label={d.site.nav.signIn} variant="secondary" onPress={() => router.push('/connexion')} style={{ flex: 1 }} />
                <Button label={d.site.nav.cta} variant="accent" onPress={() => router.push('/inscription')} style={{ flex: 1 }} />
              </>
            )}
          </View>
        </Container>
      )}
    </View>
  );
}

/** Text scrolling sideways forever (universities, "Rejoindre l'Amicale"). */
export function Marquee({ items, color, separator = '', speed = 40, style }: { items: string[]; color: string; separator?: string; speed?: number; style?: StyleProp<TextStyle> }) {
  const [w, setW] = useState(0);
  const [x] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!w) return;
    x.setValue(0);
    const anim = Animated.loop(Animated.timing(x, { toValue: -w, duration: (w / speed) * 1000, easing: Easing.linear, useNativeDriver: Platform.OS !== 'web' }));
    anim.start();
    return () => anim.stop();
  }, [w, speed, x]);
  if (!items.length) return null;
  const row = (measure: boolean) => (
    <View onLayout={measure ? (e) => setW(e.nativeEvent.layout.width) : undefined} style={{ flexDirection: 'row' }}>
      {items.map((it, i) => (
        <Txt key={i} numberOfLines={1} style={[{ color, paddingHorizontal: 22 }, style]}>{it}{separator}</Txt>
      ))}
    </View>
  );
  return (
    <View style={{ overflow: 'hidden' }}>
      <Animated.View style={{ flexDirection: 'row', transform: [{ translateX: x }] }}>
        {row(true)}
        {row(false)}
      </Animated.View>
    </View>
  );
}

/** Totals, map with arcs from the lycée and the main destinations (navy band). */
export function NetworkSection({ title, italic, sub }: { title: string; italic: string; sub: string }) {
  const { d, country } = useI18n();
  const { isDesktop, isMobile } = useLayout();
  const o = usePublicOverview();
  const kw = countryByCode('KW')!;
  const targets = o.destinations.map((t) => ({ ...t, c: countryByCode(t.code) })).filter((t) => t.c).map((t) => ({ col: t.c!.pin[0], row: t.c!.pin[1], n: t.n }));
  const stats = [
    [o.alumni, d.site.home.statAlumni],
    [o.countries, d.site.home.statCountries],
    [o.promos, d.site.home.statPromos],
    [o.universities, d.site.home.statUniversities],
  ] as const;
  const top = o.destinations.slice(0, 8);
  const max = Math.max(1, ...top.map((t) => t.n));

  return (
    <Band dark>
      <View style={{ gap: 36 }}>
        <View style={{ gap: 14, maxWidth: 760 }}>
          <SerifTitle text={title} italic={italic} color="#fff" size={isMobile ? 36 : 56} />
          <Txt style={{ color: MIST, fontSize: 16, lineHeight: 24 }}>{sub}</Txt>
        </View>
        <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 36, alignItems: isDesktop ? 'center' : 'stretch' }}>
          <View style={{ flex: isDesktop ? 1.6 : undefined }}>
            <WorldArcs origin={kw.pin} targets={targets} />
          </View>
          <View style={{ flex: isDesktop ? 1 : undefined, gap: 10 }}>
            <Eyebrow label={d.site.home.topDestinations} color={MIST} />
            {top.map((t) => (
              <View key={t.code} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Flag code={t.code} size={13} />
                <Txt numberOfLines={1} style={{ color: '#fff', width: 140, fontFamily: fonts.semibold, fontSize: 14 }}>{country(t.code)}</Txt>
                <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.12)' }}>
                  <View style={{ width: `${(t.n / max) * 100}%`, height: 6, borderRadius: 3, backgroundColor: MIST }} />
                </View>
                <Txt style={{ color: '#fff', width: 28, textAlign: 'right', fontFamily: fonts.bold, fontSize: 14 }}>{t.n}</Txt>
              </View>
            ))}
          </View>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)' }}>
          {stats.map(([n, label]) => (
            <View key={label} style={{ flexBasis: isMobile ? '50%' : '25%', paddingTop: 22, paddingRight: 12, gap: 4 }}>
              <Txt style={{ fontFamily: fonts.serif, fontSize: isMobile ? 44 : 64, lineHeight: isMobile ? 48 : 68, color: '#fff' }}>{n}</Txt>
              <Txt style={{ fontFamily: fonts.semibold, fontSize: 12, letterSpacing: 1.3, textTransform: 'uppercase', color: MIST }}>{label}</Txt>
            </View>
          ))}
        </View>
      </View>
    </Band>
  );
}

/** "Rejoindre l'Amicale en trois étapes." */
export function StepsSection() {
  const { d } = useI18n();
  const { colors } = useTheme();
  const { isMobile } = useLayout();
  const steps = [
    [d.site.home.step1Title, d.site.home.step1Sub],
    [d.site.home.step2Title, d.site.home.step2Sub],
    [d.site.home.step3Title, d.site.home.step3Sub],
  ];
  return (
    <Band>
      <View style={{ gap: 32 }}>
        <SerifTitle text={d.site.home.stepsTitle} italic={d.site.home.stepsItalic} size={isMobile ? 36 : 52} />
        <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: 16 }}>
          {steps.map(([title, sub], i) => (
            <View key={title} style={{ flex: 1, gap: 10, padding: 24, borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
              <Eyebrow label={`${d.site.home.step} ${i + 1}`} />
              <Txt variant="h2">{title}</Txt>
              <Txt color="textMuted">{sub}</Txt>
            </View>
          ))}
        </View>
      </View>
    </Band>
  );
}

/** "Votre promo vous attend." */
export function CtaSection() {
  const { d } = useI18n();
  const { me } = useStore();
  const { isMobile } = useLayout();
  // Members are already in: no "join" call to action inside their space.
  if (me?.approved) return null;
  return (
    <View style={{ backgroundColor: NAVY_DEEP, paddingVertical: isMobile ? 56 : 96 }}>
      <Container style={{ alignItems: 'center', gap: 18 }}>
        <SerifTitle text={d.site.home.ctaTitle} italic={d.site.home.ctaItalic} color="#fff" size={isMobile ? 40 : 64} align="center" />
        <Txt style={{ color: MIST, fontSize: 16, textAlign: 'center', maxWidth: 520 }}>{d.site.home.ctaSub}</Txt>
        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 6 }}>
          {me ? (
            <Button label={d.site.nav.mySpace} icon="arrow-right" variant="accent" size="lg" onPress={() => router.push('/')} />
          ) : (
            <>
              <Button label={d.site.home.cta1} variant="accent" size="lg" onPress={() => router.push('/inscription')} />
              <Button label={d.site.nav.signIn} variant="secondary" size="lg" onPress={() => router.push('/connexion')} />
            </>
          )}
        </View>
      </Container>
    </View>
  );
}

function Footer() {
  const { d, f } = useI18n();
  const { isMobile } = useLayout();
  const insets = useSafeAreaInsets();
  const nav = useSiteNav();
  const links = [
    ...nav,
    { href: '/inscription', label: d.site.footer.createAccount },
    { href: '/contact', label: d.nav.contact },
    { href: '/mentions-legales', label: d.nav.legal },
    { href: '/confidentialite', label: d.legal.privacy },
    { href: '/plan-du-site', label: d.nav.sitemap },
  ];
  return (
    <View>
      <View style={{ backgroundColor: RED, paddingVertical: 14 }}>
        <Marquee items={Array(8).fill(d.site.footer.band)} separator="   •" color="#fff" style={{ fontFamily: fonts.bold, fontSize: 13, letterSpacing: 2, textTransform: 'uppercase' }} />
      </View>
      <View style={{ backgroundColor: NAVY, paddingTop: 48, paddingBottom: insets.bottom + 32 }}>
        <Container style={{ gap: 32 }}>
          <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: 28, justifyContent: 'space-between' }}>
            <View style={{ gap: 10, maxWidth: 420 }}>
              <Txt style={{ fontFamily: fonts.semibold, fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase', color: '#fff' }}>{d.app.long}</Txt>
              <SerifTitle text={d.site.footer.tagline} color={MIST} size={26} />
              <Link href="/contact" style={{ marginTop: 6 }}>
                <Txt style={{ fontFamily: fonts.bold, fontSize: 13, letterSpacing: 1.2, textTransform: 'uppercase', color: '#fff' }}>{d.site.footer.contact} →</Txt>
              </Link>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, maxWidth: 520 }}>
              {links.map((l) => (
                <Link key={l.href} href={l.href as never} style={{ width: isMobile ? '45%' : 160 }}>
                  <Txt style={{ fontFamily: fonts.semibold, fontSize: 13, letterSpacing: 0.6, textTransform: 'uppercase', color: MIST }}>{l.label}</Txt>
                </Link>
              ))}
            </View>
          </View>
          <Txt style={{ color: 'rgba(200,211,229,0.7)', fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase' }}>{f(d.site.footer.copyright, { year: new Date().getFullYear() })}</Txt>
        </Container>
      </View>
    </View>
  );
}

/**
 * Frame of every public page: navy menu, content, red band, footer. Approved members get the
 * same page inside their space, with the sidebar on the left.
 */
export function PublicSite({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const { me, session } = useStore();
  if (me?.approved && !session?.recovery) {
    return (
      <AppShell>
        <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ flexGrow: 1, paddingBottom: 96 }}>
          {children}
        </ScrollView>
      </AppShell>
    );
  }
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        {children}
        <Footer />
      </ScrollView>
    </View>
  );
}

/** Page title block on a navy band (L'Amicale, Le bureau, Partenaires, Adhérer). */
export function PageHero({ eyebrow, title, italic, sub, children, image }: { eyebrow: string; title: string; italic?: string; sub?: string; children?: ReactNode; image?: string }) {
  const { isDesktop, isMobile } = useLayout();
  return (
    <View style={{ backgroundColor: NAVY, paddingTop: isMobile ? 40 : 72, paddingBottom: isMobile ? 48 : 88, overflow: 'hidden' }}>
      <Container style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 40, alignItems: isDesktop ? 'center' : 'stretch' }}>
        <View style={{ flex: 1, gap: 18 }}>
          <Eyebrow label={eyebrow} color={MIST} />
          <SerifTitle text={title} italic={italic} color="#fff" size={isMobile ? 40 : 64} />
          {sub && <Txt style={{ color: MIST, fontSize: isMobile ? 15 : 18, lineHeight: isMobile ? 23 : 28, maxWidth: 640 }}>{sub}</Txt>}
          {children}
        </View>
        {isDesktop && image && (
          <View style={{ width: 360, height: 420, borderRadius: 24, overflow: 'hidden', transform: [{ rotate: '3deg' }] }}>
            <Image source={{ uri: image }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={300} />
          </View>
        )}
      </Container>
    </View>
  );
}

