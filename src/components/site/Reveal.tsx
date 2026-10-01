import { useEffect, type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { useInView } from '@/components/fx/useInView';

/**
 * Entrance used by the 21st.dev editorial blocks — fade + rise (y 12 → 0), ease [0.22, 1, 0.36, 1],
 * 0.1 s stagger — started when the element scrolls into view (`whileInView`, once).
 */
export function Reveal({ children, index = 0, style }: { children: ReactNode; index?: number; style?: StyleProp<ViewStyle> }) {
  const [ref, inView] = useInView();
  const reduced = useReducedMotion();
  const p = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (inView && !reduced) p.value = withDelay(50 + index * 100, withTiming(1, { duration: 550, easing: Easing.bezier(0.22, 1, 0.36, 1) }));
  }, [inView, index, reduced, p]);
  const anim = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ translateY: (1 - p.value) * 16 }] }));
  return (
    <Animated.View ref={ref} style={[style, anim]}>
      {children}
    </Animated.View>
  );
}
