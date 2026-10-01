import { Image, type ImageSource } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  FadeInDown,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MaskedText } from '@/components/fx/MaskedText';
import { Txt } from '@/components/ui/Txt';
import { useLayout } from '@/theme/layout';
import { fonts, radius } from '@/theme/tokens';
import { BigCta } from './BigCta';
import { Container, HEADER_H } from './SiteFrame';

export type PillarSlide = {
  key: string;
  label: string;
  title: string;
  accent: string;
  text: string;
  cta: string;
  onPress: () => void;
  bg: string;
  fg: string;
  muted: string;
  accentColor: string;
  ctaBg: string;
  ctaFg: string;
  shadow: string;
  images: [string | ImageSource | number, string | ImageSource | number];
};

const DURATION = 6500;
const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Hero after the delassus.com product slides: one full-bleed colour per pillar of the association,
 * the background morphing from one colour to the next, a large white headline sliding in word by
 * word, floating photos, the chunky rounded CTA, and tabs whose line fills while a slide plays.
 * Swipe (touch) or drag (mouse) left/right to change slide.
 */
export function PillarSlider({ slides }: { slides: PillarSlide[] }) {
  const { isDesktop, isMobile } = useLayout();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);
  const [prev, setPrev] = useState(slides[0].bg);
  const [paused, setPaused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const mix = useSharedValue(1);
  const bar = useSharedValue(0);
  const dragX = useSharedValue(0);
  const touch = useRef({ x: 0, y: 0 });
  const s = slides[i];

  const go = (n: number) => {
    const next = (n + slides.length) % slides.length;
    if (next === i) return;
    setPrev(s.bg);
    setI(next);
    mix.value = 0;
    mix.value = withTiming(1, { duration: 900, easing: Easing.bezier(0.65, 0, 0.35, 1) });
  };

  // Swipe / drag: only a clearly horizontal gesture is taken, so vertical page scrolling still works.
  type Gesture = { nativeEvent: { pageX: number; pageY: number } };
  const swipe = {
    onStartShouldSetResponderCapture: (e: Gesture) => {
      touch.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
      return false;
    },
    onMoveShouldSetResponder: (e: Gesture) => {
      const dx = e.nativeEvent.pageX - touch.current.x;
      const dy = e.nativeEvent.pageY - touch.current.y;
      return Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.3;
    },
    onResponderGrant: () => setDragging(true),
    onResponderMove: (e: Gesture) => {
      dragX.value = e.nativeEvent.pageX - touch.current.x;
    },
    onResponderRelease: (e: Gesture) => {
      const dx = e.nativeEvent.pageX - touch.current.x;
      setDragging(false);
      dragX.value = withSpring(0, { damping: 18, stiffness: 180 });
      if (dx < -60) go(i + 1);
      else if (dx > 60) go(i - 1);
    },
    onResponderTerminationRequest: () => false,
    onResponderTerminate: () => {
      setDragging(false);
      dragX.value = withSpring(0);
    },
  };

  // Autoplay: the active tab's line fills, then the next slide comes in.
  useEffect(() => {
    if (reduced || paused || dragging) {
      cancelAnimation(bar);
      return;
    }
    bar.value = 0;
    bar.value = withTiming(1, { duration: DURATION, easing: Easing.linear });
    const t = setTimeout(() => go(i + 1), DURATION);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restart only when the slide or pause state changes
  }, [i, paused, reduced, dragging]);

  const bgStyle = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(mix.value, [0, 1], [prev, s.bg]) }));
  const fill = useAnimatedStyle(() => ({ width: `${bar.value * 100}%` }));
  // The slide follows the finger with some resistance and fades slightly as it goes.
  const follow = useAnimatedStyle(() => ({ transform: [{ translateX: dragX.value * 0.4 }], opacity: 1 - Math.min(0.35, Math.abs(dragX.value) / 900) }));
  const titleSize = isDesktop ? 84 : isMobile ? 46 : 64;
  const marked = `${s.title}\n${s.accent.split(/\s+/).map((w) => `*${w}*`).join(' ')}`;

  return (
    <View onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)}>
      <Animated.View
        {...swipe}
        style={[{ minHeight: isDesktop ? 760 : isMobile ? 760 : 700, paddingTop: HEADER_H + insets.top, overflow: 'hidden' }, Platform.OS === 'web' && ({ cursor: dragging ? 'grabbing' : 'grab', userSelect: 'none' } as object), bgStyle]}>
        <Animated.View pointerEvents="box-none" style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, follow]}>
          {isDesktop && <FloatingPhotos key={`p${i}`} images={s.images} desktop />}
        </Animated.View>

        <Animated.View style={[{ flex: 1 }, follow]}>
        <Container style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: isDesktop ? 40 : 28, paddingBottom: 28, gap: isMobile ? 18 : 24 }}>
          <Animated.View key={`l${i}`} entering={FadeIn.duration(400)}>
            <Txt style={{ fontFamily: fonts.semibold, fontSize: 12, letterSpacing: 2.4, textTransform: 'uppercase', color: s.muted, textAlign: 'center' }}>
              {pad(i + 1)} / {pad(slides.length)} · {s.label}
            </Txt>
          </Animated.View>
          <View style={{ maxWidth: isDesktop ? 820 : 640, width: '100%' }}>
            <MaskedText
              key={`t${i}`}
              text={marked}
              align="center"
              style={{ fontFamily: fonts.serif, fontSize: titleSize, lineHeight: titleSize * 1.02, letterSpacing: -0.8, color: s.fg }}
              emphasisStyle={{ fontFamily: fonts.serifItalic, color: s.accentColor }}
            />
          </View>
          <Animated.View key={`d${i}`} entering={FadeInDown.delay(320).duration(500)}>
            <Txt style={{ fontFamily: fonts.regular, fontSize: isMobile ? 15 : 18, lineHeight: isMobile ? 23 : 28, color: s.muted, textAlign: 'center', maxWidth: 560 }}>{s.text}</Txt>
          </Animated.View>
          <Animated.View key={`c${i}`} entering={FadeInDown.delay(480).duration(500)} style={{ marginTop: 6 }}>
            <BigCta label={s.cta} onPress={s.onPress} bg={s.ctaBg} fg={s.ctaFg} shadow={s.shadow} />
          </Animated.View>
          {!isDesktop && <FloatingPhotos key={`m${i}`} images={s.images} />}
        </Container>
        </Animated.View>

        <Container style={{ flexDirection: 'row', gap: isMobile ? 10 : 24, paddingBottom: isMobile ? 22 : 34 }}>
          {slides.map((x, n) => (
            <Pressable key={x.key} onPress={() => go(n)} role="tab" aria-selected={n === i} aria-label={x.label} style={{ flex: 1, gap: 10, paddingTop: 8 }}>
              <View style={{ height: 2, backgroundColor: `${s.fg === '#FFFFFF' ? '#FFFFFF' : s.fg}33`, overflow: 'hidden' }}>
                {n < i && <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: s.fg }} />}
                {n === i && <Animated.View style={[{ position: 'absolute', top: 0, bottom: 0, left: 0, backgroundColor: s.fg }, fill]} />}
              </View>
              <Txt numberOfLines={1} style={{ fontFamily: n === i ? fonts.semibold : fonts.medium, fontSize: isMobile ? 11 : 13, color: n === i ? s.fg : s.muted }}>
                {isMobile ? pad(n + 1) : `${pad(n + 1)}  ${x.label}`}
              </Txt>
            </Pressable>
          ))}
        </Container>
      </Animated.View>
    </View>
  );
}

/** Two photos that pop in with a tilt and keep bobbing — the floating objects of the Delassus slides. */
function FloatingPhotos({ images, desktop }: { images: PillarSlide['images']; desktop?: boolean }) {
  const reduced = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    t.value = withRepeat(withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(t);
  }, [reduced, t]);
  const bobA = useAnimatedStyle(() => ({ transform: [{ translateY: (t.value - 0.5) * 18 }, { rotate: '-7deg' }] }));
  const bobB = useAnimatedStyle(() => ({ transform: [{ translateY: (0.5 - t.value) * 22 }, { rotate: '6deg' }] }));
  const frame = { borderRadius: radius.hero, overflow: 'hidden' as const, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 30, shadowOffset: { width: 0, height: 20 }, elevation: 8, backgroundColor: 'rgba(0,0,0,0.15)' };
  const src = (x: PillarSlide['images'][number]) => (typeof x === 'string' ? { uri: x } : x);

  if (desktop) {
    return (
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <Animated.View entering={ZoomIn.delay(120).duration(700).easing(Easing.bezier(0.22, 1, 0.36, 1))} style={{ position: 'absolute', left: '3%', top: '24%', width: '19%', aspectRatio: 4 / 5 }}>
          <Animated.View style={[{ width: '100%', height: '100%' }, frame, bobA]}>
            <Image source={src(images[0])} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          </Animated.View>
        </Animated.View>
        <Animated.View entering={ZoomIn.delay(260).duration(700).easing(Easing.bezier(0.22, 1, 0.36, 1))} style={{ position: 'absolute', right: '3%', top: '40%', width: '21%', aspectRatio: 4 / 5 }}>
          <Animated.View style={[{ width: '100%', height: '100%' }, frame, bobB]}>
            <Image source={src(images[1])} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          </Animated.View>
        </Animated.View>
      </View>
    );
  }
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 14, marginTop: 20, width: '100%' }}>
      {images.map((img, n) => (
        <Animated.View key={n} entering={ZoomIn.delay(200 + n * 140).duration(600)} style={{ width: '40%', maxWidth: 190, aspectRatio: 4 / 5 }}>
          <Animated.View style={[{ width: '100%', height: '100%' }, frame, n ? bobB : bobA]}>
            <Image source={src(img)} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          </Animated.View>
        </Animated.View>
      ))}
    </View>
  );
}
