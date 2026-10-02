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
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MaskedText } from '@/components/fx/MaskedText';
import { useOnScreen } from '@/components/fx/useOnScreen';
import { Txt } from '@/components/ui/Txt';
import { useLayout } from '@/theme/layout';
import { fonts, radius } from '@/theme/tokens';
import { BigCta } from './BigCta';
import { InstagramLink } from './Instagram';
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
const SWIPE = 50;
const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Hero after the delassus.com product slides: one full-bleed colour per pillar of the association,
 * the background morphing from one colour to the next, a large white headline sliding in word by
 * word, floating photos, the chunky rounded CTA, and tabs whose line fills while a slide plays.
 * Plays on its own (paused only while a finger/mouse holds it or while it is off screen);
 * swipe (touch) or drag (mouse) left/right to change slide.
 */
export function PillarSlider({ slides }: { slides: PillarSlide[] }) {
  const { isDesktop, isMobile } = useLayout();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const [box, onScreen] = useOnScreen();
  const [i, setI] = useState(0);
  // Bumped when a drag ends without changing slide, to restart the autoplay timer.
  const [round, setRound] = useState(0);
  const from = useSharedValue(slides[0].bg);
  const to = useSharedValue(slides[0].bg);
  const mix = useSharedValue(1);
  const bar = useSharedValue(0);
  const dragX = useSharedValue(0);
  const bob = useSharedValue(0);
  const touch = useRef({ x: 0, y: 0, at: 0 });
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const s = slides[i];

  const go = (n: number) => {
    const next = (n + slides.length) % slides.length;
    if (next === i) return;
    // Morph from the colour on screen right now, so swiping again mid-transition never flashes.
    from.value = interpolateColor(mix.value, [0, 1], [from.value, to.value]) as string;
    to.value = slides[next].bg;
    mix.value = 0;
    mix.value = withTiming(1, { duration: 900, easing: Easing.bezier(0.65, 0, 0.35, 1) });
    setI(next);
  };

  const hold = () => {
    clearTimeout(timer.current);
    cancelAnimation(bar);
  };

  // Swipe / drag: only a clearly horizontal gesture is taken, so vertical page scrolling still works.
  // A long drag or a quick flick both count.
  type Gesture = { nativeEvent: { pageX: number; pageY: number } };
  const release = (dx: number) => {
    dragX.value = withSpring(0, { damping: 20, stiffness: 220 });
    const flick = Date.now() - touch.current.at < 260 && Math.abs(dx) > 24;
    if (dx < -SWIPE || (flick && dx < 0)) go(i + 1);
    else if (dx > SWIPE || (flick && dx > 0)) go(i - 1);
    else setRound((r) => r + 1);
  };
  const swipe = {
    onStartShouldSetResponderCapture: (e: Gesture) => {
      touch.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY, at: Date.now() };
      return false;
    },
    onMoveShouldSetResponder: (e: Gesture) => {
      const dx = e.nativeEvent.pageX - touch.current.x;
      const dy = e.nativeEvent.pageY - touch.current.y;
      return Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.3;
    },
    onResponderGrant: hold,
    onResponderMove: (e: Gesture) => {
      dragX.value = e.nativeEvent.pageX - touch.current.x;
    },
    onResponderRelease: (e: Gesture) => release(e.nativeEvent.pageX - touch.current.x),
    onResponderTerminationRequest: () => false,
    onResponderTerminate: () => release(0),
  };

  // Autoplay: the active tab's line fills, then the next slide comes in.
  useEffect(() => {
    if (reduced || !onScreen) return;
    bar.value = 0;
    bar.value = withTiming(1, { duration: DURATION, easing: Easing.linear });
    timer.current = setTimeout(() => go(i + 1), DURATION);
    return () => {
      clearTimeout(timer.current);
      cancelAnimation(bar);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restart only when the slide, visibility or a drag changes
  }, [i, onScreen, reduced, round]);

  // One gentle bob shared by every floating photo.
  useEffect(() => {
    if (reduced || !onScreen) return;
    bob.value = withRepeat(withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(bob);
  }, [reduced, onScreen, bob]);

  const bgStyle = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(mix.value, [0, 1], [from.value, to.value]) }));
  const fill = useAnimatedStyle(() => ({ transform: [{ scaleX: bar.value }] }));
  // The slide follows the finger with some resistance and fades slightly as it goes.
  const follow = useAnimatedStyle(() => ({ transform: [{ translateX: dragX.value * 0.4 }], opacity: 1 - Math.min(0.35, Math.abs(dragX.value) / 900) }));
  const titleSize = isDesktop ? 84 : isMobile ? 46 : 64;
  const marked = `${s.title}\n${s.accent.split(/\s+/).map((w) => `*${w}*`).join(' ')}`;
  const photos = <FloatingPhotos slides={slides} active={i} bob={bob} desktop={isDesktop} />;

  return (
    <View ref={box}>
      <Animated.View
        {...swipe}
        style={[{ minHeight: isDesktop ? 760 : isMobile ? 760 : 700, paddingTop: HEADER_H + insets.top, overflow: 'hidden' }, Platform.OS === 'web' && ({ cursor: 'grab', userSelect: 'none', touchAction: 'pan-y' } as object), bgStyle]}>
        {isDesktop && (
          <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, WILL_MOVE, follow]}>
            {photos}
          </Animated.View>
        )}

        <Animated.View style={[{ flex: 1 }, WILL_MOVE, follow]}>
          <Container style={{ flex: 1, alignItems: 'center', justifyContent: isMobile ? 'flex-start' : 'center', paddingTop: isDesktop ? 40 : isMobile ? 36 : 28, paddingBottom: 28, gap: isMobile ? 18 : 24 }}>
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
            <InstagramLink color={s.fg} muted={s.muted} />
            {/* Phones: content is anchored to the top, so the label and title stay put from slide to slide. */}
            {!isDesktop && photos}
          </Container>
        </Animated.View>

        <Container style={{ flexDirection: 'row', gap: isMobile ? 10 : 24, paddingBottom: isMobile ? 22 : 34 }}>
          {slides.map((x, n) => (
            <Pressable key={x.key} onPress={() => go(n)} role="tab" aria-selected={n === i} aria-label={x.label} style={{ flex: 1, gap: 10, paddingTop: 8 }}>
              <View style={{ height: 2, backgroundColor: `${s.fg}33`, overflow: 'hidden' }}>
                {n < i && <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: s.fg }} />}
                {n === i && <Animated.View style={[{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: s.fg, transformOrigin: 'left' }, WILL_MOVE, fill]} />}
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

const MOBILE_PHOTO = { width: '40%', maxWidth: 190, aspectRatio: 4 / 5 } as const;
const POP = { duration: 700, easing: Easing.bezier(0.22, 1, 0.36, 1) };
/** Web: moving layers get their own compositor layer, so a move or fade does not repaint the hero. */
const WILL_MOVE = (Platform.OS === 'web' ? { willChange: 'transform, opacity' } : {}) as object;
const FRAME = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  borderRadius: radius.hero,
  overflow: 'hidden',
  shadowColor: '#000',
  shadowOpacity: 0.3,
  shadowRadius: 30,
  shadowOffset: { width: 0, height: 20 },
  elevation: 8,
  backgroundColor: 'rgba(0,0,0,0.15)',
} as const;

/**
 * Two photo spots that keep bobbing — the floating objects of the Delassus slides. Each spot holds
 * the photo of every slide, stacked: changing slide only fades/pops photos that are already loaded
 * (no remount, no reload), and only the two spots move with the bob.
 */
function FloatingPhotos({ slides, active, bob, desktop }: { slides: PillarSlide[]; active: number; bob: SharedValue<number>; desktop?: boolean }) {
  const a = useAnimatedStyle(() => ({ transform: [{ translateY: (bob.value - 0.5) * 18 }, { rotate: '-7deg' }] }));
  const b = useAnimatedStyle(() => ({ transform: [{ translateY: (0.5 - bob.value) * 22 }, { rotate: '6deg' }] }));
  const spot = (k: 0 | 1, style: object) => (
    <Animated.View style={[style, WILL_MOVE, k ? b : a]}>
      {slides.map((x, n) => (
        <Photo key={x.key} source={x.images[k]} active={n === active} delay={k ? 140 : 0} />
      ))}
    </Animated.View>
  );

  if (desktop) {
    return (
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        {spot(0, { position: 'absolute', left: '3%', top: '24%', width: '19%', aspectRatio: 4 / 5 })}
        {spot(1, { position: 'absolute', right: '3%', top: '40%', width: '21%', aspectRatio: 4 / 5 })}
      </View>
    );
  }
  return (
    <View pointerEvents="none" style={{ flexDirection: 'row', justifyContent: 'center', gap: 14, marginTop: 20, width: '100%' }}>
      {spot(0, MOBILE_PHOTO)}
      {spot(1, MOBILE_PHOTO)}
    </View>
  );
}

function Photo({ source, active, delay }: { source: PillarSlide['images'][number]; active: boolean; delay: number }) {
  const shown = useSharedValue(0);
  useEffect(() => {
    shown.value = active ? withDelay(120 + delay, withTiming(1, POP)) : withTiming(0, { duration: 220 });
  }, [active, delay, shown]);
  const pop = useAnimatedStyle(() => ({ opacity: shown.value, transform: [{ scale: 0.7 + 0.3 * shown.value }] }));
  return (
    <Animated.View style={[FRAME, pop]}>
      <Image source={typeof source === 'string' ? { uri: source } : source} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={0} />
    </Animated.View>
  );
}
