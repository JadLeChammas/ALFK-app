import { Image, type ImageSource } from 'expo-image';
import { useEffect, useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { brand } from '@/theme/tokens';
import { useInView } from './useInView';

/**
 * Photo that arrives behind a sliding colour panel (a wipe) while it settles from a slight zoom —
 * triggered when it scrolls into view.
 */
export function ImageReveal({ source, style, cover = brand.navy, delay = 0 }: { source: string | ImageSource | number; style?: StyleProp<ViewStyle>; cover?: string; delay?: number }) {
  const [ref, inView] = useInView();
  const reduced = useReducedMotion();
  const [w, setW] = useState(0);
  const p = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (inView && !reduced && w) p.value = withDelay(delay, withTiming(1, { duration: 1100, easing: Easing.bezier(0.77, 0, 0.18, 1) }));
  }, [inView, reduced, w, delay, p]);
  const panel = useAnimatedStyle(() => ({ transform: [{ translateX: p.value * (w + 2) }] }));
  const zoom = useAnimatedStyle(() => ({ transform: [{ scale: 1.16 - 0.16 * p.value }] }));
  return (
    <View ref={ref} onLayout={(e) => setW(e.nativeEvent.layout.width)} style={[{ overflow: 'hidden' }, style]}>
      <Animated.View style={[{ width: '100%', height: '100%' }, zoom]}>
        <Image source={typeof source === 'string' ? { uri: source } : source} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={250} />
      </Animated.View>
      {!reduced && <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: cover }, panel]} />}
    </View>
  );
}
