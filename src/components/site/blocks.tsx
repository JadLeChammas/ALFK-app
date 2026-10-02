import { Feather } from '@expo/vector-icons';
import { Image, type ImageSource } from 'expo-image';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState, type ReactNode } from 'react';
import { Platform, Pressable, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, Easing, FadeIn, FadeInRight, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { FloatingDots } from '@/components/fx/FloatingDots';
import { ImageReveal } from '@/components/fx/ImageReveal';
import { useInView } from '@/components/fx/useInView';
import { Globe, type GlobeMarker } from '@/components/fx/Globe';
import { MaskedText } from '@/components/fx/MaskedText';
import { Marquee } from '@/components/fx/Marquee';
import { SpinningButton } from '@/components/fx/SpinningButton';
import { TextRoll } from '@/components/fx/TextRoll';
import { Flag } from '@/components/ui/Flag';
import { Button, Tap } from '@/components/ui/primitives';
import { Txt } from '@/components/ui/Txt';
import { useCommunity, usePublishedQuotes } from '@/data/community';
import { useStore } from '@/data/store';
import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { brand, fonts, radius } from '@/theme/tokens';
import { Reveal } from './Reveal';
import { Container, LinkCta, Section, SerifHeading, ToneProvider, useTone, type Tone } from './SiteFrame';

type Img = string | ImageSource | number;
const src = (i: Img) => (typeof i === 'string' ? { uri: i } : i);
type Cta = { label: string; onPress: () => void };

/** Web-only CSS filter (grayscale portraits); native shows the photo as is. */
const webFilter = (f: string): StyleProp<ImageStyle> => (Platform.OS === 'web' ? ({ filter: f, transitionProperty: 'filter', transitionDuration: '500ms' } as object) : null);

/** Pressable that hands its hover state (web) to a render function. */
function Hoverable({ onPress, style, children }: { onPress?: () => void; style?: StyleProp<ViewStyle>; children: (hovered: boolean) => ReactNode }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable onPress={onPress} disabled={!onPress} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)} style={style}>
      {children(hovered)}
    </Pressable>
  );
}

/** A full-bleed band that is not a <Section> (heroes, ribbons). */
function Band({ tone, children, style }: { tone: Tone; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <ToneProvider tone={tone}>
      <BandBg style={style}>{children}</BandBg>
    </ToneProvider>
  );
}
function BandBg({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTone();
  return <View style={[{ backgroundColor: t.bg }, style]}>{children}</View>;
}

/* ───────────────────────── Editorial Image Hero (hero-07) ───────────────────────── */

/**
 * Port of 21st.dev "Editorial Image Hero" (felipemenezes098): full-width landscape photo fading
 * into the band colour, then a 12-column row — tagline left, serif headline + copy + CTAs right.
 */
export function EditorialImageHero(props: { tagline: string; title: string; description?: string; image: Img; primary?: Cta; secondary?: Cta; tone?: Tone }) {
  return (
    <Band tone={props.tone ?? 'page'}>
      <ImageHeroInner {...props} />
    </Band>
  );
}

function ImageHeroInner({ tagline, title, description, image, primary, secondary }: { tagline: string; title: string; description?: string; image: Img; primary?: Cta; secondary?: Cta }) {
  const t = useTone();
  const { isDesktop, isMobile } = useLayout();
  return (
    <View>
      <View style={{ width: '100%', aspectRatio: isMobile ? 1.5 : 9 / 3.6, overflow: 'hidden' }}>
        <SettleZoom>
          <Image source={src(image)} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={300} />
        </SettleZoom>
        {/* keeps the transparent header legible over the photo */}
        <LinearGradient colors={['rgba(0,32,106,0.7)', 'rgba(0,32,106,0)']} locations={[0, 0.45]} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        <LinearGradient colors={[`${t.bg}00`, t.bg]} locations={[0.62, 1]} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      </View>
      <Container style={{ flexDirection: isDesktop ? 'row' : 'column', gap: isDesktop ? 0 : 24, paddingTop: isMobile ? 16 : 40, paddingBottom: isMobile ? 56 : 104 }}>
        <Reveal style={{ width: isDesktop ? '33%' : '100%', paddingRight: 24 }}>
          <View style={{ width: 28, height: 3, backgroundColor: t.accent, marginBottom: 14, marginTop: 10 }} />
          <Txt style={{ fontFamily: fonts.semibold, fontSize: 12, lineHeight: 18, letterSpacing: 1.6, textTransform: 'uppercase', color: t.fg, maxWidth: 280 }}>{tagline}</Txt>
        </Reveal>
        <View style={{ flex: 1, marginLeft: isDesktop ? '17%' : 0, gap: 24 }}>
          <SerifHeading title={title} size="lg" />
          {description && (
            <Reveal index={2}>
              <Txt style={{ fontFamily: fonts.regular, fontSize: isMobile ? 15 : 17, lineHeight: 27, color: t.muted, maxWidth: 560 }}>{description}</Txt>
            </Reveal>
          )}
          {(primary || secondary) && (
            <Reveal index={3} style={{ flexDirection: 'row', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              {primary && <Button label={primary.label} size="lg" variant={t.onColor ? 'white' : 'primary'} onPress={primary.onPress} />}
              {secondary && <LinkCta label={secondary.label} onPress={secondary.onPress} />}
            </Reveal>
          )}
        </View>
      </Container>
    </View>
  );
}

/** Photo that eases from a slight zoom to rest when the page opens. */
function SettleZoom({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const z = useSharedValue(reduced ? 1 : 1.12);
  useEffect(() => {
    if (!reduced) z.value = withTiming(1, { duration: 1800, easing: Easing.bezier(0.22, 1, 0.36, 1) });
  }, [reduced, z]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: z.value }] }));
  return <Animated.View style={[{ width: '100%', height: '100%' }, style]}>{children}</Animated.View>;
}

/* ───────────────────────── Content Grid Section (content-04) ───────────────────────── */

export type ContentItem = { title: string; description?: string; image: Img; onPress?: () => void };

/**
 * Port of 21st.dev "Content Grid Section" (felipemenezes098): serif heading + subheading, then a
 * two-column grid of cards — title and copy on top, photo anchored to the bottom edge. Cards take
 * the band's card colour (navy on the light-blue page) instead of white.
 */
export function ContentGrid({ title, description, items, columns = 2 }: { title?: string; description?: string; items: ContentItem[]; columns?: 2 | 3 }) {
  const t = useTone();
  const { isMobile, width } = useLayout();
  const cols = isMobile ? 1 : width < 1100 && columns === 3 ? 2 : columns;
  return (
    <View style={{ gap: isMobile ? 32 : 56 }}>
      {(title || description) && <SerifHeading title={title ?? ''} lead={description} />}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -12 }}>
        {items.map((it, i) => (
          <Reveal key={it.title} index={i % cols} style={{ width: `${100 / cols}%`, padding: 12 }}>
            <Hoverable onPress={it.onPress} style={{ flex: 1 }}>
              {(hovered) => (
                <View style={{ flex: 1, borderRadius: radius.hero, backgroundColor: t.card, overflow: 'hidden', transform: [{ translateY: hovered ? -4 : 0 }], ...(Platform.OS === 'web' ? ({ transitionProperty: 'transform', transitionDuration: '300ms' } as object) : {}) }}>
                  <View style={{ padding: 28, gap: 8 }}>
                    <Txt style={{ fontFamily: fonts.serif, fontSize: 30, lineHeight: 32, color: t.cardFg }}>{it.title}</Txt>
                    {it.description && <Txt style={{ fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: t.cardMuted }}>{it.description}</Txt>}
                  </View>
                  <View style={{ flex: 1, justifyContent: 'flex-end', paddingHorizontal: 28 }}>
                    <View style={{ aspectRatio: 16 / 9, minHeight: isMobile ? 180 : 240, borderTopLeftRadius: radius.card, borderTopRightRadius: radius.card, overflow: 'hidden' }}>
                      <View style={[{ width: '100%', height: '100%' }, Platform.OS === 'web' && ({ transform: [{ scale: hovered ? 1.05 : 1 }], transitionProperty: 'transform', transitionDuration: '600ms', transitionTimingFunction: 'cubic-bezier(0.22,1,0.36,1)' } as object)]}>
                        <ImageReveal source={it.image} cover={t.accent} delay={(i % cols) * 120} style={{ width: '100%', height: '100%' }} />
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </Hoverable>
          </Reveal>
        ))}
      </View>
    </View>
  );
}

/* ───────────────────────── Big statement (delassus.com "3000HA") ───────────────────────── */

/**
 * Giant condensed figure framed by small-caps lines, with glossy spheres floating around it —
 * the "WE HANDLE 3000HA OF SELECTED VARIETIES" panel of delassus.com. The number flips in
 * character by character (Text Roll) when it scrolls into view.
 */
export function BigStatement({ tone = 'blue' }: { tone?: Tone }) {
  const { d, f } = useI18n();
  const c = useCommunity();
  return (
    <ToneProvider tone={tone}>
      <BigInner pre={d.site.home.bigPre} unit={d.site.home.bigUnit} post={f(d.site.home.bigPost, { c: c.countries, u: c.universities })} value={String(c.alumni)} />
    </ToneProvider>
  );
}

function BigInner({ pre, unit, post, value }: { pre: string; unit: string; post: string; value: string }) {
  const t = useTone();
  const { isMobile, width } = useLayout();
  const big = Math.min(isMobile ? 200 : 340, width * (isMobile ? 0.52 : 0.26));
  const onBlue = t.tone === 'blue';
  const capsColor = onBlue ? '#FFFFFF' : t.fg;
  const unitColor = onBlue ? brand.navy : t.accent;
  const caps = { fontFamily: fonts.display, fontSize: isMobile ? 26 : 44, lineHeight: isMobile ? 30 : 48, letterSpacing: isMobile ? 3 : 6, color: capsColor };
  return (
    <View style={{ backgroundColor: t.bg, overflow: 'hidden', paddingVertical: isMobile ? 72 : 120 }}>
      <FloatingDots color={brand.navy} altColor={onBlue ? undefined : brand.red} edgesOnly={isMobile} />
      <Container style={{ alignItems: 'center' }}>
        <MaskedText text={pre.toUpperCase()} style={caps} align="center" />
        <TextRoll style={{ fontFamily: fonts.display, fontSize: big, lineHeight: big * 0.98, color: brand.navy }} delay={0.15} stagger={0.08} duration={0.5}>
          {value}
        </TextRoll>
        <MaskedText text={unit.toUpperCase()} style={[caps, { color: unitColor, fontSize: isMobile ? 38 : 68, lineHeight: isMobile ? 42 : 72 }]} align="center" delay={0.2} />
        <MaskedText text={post.toUpperCase()} style={caps} containerStyle={{ marginTop: 12 }} align="center" delay={0.35} />
      </Container>
    </View>
  );
}

/* ───────────────────────── Team Showcase (makviesainte) ───────────────────────── */

export type TeamMember = { id: string; name: string; role: string; image?: string; onPress?: () => void };

/**
 * Port of 21st.dev "Team Showcase": a three-column staggered photo grid next to the member list.
 * Photos are grayscale until their person is hovered/pressed (on web); the matching row lights up.
 */
export function TeamShowcase({ members }: { members: TeamMember[] }) {
  const t = useTone();
  const { isMobile, isDesktop } = useLayout();
  const [active, setActive] = useState<string | null>(null);
  const cols = [0, 1, 2].map((c) => members.filter((_, i) => i % 3 === c));
  const sizes = isMobile
    ? [{ w: 104, h: 114, mt: 0 }, { w: 112, h: 122, mt: 44 }, { w: 106, h: 116, mt: 20 }]
    : [{ w: 155, h: 165, mt: 0 }, { w: 172, h: 182, mt: 68 }, { w: 162, h: 172, mt: 32 }];
  const hoverProps = (id: string) => ({ onHoverIn: () => setActive(id), onHoverOut: () => setActive(null) });

  return (
    <View style={{ flexDirection: isDesktop ? 'row' : 'column', alignItems: 'flex-start', gap: isDesktop ? 56 : 32 }}>
      <View style={{ flexDirection: 'row', gap: isMobile ? 8 : 12, alignSelf: isDesktop ? 'flex-start' : 'center' }}>
        {cols.map((col, ci) => (
          <View key={ci} style={{ gap: isMobile ? 8 : 12, marginTop: sizes[ci].mt }}>
            {col.map((m) => {
              const on = active === m.id;
              const dim = active !== null && !on;
              return (
                <Pressable key={m.id} {...hoverProps(m.id)} onPress={() => (m.onPress ? m.onPress() : setActive(on ? null : m.id))} style={{ width: sizes[ci].w, height: sizes[ci].h, borderRadius: radius.card, overflow: 'hidden', opacity: dim ? 0.6 : 1, backgroundColor: t.rule }}>
                  {m.image && <Image source={{ uri: m.image }} style={[{ width: '100%', height: '100%' }, webFilter(on ? 'grayscale(0) brightness(1)' : 'grayscale(1) brightness(0.77)')]} contentFit="cover" />}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
      <View style={{ flex: 1, alignSelf: 'stretch', gap: isMobile ? 16 : 20, paddingTop: isDesktop ? 8 : 0 }}>
        {members.map((m) => {
          const on = active === m.id;
          const dim = active !== null && !on;
          return (
            <Pressable key={m.id} {...hoverProps(m.id)} onPress={() => (m.onPress ? m.onPress() : setActive(on ? null : m.id))} style={{ opacity: dim ? 0.5 : 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: on ? 20 : 16, height: 12, borderRadius: 5, backgroundColor: on ? t.accent : t.rule }} />
                <Txt style={{ fontFamily: fonts.semibold, fontSize: isMobile ? 16 : 18, letterSpacing: -0.3, color: on ? t.fg : t.muted }}>{m.name}</Txt>
                {on && m.onPress && (
                  <Animated.View entering={FadeInRight.duration(200)}>
                    <Feather name="arrow-up-right" size={14} color={t.muted} />
                  </Animated.View>
                )}
              </View>
              <Txt style={{ marginTop: 6, paddingLeft: 26, fontFamily: fonts.medium, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: t.muted }}>{m.role}</Txt>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/* ───────────────────────── Editorial Testimonial (jatin-yadav05) ───────────────────────── */

export type Quote = { quote: string; author: string; role: string; org: string; image?: string };

/**
 * Port of 21st.dev "Editorial Testimonial": oversized index numeral, the quote, author with a
 * grayscale portrait, and a line selector with "01 / 03" and prev/next controls.
 */
const QUOTE_MS = 8000;

export function EditorialTestimonial({ quotes }: { quotes: Quote[] }) {
  const t = useTone();
  const { isMobile } = useLayout();
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const bar = useSharedValue(0);
  const q = quotes[i];
  const go = (n: number) => setI((n + quotes.length) % quotes.length);
  useEffect(() => {
    if (reduced || paused || quotes.length < 2) {
      cancelAnimation(bar);
      return;
    }
    bar.value = 0;
    bar.value = withTiming(1, { duration: QUOTE_MS, easing: Easing.linear });
    const timer = setTimeout(() => setI((n) => (n + 1) % quotes.length), QUOTE_MS);
    return () => clearTimeout(timer);
  }, [i, paused, reduced, quotes.length, bar]);
  const fill = useAnimatedStyle(() => ({ width: bar.value * 48 }));
  const pad = (n: number) => String(n).padStart(2, '0');
  if (!q) return null;
  return (
    <Pressable onHoverIn={() => setPaused(true)} onHoverOut={() => setPaused(false)} style={{ width: '100%', maxWidth: 820, alignSelf: 'center', cursor: 'auto' } as object}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: isMobile ? 16 : 32 }}>
        <Txt style={{ fontFamily: fonts.display, fontSize: isMobile ? 84 : 150, lineHeight: isMobile ? 84 : 150, color: t.fg, opacity: 0.2 }}>{pad(i + 1)}</Txt>
        <Animated.View key={i} entering={FadeInRight.duration(300)} style={{ flex: 1, paddingTop: isMobile ? 8 : 24 }}>
          <Txt style={{ fontFamily: fonts.serif, fontSize: isMobile ? 26 : 36, lineHeight: isMobile ? 33 : 45, letterSpacing: -0.3, color: t.fg }}>“{q.quote}”</Txt>
          <Hoverable style={{ marginTop: 32 }}>
            {(hovered) => (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, overflow: 'hidden', borderWidth: 2, borderColor: hovered ? t.fg : t.rule, backgroundColor: t.rule }}>
                  {q.image && <Image source={{ uri: q.image }} style={[{ width: '100%', height: '100%' }, webFilter(hovered ? 'grayscale(0)' : 'grayscale(1)')]} contentFit="cover" />}
                </View>
                <View>
                  <Txt style={{ fontFamily: fonts.semibold, fontSize: 15, color: t.fg }}>{q.author}</Txt>
                  <Txt style={{ fontFamily: fonts.regular, fontSize: 13, color: t.muted }}>
                    {q.role}
                    {'  /  '}
                    {q.org}
                  </Txt>
                </View>
              </View>
            )}
          </Hoverable>
        </Animated.View>
      </View>
      <View style={{ marginTop: isMobile ? 40 : 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {quotes.map((_, n) => (
              <Tap key={n} onPress={() => go(n)} style={{ paddingVertical: 16 }} accessibilityLabel={pad(n + 1)}>
                <View style={{ height: 2, width: n === i ? 48 : 24, backgroundColor: t.rule, overflow: 'hidden' }}>
                  {n === i && <Animated.View style={[{ position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: t.fg }, reduced || paused ? { width: 48 } : fill]} />}
                </View>
              </Tap>
            ))}
          </View>
          <Txt style={{ fontFamily: fonts.medium, fontSize: 11, letterSpacing: 2, color: t.muted }}>
            {pad(i + 1)} / {pad(quotes.length)}
          </Txt>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['chevron-left', 'chevron-right'] as const).map((icon, n) => (
            <Tap key={icon} onPress={() => go(i + (n ? 1 : -1))} style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: t.rule }} hoverStyle={{ backgroundColor: t.rule }}>
              <Feather name={icon} size={20} color={t.fg} />
            </Tap>
          ))}
        </View>
      </View>
    </Pressable>
  );
}

/* ───────────────────────── Globe (interactive-globe demo) ───────────────────────── */

/** Key figures separated by thin vertical rules — as in the Interactive Globe demo; digits roll in. */
export function StatsRow({ light, items, dense }: { light?: boolean; items?: { v: number; l: string }[]; /** Tighter sizing for compact cards. */ dense?: boolean }) {
  const { d } = useI18n();
  const t = useTone();
  const { isMobile } = useLayout();
  const c = useCommunity();
  const fg = light ? '#fff' : t.fg;
  const list = items ?? [
    { v: c.alumni, l: d.site.home.statAlumni },
    { v: c.countries, l: d.site.home.statCountries },
    { v: c.promos, l: d.site.home.statPromos },
    { v: c.universities, l: d.site.home.statUniversities },
    { v: c.nationalities, l: d.site.home.statNationalities },
  ];
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', rowGap: 16 }}>
      {list.map((it, i) => (
        <View key={it.l} style={{ flexDirection: 'row', alignItems: 'center' }}>
          {i > 0 && !(isMobile && i % 2 === 0) && <View style={{ width: 1, height: 36, backgroundColor: light ? 'rgba(200,211,229,0.25)' : t.rule, marginHorizontal: isMobile || dense ? 14 : 24 }} />}
          <View style={{ minWidth: isMobile ? 110 : undefined }}>
            <TextRoll style={{ fontFamily: fonts.display, fontSize: isMobile ? 40 : dense ? 44 : 52, lineHeight: isMobile ? 44 : dense ? 48 : 56, color: fg }} delay={0.1 + i * 0.15}>
              {String(it.v)}
            </TextRoll>
            <Txt style={{ fontFamily: fonts.medium, fontSize: dense ? 10 : 11, letterSpacing: dense ? 0.8 : 1.2, textTransform: 'uppercase', color: light ? brand.sky : t.muted }}>{it.l}</Txt>
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * Layout of the 21st.dev "Interactive Globe" demo: dark card with copy on the left and the
 * draggable globe on the right. `bleed` renders it as a full-width navy band instead of a card.
 */
export function GlobeCard({ title, accent, lead, markers, stats, children, compact, bleed }: { title: string; accent?: string; lead?: string; markers: GlobeMarker[]; stats?: ReactNode; children?: ReactNode; compact?: boolean; bleed?: boolean }) {
  const { isDesktop, isMobile } = useLayout();
  const inner = (
    <View style={{ flexDirection: isDesktop ? 'row' : 'column', minHeight: isDesktop ? (compact ? 380 : 540) : undefined }}>
      <View style={{ flex: 1, justifyContent: 'center', padding: bleed ? 0 : isMobile ? 24 : compact ? 40 : 56, paddingVertical: bleed ? (isMobile ? 16 : 40) : undefined, gap: 16 }}>
        <SerifHeading title={title} accent={accent} lead={lead} light size={compact ? 'md' : 'lg'} />
        {children && <Reveal index={1}>{children}</Reveal>}
        {stats && <Reveal index={2} style={{ marginTop: 12 }}>{stats}</Reveal>}
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: isDesktop ? 0 : 8, paddingBottom: isDesktop ? 0 : 24 }}>
        <Globe tone="dark" markers={markers} maxSize={compact ? 380 : 520} />
      </View>
    </View>
  );
  const glow = <View pointerEvents="none" style={{ position: 'absolute', top: -120, right: '20%', width: 420, height: 420, borderRadius: 210, backgroundColor: brand.blue, opacity: 0.16, ...(Platform.OS === 'web' ? ({ filter: 'blur(72px)' } as object) : {}) }} />;
  if (bleed) {
    return (
      <ToneProvider tone="navy">
        <View style={{ backgroundColor: brand.navy, overflow: 'hidden', paddingVertical: isMobile ? 40 : 64 }}>
          {glow}
          <Container>{inner}</Container>
        </View>
      </ToneProvider>
    );
  }
  return (
    <ToneProvider tone="navy">
      <View style={{ borderRadius: radius.hero, overflow: 'hidden', backgroundColor: brand.navy, borderWidth: 1, borderColor: 'rgba(200,211,229,0.12)' }}>
        {glow}
        {inner}
      </View>
    </ToneProvider>
  );
}

/** Globe markers for every alumni destination (Kuwait is the arcs' origin). */
export function useDestinationMarkers(activeCode?: string | null): GlobeMarker[] {
  const { country } = useI18n();
  const { destinations } = useCommunity();
  return destinations
    .filter((x) => x.country.code !== 'KW')
    .map((x) => ({ key: x.country.code, ll: x.country.ll, weight: x.n, label: country(x.country.code), active: x.country.code === activeCode }));
}

/* ───────────────────────── Universities ribbon ───────────────────────── */

/** Text-only ribbon of the universities our alumni attend, scrolling slowly on a brand band. */
export function UniversityRibbon({ tone = 'navy' }: { tone?: Tone }) {
  const { d } = useI18n();
  const { schools } = useCommunity();
  return (
    <Band tone={tone}>
      <RibbonInner caption={d.site.home.studyAt} schools={schools} />
    </Band>
  );
}

function RibbonInner({ caption, schools }: { caption: string; schools: { name: string; country?: string }[] }) {
  const t = useTone();
  return (
    <View style={{ paddingVertical: 22, gap: 12 }}>
      <Container>
        <Txt style={{ fontFamily: fonts.medium, fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase', color: t.muted, textAlign: 'center' }}>{caption}</Txt>
      </Container>
      <Marquee fade={t.bg} speed={30} gap={56}>
        {schools.map((s) => (
          <View key={s.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, height: 44 }}>
            {s.country && <Flag code={s.country} size={13} />}
            <Txt style={{ fontFamily: fonts.serif, fontSize: 26, color: t.fg }} numberOfLines={1}>{s.name}</Txt>
          </View>
        ))}
      </Marquee>
    </View>
  );
}

/* ───────────────────────── FAQ accordion ───────────────────────── */

export function Accordion({ items }: { items: { t: string; d: string }[] }) {
  const t = useTone();
  const [open, setOpen] = useState<number | null>(0);
  return (
    <View style={{ borderTopWidth: 1, borderTopColor: t.rule }}>
      {items.map((q, i) => {
        const on = open === i;
        return (
          <View key={q.t} style={{ borderBottomWidth: 1, borderBottomColor: t.rule }}>
            <Tap onPress={() => setOpen(on ? null : i)} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 22 }}>
              <Txt style={{ flex: 1, fontFamily: fonts.serif, fontSize: 24, lineHeight: 28, color: t.fg }}>{q.t}</Txt>
              <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? t.accent : 'transparent', borderWidth: 1, borderColor: on ? t.accent : t.rule }}>
                <Feather name={on ? 'minus' : 'plus'} size={16} color={on ? '#fff' : t.fg} />
              </View>
            </Tap>
            {on && (
              <Animated.View entering={FadeIn.duration(220)} style={{ paddingBottom: 22, paddingRight: 52 }}>
                <Txt style={{ fontFamily: fonts.regular, fontSize: 15, lineHeight: 24, color: t.muted }}>{q.d}</Txt>
              </Animated.View>
            )}
          </View>
        );
      })}
    </View>
  );
}

/** Quotes from the board and the school leadership, labelled for the testimonial block. */
export function useQuoteCards(): Quote[] {
  const { d } = useI18n();
  return usePublishedQuotes().map((q) => ({
    quote: q.quote,
    author: q.author,
    image: q.image,
    role: q.fonction ?? (q.isPresident ? d.site.bureau.president : d.site.bureau.member),
    org: d.app.name,
  }));
}

/** Editorial columns: top rule, small caption, serif title, copy. The first column is accented. */
export function RuleColumns({ items }: { items: { t: string; d: string; label?: string }[]; /** @deprecated tone comes from the band */ light?: boolean }) {
  const t = useTone();
  const { isMobile, width } = useLayout();
  const perRow = isMobile ? 1 : width < 1100 && items.length > 3 ? 2 : items.length;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -20, rowGap: isMobile ? 28 : 40 }}>
      {items.map((it, i) => (
        <Reveal key={it.t} index={i} style={{ width: `${100 / perRow}%`, paddingHorizontal: 20 }}>
          <DrawnRule color={i === 0 ? t.accent : t.rule} thick={i === 0} delay={i * 140} />
          <View style={{ paddingTop: 20, gap: 8 }}>
            {it.label && <Txt style={{ fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase', color: i === 0 ? t.accent : t.muted }}>{it.label}</Txt>}
            <Txt style={{ fontFamily: fonts.serif, fontSize: 32, lineHeight: 35, color: t.fg }}>{it.t}</Txt>
            <Txt style={{ fontFamily: fonts.regular, fontSize: 15, lineHeight: 23, color: t.muted }}>{it.d}</Txt>
          </View>
        </Reveal>
      ))}
    </View>
  );
}

/** A rule that draws from left to right when it scrolls into view. */
function DrawnRule({ color, thick, delay }: { color: string; thick?: boolean; delay: number }) {
  const [ref, inView] = useInView();
  const reduced = useReducedMotion();
  const p = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (inView && !reduced) p.value = withDelay(delay + 150, withTiming(1, { duration: 900, easing: Easing.bezier(0.77, 0, 0.18, 1) }));
  }, [inView, reduced, delay, p]);
  const style = useAnimatedStyle(() => ({ width: `${p.value * 100}%` }));
  return (
    <View ref={ref} style={{ height: thick ? 3 : 1 }}>
      <Animated.View style={[{ height: '100%', backgroundColor: color }, style]} />
    </View>
  );
}

/** Closing call to action on a red band: serif line + the spinning round button. Hidden when signed in. */
export function ClosingCta() {
  const { d } = useI18n();
  const { me } = useStore();
  const { isDesktop } = useLayout();
  if (me) return null;
  return (
    <Section tone="red">
      <View style={{ flexDirection: isDesktop ? 'row' : 'column', alignItems: 'center', justifyContent: 'space-between', gap: 32 }}>
        <View style={{ flex: isDesktop ? 1 : undefined, gap: 20, alignItems: isDesktop ? 'flex-start' : 'center' }}>
          <SerifHeading title={d.site.home.ctaTitle} accent={d.site.home.ctaItalic} lead={d.site.home.ctaSub} size="xl" center={!isDesktop} />
          <Reveal index={3}>
            <LinkCta label={d.site.nav.signIn} onPress={() => router.push('/connexion')} />
          </Reveal>
        </View>
        <Reveal index={2}>
          <SpinningButton text={d.site.home.cta1} size={isDesktop ? 190 : 150} color={brand.navy} onPress={() => router.push('/inscription')} />
        </Reveal>
      </View>
    </Section>
  );
}
