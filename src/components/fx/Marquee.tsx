import { LinearGradient } from 'expo-linear-gradient';
import { Fragment, useEffect, useState, type ReactNode } from 'react';
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useFrameCallback, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { useOnScreen } from './useOnScreen';

/** Web: `clip` instead of `hidden`, so focusing a link inside can never scroll the strip sideways. */
const CLIP = (Platform.OS === 'web' ? { overflow: 'clip' } : {}) as object;

/**
 * Infinite horizontal scroll with faded edges — after Magic UI's Marquee and 21st.dev « Logo Cloud
 * Marquee » (olewandowski1): the set is repeated until it is wider than the strip (so even two
 * logos fill a wide screen without a gap), drawn twice and moved by exactly one copy, forever.
 * Hovering eases it to a stop and it eases back when the pointer leaves; it rests while off
 * screen or when the OS asks for reduced motion.
 */
export function Marquee({
  children,
  speed = 36,
  gap = 12,
  reverse,
  fade,
  pauseOnHover = true,
  style,
}: {
  children: ReactNode;
  /** Pixels per second. */
  speed?: number;
  gap?: number;
  reverse?: boolean;
  /** Background colour the edges fade into. */
  fade?: string;
  pauseOnHover?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const reduced = useReducedMotion();
  const [box, onScreen] = useOnScreen();
  const [strip, setStrip] = useState(0);
  const [single, setSingle] = useState(0);
  const repeat = strip && single ? Math.max(1, Math.ceil(strip / single)) : 1;
  const unit = single * repeat;
  const x = useSharedValue(0);
  const pace = useSharedValue(1);

  const frame = useFrameCallback((f) => {
    if (!unit) return;
    const dt = Math.min(0.05, (f.timeSincePreviousFrame ?? 16) / 1000);
    let next = x.get() - speed * dt * pace.get();
    if (next <= -unit) next += unit;
    x.set(next);
  }, false);
  useEffect(() => {
    frame.setActive(!!unit && onScreen && !reduced);
  }, [unit, onScreen, reduced, frame]);

  const moving = useAnimatedStyle(() => ({ transform: [{ translateX: reverse ? -unit - x.get() : x.get() }] }));
  const hover = (on: boolean) => {
    if (pauseOnHover) pace.set(withTiming(on ? 0 : 1, { duration: on ? 500 : 700, easing: Easing.out(Easing.quad) }));
  };

  const copy = (first: boolean) => (
    <View style={{ flexDirection: 'row' }} aria-hidden={!first}>
      {Array.from({ length: repeat }, (_, k) => (
        <View
          key={k}
          onLayout={first && k === 0 ? (e) => setSingle(e.nativeEvent.layout.width) : undefined}
          style={{ flexDirection: 'row', gap, paddingRight: gap }}
          aria-hidden={!first || k > 0}>
          <Fragment>{children}</Fragment>
        </View>
      ))}
    </View>
  );

  return (
    <View
      ref={box}
      onLayout={(e) => setStrip(e.nativeEvent.layout.width)}
      onPointerEnter={() => hover(true)}
      onPointerLeave={() => hover(false)}
      style={[{ overflow: 'hidden', width: '100%' }, CLIP, style]}>
      <Animated.View style={[{ flexDirection: 'row', alignSelf: 'flex-start' }, moving]}>
        {copy(true)}
        {copy(false)}
      </Animated.View>
      {fade && (
        <>
          <LinearGradient colors={[fade, `${fade}00`]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 72 }} />
          <LinearGradient colors={[`${fade}00`, fade]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} pointerEvents="none" style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 72 }} />
        </>
      )}
    </View>
  );
}
