import { useEffect } from 'react';
import { View, type StyleProp, type TextStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { useInView } from './useInView';

/**
 * Port of 21st.dev "Text Roll" (cnippet-dev, stats row): each character flips in on the X axis
 * with perspective, staggered — started when the value scrolls into view.
 */
export function TextRoll({ children, style, delay = 0, stagger = 0.04, duration = 0.4 }: { children: string; style: StyleProp<TextStyle>; delay?: number; stagger?: number; duration?: number }) {
  const [ref, inView] = useInView();
  const reduced = useReducedMotion();
  if (reduced) return <Animated.Text style={style}>{children}</Animated.Text>;
  return (
    <View ref={ref} accessibilityLabel={children} style={{ flexDirection: 'row' }}>
      {children.split('').map((ch, i) => (
        <Char key={i} ch={ch} style={style} show={inView} delay={delay + i * stagger} duration={duration} />
      ))}
    </View>
  );
}

function Char({ ch, style, show, delay, duration }: { ch: string; style: StyleProp<TextStyle>; show: boolean; delay: number; duration: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    if (show) p.value = withDelay(delay * 1000, withTiming(1, { duration: duration * 1000, easing: Easing.in(Easing.quad) }));
  }, [show, delay, duration, p]);
  const anim = useAnimatedStyle(() => ({
    opacity: p.value < 0.05 ? 0 : 1,
    transform: [{ perspective: 800 }, { rotateX: `${(1 - p.value) * 90}deg` }],
  }));
  return <Animated.Text style={[style, anim]}>{ch === ' ' ? ' ' : ch}</Animated.Text>;
}
