import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState, type ReactNode } from 'react';
import { Platform, Pressable, View } from 'react-native';
import Animated, { cancelAnimation, Easing, interpolate, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming, type SharedValue } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Txt } from '@/components/ui/Txt';
import { useOnScreen } from '@/components/fx/useOnScreen';
import { useI18n } from '@/i18n';
import { openExternal } from '@/lib/links';
import { fonts, radius } from '@/theme/tokens';

/**
 * Hi Dev's products (Hi Dev Mobile page): each card in its own brand — logo, colours and an
 * animated illustration of what the product does. Each card is one real, followed link with a
 * descriptive anchor (healthy backlink); animations run only while on screen and stop with
 * « reduce motion ».
 *
 * Brand colours come from the products' own stylesheets / icons:
 *  LaBreak  — green #2D4A3E, gold #E8B04A, cream #F5F1E8
 *  ResOlio  — ink #0A0A0A, Olio cyan #96DBE9, teal #117689
 *  InstantWebsite — blue #2C5EDB → #1840AC (icon), orange #F5A623
 */

type Copy = { tag: string; text: string; anchor: string };
export type Product = {
  name: string;
  url: string;
  host: string;
  logo: number;
  fr: Copy;
  en: Copy;
  theme: { bg: [string, string]; ink: string; muted: string; accent: string; stage: string };
  Art: (p: { t: SharedValue<number> }) => ReactNode;
};

const BOLD = 'Inter_800ExtraBold';

/** 0 → 1 over `ms`, forever, while on screen (frozen at a nice frame with reduced motion). */
function useLoop(ms: number, active: boolean) {
  const reduced = useReducedMotion();
  const t = useSharedValue(reduced ? 0.7 : 0);
  useEffect(() => {
    if (reduced || !active) return;
    t.value = withRepeat(withTiming(1, { duration: ms, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(t);
  }, [reduced, active, ms, t]);
  return t;
}

/* ───────────── LaBreak: a lunch plate, rising steam, a ticket-resto card, a map pin ───────────── */

function Steam({ t, x, delay }: { t: SharedValue<number>; x: number; delay: number }) {
  const s = useAnimatedStyle(() => {
    const u = (t.value + delay) % 1;
    return { opacity: interpolate(u, [0, 0.25, 0.8, 1], [0, 0.9, 0.3, 0]), transform: [{ translateY: interpolate(u, [0, 1], [8, -22]) }] };
  });
  return (
    <Animated.View style={[{ position: 'absolute', left: x, top: 14 }, s]}>
      <Svg width={14} height={30} viewBox="0 0 14 30">
        <Path d="M7 29 C1 22 13 16 7 9 C3 5 9 2 7 0" stroke="#2D4A3E" strokeWidth={2.4} fill="none" strokeLinecap="round" opacity={0.55} />
      </Svg>
    </Animated.View>
  );
}

function LaBreakArt({ t }: { t: SharedValue<number> }) {
  const pin = useAnimatedStyle(() => {
    const u = t.value;
    const drop = u < 0.18 ? interpolate(u, [0, 0.18], [-26, 0]) : u < 0.26 ? interpolate(u, [0.18, 0.22, 0.26], [0, -6, 0]) : 0;
    return { transform: [{ translateY: drop }], opacity: interpolate(u, [0, 0.06, 0.92, 1], [0, 1, 1, 0]) };
  });
  const card = useAnimatedStyle(() => ({ transform: [{ translateY: Math.sin(t.value * Math.PI * 2) * 4 }, { rotate: `${8 + Math.sin(t.value * Math.PI * 2) * 3}deg` }] }));
  return (
    <View style={{ width: 260, height: 130 }}>
      {/* plate */}
      <View style={{ position: 'absolute', left: 82, top: 30, width: 96, height: 96, borderRadius: 48, backgroundColor: '#fff', borderWidth: 6, borderColor: '#EDE9E0', alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#E8B04A', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 24, height: 12, borderRadius: 12, backgroundColor: '#2D4A3E', transform: [{ rotate: '-25deg' }] }} />
        </View>
      </View>
      {/* fork & knife */}
      <View style={{ position: 'absolute', left: 64, top: 44, width: 5, height: 72, borderRadius: 3, backgroundColor: '#2D4A3E', opacity: 0.8 }} />
      <View style={{ position: 'absolute', left: 190, top: 44, width: 7, height: 72, borderRadius: 4, backgroundColor: '#2D4A3E', opacity: 0.8 }} />
      <Steam t={t} x={106} delay={0} />
      <Steam t={t} x={124} delay={0.33} />
      <Steam t={t} x={142} delay={0.66} />
      {/* map pin */}
      <Animated.View style={[{ position: 'absolute', left: 14, top: 22 }, pin]}>
        <Feather name="map-pin" size={30} color="#B23A2F" />
      </Animated.View>
      {/* ticket-resto card */}
      <Animated.View style={[{ position: 'absolute', right: 0, top: 18, width: 56, height: 36, borderRadius: 7, backgroundColor: '#E8B04A', borderWidth: 2, borderColor: '#C9942F', alignItems: 'center', justifyContent: 'center' }, card]}>
        <Txt style={{ fontFamily: BOLD, fontSize: 11, letterSpacing: 0.5, color: '#2D4A3E' }}>TR</Txt>
      </Animated.View>
    </View>
  );
}

/* ───────────── ResOlio: a floor plan filling up, Olio typing ───────────── */

function Table({ t, i, round }: { t: SharedValue<number>; i: number; round?: boolean }) {
  const s = useAnimatedStyle(() => {
    const on = t.value > i * 0.12 && t.value < 0.9;
    return { backgroundColor: on ? '#96DBE9' : 'rgba(255,255,255,0.08)', borderColor: on ? '#96DBE9' : 'rgba(255,255,255,0.28)' };
  });
  return <Animated.View style={[{ width: round ? 34 : 46, height: 34, borderRadius: round ? 17 : 8, borderWidth: 1.5 }, s]} />;
}

function Dot({ t, i }: { t: SharedValue<number>; i: number }) {
  const s = useAnimatedStyle(() => ({ transform: [{ translateY: -Math.max(0, Math.sin((t.value * 6 - i * 0.25) * Math.PI)) * 4 }] }));
  return <Animated.View style={[{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#0A0A0A' }, s]} />;
}

function ResOlioArt({ t }: { t: SharedValue<number> }) {
  const moon = useAnimatedStyle(() => ({ transform: [{ scale: 1 + Math.sin(t.value * Math.PI * 2) * 0.08 }] }));
  return (
    <View style={{ width: 260, height: 130 }}>
      <View style={{ position: 'absolute', left: 6, top: 10, gap: 10 }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Table t={t} i={0} />
          <Table t={t} i={3} round />
          <Table t={t} i={1} />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Table t={t} i={4} round />
          <Table t={t} i={2} />
          <Table t={t} i={5} round />
        </View>
        <Txt style={{ fontFamily: fonts.semibold, fontSize: 10, letterSpacing: 1.2, color: 'rgba(255,255,255,0.55)' }}>19:30 · 2 · 4 · 6</Txt>
      </View>
      {/* Olio, the AI host */}
      <Animated.View style={[{ position: 'absolute', right: 26, top: 4, width: 30, height: 30, borderRadius: 15, backgroundColor: '#96DBE9' }, moon]} />
      <View style={{ position: 'absolute', right: 0, top: 46, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 14, borderTopRightRadius: 4, backgroundColor: '#fff', gap: 6 }}>
        <Txt style={{ fontFamily: fonts.semibold, fontSize: 10, color: '#117689' }}>Olio</Txt>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <Dot t={t} i={0} />
          <Dot t={t} i={1} />
          <Dot t={t} i={2} />
        </View>
      </View>
    </View>
  );
}

/* ───────────── InstantWebsite: a website building itself ───────────── */

function Bar({ t, i, w, h = 7, color = '#D9E1EE' }: { t: SharedValue<number>; i: number; w: number; h?: number; color?: string }) {
  const s = useAnimatedStyle(() => {
    const p = Math.max(0, Math.min(1, (t.value - 0.08 - i * 0.09) / 0.12));
    const out = t.value > 0.9 ? 1 - (t.value - 0.9) / 0.1 : 1;
    return { width: w * p, opacity: out };
  });
  return <Animated.View style={[{ height: h, borderRadius: h / 2, backgroundColor: color }, s]} />;
}

function InstantArt({ t }: { t: SharedValue<number> }) {
  const bolt = useAnimatedStyle(() => ({ opacity: interpolate(t.value % 0.25, [0, 0.05, 0.25], [1, 0.4, 1]), transform: [{ scale: interpolate(t.value % 0.25, [0, 0.05, 0.25], [1.12, 1, 1]) }] }));
  return (
    <View style={{ width: 260, height: 130, alignItems: 'center' }}>
      <View style={{ width: 200, height: 120, borderRadius: 12, backgroundColor: '#fff', overflow: 'hidden', marginTop: 6 }}>
        <View style={{ height: 18, backgroundColor: '#F5F7FB', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8 }}>
          {['#EA4335', '#FBBC05', '#34A853'].map((c) => <View key={c} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c }} />)}
          <View style={{ flex: 1, height: 8, marginLeft: 6, borderRadius: 4, backgroundColor: '#E4E9F2' }} />
        </View>
        <View style={{ padding: 10, gap: 7 }}>
          <Bar t={t} i={0} w={110} h={10} color="#0F1B33" />
          <Bar t={t} i={1} w={150} />
          <Bar t={t} i={2} w={130} />
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 2 }}>
            <Bar t={t} i={3} w={56} h={18} color="#F5A623" />
            <Bar t={t} i={4} w={44} h={18} color="#D9E1EE" />
          </View>
        </View>
      </View>
      <Animated.View style={[{ position: 'absolute', right: 8, top: 0, width: 34, height: 34, borderRadius: 17, backgroundColor: '#F5A623', alignItems: 'center', justifyContent: 'center' }, bolt]}>
        <Feather name="zap" size={18} color="#fff" />
      </Animated.View>
    </View>
  );
}

export const PRODUCTS: Product[] = [
  {
    name: 'LaBreak',
    url: 'https://labreak.app',
    host: 'labreak.app',
    logo: require('@/assets/images/products/labreak.png'),
    theme: { bg: ['#F5F1E8', '#EDE6D6'], ink: '#2D4A3E', muted: '#596962', accent: '#C9942F', stage: '#E8F0EC' },
    Art: LaBreakArt,
    fr: {
      tag: 'Déjeuner · ticket-resto',
      text: 'Trouvez où déjeuner en 30 secondes : bistros, comptoirs et traiteurs du quartier, filtrés par envie, budget, distance et carte ticket-resto, avec une recherche IA en langage naturel et des menus à jour.',
      anchor: 'Trouver un restaurant pour le déjeuner avec LaBreak',
    },
    en: {
      tag: 'Lunch · meal vouchers',
      text: 'Find where to have lunch in 30 seconds: local bistros, counters and caterers filtered by craving, budget, distance and meal-voucher card, with natural-language AI search and up-to-date menus.',
      anchor: 'Find a lunch spot with LaBreak',
    },
  },
  {
    name: 'ResOlio',
    url: 'https://resolio.app',
    host: 'resolio.app',
    logo: require('@/assets/images/products/resolio.png'),
    theme: { bg: ['#0A0C0C', '#161A1A'], ink: '#FFFFFF', muted: 'rgba(255,255,255,0.72)', accent: '#96DBE9', stage: 'rgba(150,219,233,0.08)' },
    Art: ResOlioArt,
    fr: {
      tag: 'Réservation de restaurant',
      text: 'Le système de réservation pour restaurants, cafés, bars et pubs : votre page de réservation, un module pour votre site et Olio, l’hôte IA. Gratuit pour commencer, sans commission.',
      anchor: 'Logiciel de réservation pour restaurants sans commission',
    },
    en: {
      tag: 'Restaurant booking',
      text: 'The reservation system for restaurants, cafés, bars and pubs: your own booking page, a website embed and Olio, the AI host. Free to start, no commission.',
      anchor: 'Commission-free restaurant reservation system',
    },
  },
  {
    name: 'InstantWebsite.com',
    url: 'https://instantwebsite.com',
    host: 'instantwebsite.com',
    logo: require('@/assets/images/products/instantwebsite.png'),
    theme: { bg: ['#2C5EDB', '#1840AC'], ink: '#FFFFFF', muted: 'rgba(255,255,255,0.82)', accent: '#F5A623', stage: 'rgba(255,255,255,0.1)' },
    Art: InstantArt,
    fr: {
      tag: 'Site web en quelques minutes',
      text: 'Décrivez votre activité et InstantWebsite.com crée un vrai site web sous vos yeux : vous le modifiez en discutant, le publiez sur votre propre nom de domaine et recevez vos demandes de clients sur votre téléphone.',
      anchor: 'Créer le site web de son entreprise en quelques minutes',
    },
    en: {
      tag: 'A website in minutes',
      text: 'Describe your business and InstantWebsite.com builds a real website while you watch: edit it by chatting, publish it on your own domain and answer every lead from your phone.',
      anchor: 'Build your business website in minutes',
    },
  },
];

/** A real link (an <a> on the web, followed by search engines) that opens in a new tab. */
export function ExtLink({ href, label, children, style }: { href: string; label: string; children: ReactNode; style?: object }) {
  if (Platform.OS === 'web') {
    return (
      <a href={href} target="_blank" rel="noopener" title={label} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', ...style }}>
        {children}
      </a>
    );
  }
  return (
    <Pressable onPress={() => openExternal(href)} accessibilityRole="link" accessibilityLabel={label}>
      {children}
    </Pressable>
  );
}

export function ProductCard({ product: p, index }: { product: Product; index: number }) {
  const { lang } = useI18n();
  const c = lang === 'fr' ? p.fr : p.en;
  const [hovered, setHovered] = useState(false);
  const [box, onScreen] = useOnScreen();
  const t = useLoop(4200 + index * 600, onScreen);
  const th = p.theme;
  const web = Platform.OS === 'web';
  return (
    <ExtLink href={p.url} label={c.anchor} style={{ flex: 1 }}>
      <Pressable
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={{ flex: 1, borderRadius: radius.hero, overflow: 'hidden', transform: [{ translateY: hovered ? -6 : 0 }], ...(web ? ({ transitionProperty: 'transform, box-shadow', transitionDuration: '300ms', boxShadow: hovered ? '0 24px 48px rgba(0,0,0,0.35)' : '0 10px 28px rgba(0,0,0,0.22)' } as object) : {}) }}>
        <LinearGradient colors={th.bg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
          {/* the illustration, animated while on screen */}
          <View ref={box} style={{ height: 160, alignItems: 'center', justifyContent: 'center', backgroundColor: th.stage, overflow: 'hidden' }}>
            <p.Art t={t} />
          </View>
          <View style={{ padding: 22, gap: 12, flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Image source={p.logo} style={{ width: 48, height: 48, borderRadius: 13 }} contentFit="cover" accessibilityLabel={`${p.name} logo`} />
              <View style={{ flex: 1 }}>
                <Txt style={{ fontFamily: BOLD, fontSize: 22, lineHeight: 26, letterSpacing: -0.4, color: th.ink }}>{p.name}</Txt>
                <Txt style={{ fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 1.1, textTransform: 'uppercase', color: th.accent, marginTop: 2 }}>{c.tag}</Txt>
              </View>
            </View>
            <Txt style={{ fontFamily: fonts.regular, fontSize: 15, lineHeight: 23, color: th.muted }}>{c.text}</Txt>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 'auto' as never, paddingTop: 8 }}>
              <Txt style={{ fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20, color: th.ink, flexShrink: 1, textDecorationLine: hovered ? 'underline' : 'none' }}>{c.anchor}</Txt>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: th.accent, alignItems: 'center', justifyContent: 'center', transform: [{ translateX: hovered ? 3 : 0 }] }}>
                <Feather name="arrow-up-right" size={15} color={th.ink === '#FFFFFF' && th.accent !== '#96DBE9' ? '#fff' : '#0A0A0A'} />
              </View>
            </View>
            <Txt style={{ fontFamily: fonts.medium, fontSize: 12, color: th.muted, opacity: 0.8 }}>{p.host}</Txt>
          </View>
        </LinearGradient>
      </Pressable>
    </ExtLink>
  );
}
