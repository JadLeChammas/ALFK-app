import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

/** Infinite horizontal scroll with faded edges — after Magic UI's Marquee. */
export function Marquee({
  children,
  speed = 36,
  gap = 12,
  reverse,
  fade,
  style,
}: {
  children: ReactNode;
  /** Pixels per second. */
  speed?: number;
  gap?: number;
  reverse?: boolean;
  /** Background colour the edges fade into. */
  fade?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const reduced = useReducedMotion();
  const [w, setW] = useState(0);
  const x = useSharedValue(0);

  useEffect(() => {
    if (!w || reduced) return;
    x.value = 0;
    x.value = withRepeat(withTiming(-w, { duration: (w / speed) * 1000, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(x);
  }, [w, speed, reduced, x]);

  const moving = useAnimatedStyle(() => ({ transform: [{ translateX: reverse ? -w - x.value : x.value }] }));

  const copy = (measure: boolean) => (
    <View
      onLayout={measure ? (e) => setW(e.nativeEvent.layout.width) : undefined}
      style={{ flexDirection: 'row', gap, paddingRight: gap }}
      aria-hidden={!measure}>
      {children}
    </View>
  );

  return (
    <View style={[{ overflow: 'hidden', width: '100%' }, style]}>
      <Animated.View style={[{ flexDirection: 'row', alignSelf: 'flex-start' }, moving]}>
        {copy(true)}
        {copy(false)}
      </Animated.View>
      {fade && (
        <>
          <LinearGradient colors={[fade, `${fade}00`]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 56 }} />
          <LinearGradient colors={[`${fade}00`, fade]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} pointerEvents="none" style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 56 }} />
        </>
      )}
    </View>
  );
}
