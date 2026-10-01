import { Feather } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Platform, Pressable, View, useWindowDimensions } from 'react-native';
import Animated, { cancelAnimation, Easing, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Ellipse, Path } from 'react-native-svg';

import { useCreditsConfig, type CreditsConfig } from '@/data/credits';
import { usePublicOverview } from '@/data/public';
import { fullName, useApprovedMembers, useStore } from '@/data/store';
import { useI18n } from '@/i18n';
import { CREATOR, eggs, idleFor, listenForShake, markActive, takeCreditsPreview } from '@/lib/eggs';
import { useTheme } from '@/theme/ThemeProvider';
import { brand, fonts } from '@/theme/tokens';
import { Avatar, Badge, Tap } from './ui/primitives';
import { Txt } from './ui/Txt';

const IDLE_MS = 5 * 60_000;

/** Root layer: credits, sandstorm, idle camel, baccalaureate banner, shake detection. */
export function EasterEggs() {
  useEffect(() => listenForShake(), []);
  // Any key, mouse or scroll counts as activity (touches are caught by the root view).
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const evs = ['mousemove', 'keydown', 'wheel', 'touchstart', 'scroll'] as const;
    evs.forEach((e) => window.addEventListener(e, markActive, { passive: true }));
    return () => evs.forEach((e) => window.removeEventListener(e, markActive));
  }, []);
  return (
    <>
      <BacBanner />
      <Camel />
      <SandstormLayer />
      <Credits />
    </>
  );
}

// ——— Baccalaureate day ———

/** On a calendar date whose title mentions the bac (added by an admin), a word for the Terminales. */
function BacBanner() {
  const { d } = useI18n();
  const { db } = useStore();
  const insets = useSafeAreaInsets();
  const [closed, setClosed] = useState(false);
  const today = new Date();
  const isBacDay = db.keyDates.some(
    (k) => /\bbac(calaur[ée]at)?\b/i.test(k.title) && k.month === today.getMonth() + 1 && k.day === today.getDate() && (!k.year || k.year === today.getFullYear()),
  );
  if (!isBacDay || closed) return null;
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', top: insets.top + 10, left: 0, right: 0, alignItems: 'center', zIndex: 1000 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 18, paddingRight: 6, paddingVertical: 6, borderRadius: 999, backgroundColor: brand.red, maxWidth: '92%', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, elevation: 6 }}>
        <Txt style={{ color: '#fff', fontFamily: fonts.semibold, flexShrink: 1 }}>{d.eggs.bac}</Txt>
        <Tap onPress={() => setClosed(true)} accessibilityLabel={d.common.close} style={{ width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.2)' }}>
          <Feather name="x" size={15} color="#fff" />
        </Tap>
      </View>
    </View>
  );
}

// ——— Idle camel ———

function Camel() {
  const { width, height } = useWindowDimensions();
  const [walking, setWalking] = useState(false);
  const x = useSharedValue(-90);
  const bob = useSharedValue(0);

  useEffect(() => {
    const id = setInterval(() => {
      if (!walking && idleFor() > IDLE_MS) setWalking(true);
    }, 10_000);
    return () => clearInterval(id);
  }, [walking]);

  useEffect(() => {
    if (!walking) return;
    const done = () => {
      markActive();
      setWalking(false);
    };
    x.value = -90;
    x.value = withTiming(width + 90, { duration: 14_000, easing: Easing.linear }, (fin) => fin && runOnJS(done)());
    bob.value = withRepeat(withSequence(withTiming(-5, { duration: 350 }), withTiming(0, { duration: 350 })), -1);
    return () => {
      cancelAnimation(x);
      cancelAnimation(bob);
    };
  }, [walking, width, x, bob]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }, { translateY: bob.value }, { scaleX: -1 }] }));
  if (!walking) return null;
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: height * 0.72, zIndex: 1001 }, style]}>
      <Txt style={{ fontSize: 56, lineHeight: 64 }}>🐪</Txt>
    </Animated.View>
  );
}

// ——— Sandstorm ———

const GRAINS = Array.from({ length: 70 }, (_, i) => ({ top: (i * 37) % 100, delay: (i * 53) % 900, size: 2 + (i % 4), speed: 700 + ((i * 97) % 900) }));

/** « chameau », « 50°C », « shamal » in a search box: a few seconds of sandstorm. */
export function SandstormLayer() {
  const [on, setOn] = useState(0);
  useEffect(() => eggs.on('sandstorm', () => setOn((n) => n + 1)), []);
  useEffect(() => {
    if (!on) return;
    const id = setTimeout(() => setOn(0), 4200);
    return () => clearTimeout(id);
  }, [on]);
  if (!on) return null;
  return <Storm key={on} />;
}

function Storm() {
  const { width } = useWindowDimensions();
  const haze = useSharedValue(0);
  useEffect(() => {
    haze.value = withSequence(withTiming(0.55, { duration: 600 }), withDelay(2600, withTiming(0, { duration: 900 })));
  }, [haze]);
  const hazeStyle = useAnimatedStyle(() => ({ opacity: haze.value }));
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1002, overflow: 'hidden' }}>
      <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#C9A35B' }, hazeStyle]} />
      {GRAINS.map((g, i) => (
        <Grain key={i} {...g} width={width} />
      ))}
    </View>
  );
}

function Grain({ top, delay, size, speed, width }: { top: number; delay: number; size: number; speed: number; width: number }) {
  const x = useSharedValue(width + 20);
  useEffect(() => {
    x.value = withDelay(delay, withRepeat(withTiming(-40, { duration: speed, easing: Easing.linear }), 3, false));
    return () => cancelAnimation(x);
  }, [x, delay, speed]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }, { translateY: Math.sin(x.value / 60) * 8 }] }));
  return <Animated.View style={[{ position: 'absolute', left: 0, top: `${top}%`, width: size * 3, height: size, borderRadius: size, backgroundColor: '#8A6A2E', opacity: 0.8 }, style]} />;
}

// ——— End credits ———

function Credits() {
  const { d, f } = useI18n();
  const { height } = useWindowDimensions();
  const { bureau } = usePublicOverview();
  const members = useApprovedMembers();
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<CreditsConfig | null>(null);
  const { config: saved } = useCreditsConfig(open);
  const config = preview ?? saved;
  const [contentH, setContentH] = useState(0);
  const y = useSharedValue(height);
  useEffect(
    () =>
      eggs.on('credits', () => {
        setPreview(takeCreditsPreview<CreditsConfig>());
        setOpen(true);
      }),
    [],
  );

  useEffect(() => {
    if (!open || !contentH) return;
    y.value = height;
    y.value = withTiming(-contentH, { duration: Math.max(18_000, (contentH + height) * 22), easing: Easing.linear }, (fin) => fin && runOnJS(setOpen)(false));
    return () => cancelAnimation(y);
  }, [open, contentH, height, y]);
  const roll = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));

  const line = (a: string, b?: string, key?: string) => (
    <View key={key ?? a} style={{ alignItems: 'center', marginBottom: 14 }}>
      <Txt style={{ color: '#fff', fontFamily: fonts.serif, fontSize: 26, lineHeight: 30, textAlign: 'center' }}>{a}</Txt>
      {!!b && <Txt style={{ color: '#9AA4BA', fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase', textAlign: 'center' }}>{b}</Txt>}
    </View>
  );
  const heading = (t: string, key?: string) => (
    <Txt key={key} style={{ color: '#FF5A5C', fontFamily: fonts.semibold, fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', marginTop: 40, marginBottom: 18, textAlign: 'center' }}>{t}</Txt>
  );

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <Pressable onPress={() => setOpen(false)} style={{ flex: 1, backgroundColor: '#000', overflow: 'hidden' }}>
        <Animated.View style={[{ position: 'absolute', left: 0, right: 0, top: 0, alignItems: 'center', paddingHorizontal: 24 }, roll]} onLayout={(e) => setContentH(e.nativeEvent.layout.height)}>
          <Txt style={{ color: '#9AA4BA', fontSize: 13, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12, textAlign: 'center' }}>{config.title || d.eggs.creditsTitle}</Txt>
          <Txt style={{ color: '#fff', fontFamily: fonts.serif, fontSize: 56, lineHeight: 60, textAlign: 'center' }}>{d.app.name}</Txt>
          {config.showBureau && bureau.length > 0 && heading(d.eggs.creditsBureau)}
          {config.showBureau && bureau.map((p) => line(p.name, p.fonction || (p.role === 'admin' ? d.site.bureau.member : d.roles.honneur), `b-${p.name}`))}
          {config.sections.map((s) => (
            <View key={s.id} style={{ alignItems: 'center' }}>
              {!!s.heading && heading(s.heading)}
              {s.lines.filter((l) => l.name.trim()).map((l) => line(l.name, l.role, l.id))}
            </View>
          ))}
          {config.showMembers && heading(d.eggs.creditsStarring)}
          {config.showMembers && line(f(d.eggs.creditsMembers, { n: Math.max(members.length, 1) }))}
          <View style={{ height: 60 }} />
          <Txt style={{ color: '#fff', fontFamily: fonts.serifItalic, fontSize: 24, textAlign: 'center' }}>{config.thanks || d.eggs.creditsThanks}</Txt>
          <Txt style={{ color: '#9AA4BA', fontSize: 13, marginTop: 30, textAlign: 'center' }}>{config.closing || d.eggs.creditsCamel}</Txt>
          <View style={{ height: 80 }} />
        </Animated.View>
        <Txt style={{ position: 'absolute', bottom: 16, alignSelf: 'center', color: '#5A6378', fontSize: 11 }}>{d.eggs.creditsClose}</Txt>
      </Pressable>
    </Modal>
  );
}

// ——— Birthday ———

const BALLOON_COLORS = ['#AE0000', '#6680AE', '#E8B820', '#2E9E6A', '#C2185B', '#00206A', '#FF8A3D'];

/** Balloons floating up over a profile on its owner's birthday. */
export function Balloons() {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 560, overflow: 'hidden', zIndex: 5 }}>
      {BALLOON_COLORS.map((c, i) => (
        <Balloon key={c} color={c} left={`${6 + i * 13}%`} delay={i * 700} duration={7000 + (i % 3) * 1500} />
      ))}
    </View>
  );
}

function Balloon({ color, left, delay, duration }: { color: string; left: string; delay: number; duration: number }) {
  const y = useSharedValue(600);
  const sway = useSharedValue(0);
  useEffect(() => {
    y.value = withDelay(delay, withRepeat(withTiming(-140, { duration, easing: Easing.linear }), -1, false));
    sway.value = withRepeat(withSequence(withTiming(10, { duration: 1300 }), withTiming(-10, { duration: 1300 })), -1, true);
    return () => {
      cancelAnimation(y);
      cancelAnimation(sway);
    };
  }, [y, sway, delay, duration]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }, { translateX: sway.value }] }));
  return (
    <Animated.View style={[{ position: 'absolute', left: left as `${number}%`, top: 0 }, style]}>
      <Svg width={42} height={90} viewBox="0 0 42 90">
        <Ellipse cx={21} cy={24} rx={19} ry={23} fill={color} />
        <Ellipse cx={14} cy={15} rx={5} ry={7} fill="#fff" opacity={0.35} />
        <Path d="M18 46 L24 46 L21 51 Z" fill={color} />
        <Path d="M21 51 Q15 62 22 72 Q28 82 20 90" stroke="#888" strokeWidth={1} fill="none" />
      </Svg>
    </Animated.View>
  );
}

/** A member's name, sparkling in gold on their birthday (directory). */
export function SparkleName({ name }: { name: string }) {
  const glow = useSharedValue(1);
  useEffect(() => {
    glow.value = withRepeat(withSequence(withTiming(0.45, { duration: 700 }), withTiming(1, { duration: 700 })), -1);
    return () => cancelAnimation(glow);
  }, [glow]);
  const style = useAnimatedStyle(() => ({ opacity: glow.value }));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: '100%' }}>
      <Animated.Text style={[{ fontSize: 14 }, style]}>✨</Animated.Text>
      <Txt variant="h3" numberOfLines={1} style={{ color: '#C8961E', flexShrink: 1, textShadowColor: 'rgba(232,184,32,0.7)', textShadowRadius: 8 }}>{name}</Txt>
      <Animated.Text style={[{ fontSize: 14 }, style]}>✨</Animated.Text>
    </View>
  );
}

// ——— Searching for the creator ———

/** « Jad » in a search box: the legendary developer card. */
export function CreatorCard({ onOpen }: { onOpen: (href: string) => void }) {
  const { d } = useI18n();
  const { colors } = useTheme();
  const members = useApprovedMembers();
  const jad = useMemo(() => members.find((u) => fullName(u).toLowerCase() === CREATOR.toLowerCase()), [members]);
  const shine = useSharedValue(0);
  useEffect(() => {
    shine.value = withRepeat(withTiming(1, { duration: 1600 }), -1, true);
    return () => cancelAnimation(shine);
  }, [shine]);
  const ring = useAnimatedStyle(() => ({ borderColor: `rgba(232,184,32,${0.4 + shine.value * 0.6})` }));
  return (
    <Tap onPress={() => jad && onOpen(`/membre/${jad.id}`)} disabled={!jad}>
      <Animated.View style={[{ margin: 6, padding: 16, borderRadius: 18, borderWidth: 2, backgroundColor: colors.navy, flexDirection: 'row', alignItems: 'center', gap: 14 }, ring]}>
        <View>
          <Avatar uri={jad?.avatar} name={CREATOR} size={56} />
          <View style={{ position: 'absolute', right: -6, bottom: -6, width: 26, height: 26, borderRadius: 13, backgroundColor: '#E8B820', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.navy }}>
            <Txt style={{ fontSize: 13 }}>🏆</Txt>
          </View>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Txt style={{ color: '#E8B820', fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}>{d.eggs.legendTitle}</Txt>
          <Txt style={{ color: '#fff', fontFamily: fonts.serif, fontSize: 24, lineHeight: 28 }}>{CREATOR}</Txt>
          <Txt style={{ color: '#C8D3E5', fontSize: 13 }}>{d.eggs.legendText}</Txt>
          <View style={{ flexDirection: 'row', marginTop: 2 }}>
            <Badge label={d.eggs.legendBadge} tone="warning" icon="award" />
          </View>
        </View>
      </Animated.View>
    </Tap>
  );
}

/** Opens the credits (used by the © in the footer). */
export const rollCredits = () => eggs.emit('credits');
