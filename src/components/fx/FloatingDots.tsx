import { useEffect, useId } from 'react';
import { View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

/**
 * Small glossy spheres scattered around big type, bobbing gently — the pins around
 * "3000HA" on delassus.com. Positions are deterministic so every render matches.
 */
const SPOTS = [
  [6, 12, 16], [18, 78, 12], [30, 28, 10], [44, 88, 14], [57, 8, 11], [69, 70, 16], [82, 22, 13], [92, 84, 10], [12, 46, 9], [88, 52, 12], [50, 50, 0],
] as const;

export function FloatingDots({ color, altColor, highlight = 'rgba(255,255,255,0.55)', edgesOnly }: { color: string; /** Every third sphere takes this colour. */ altColor?: string; highlight?: string; /** Keep spheres near the sides (narrow screens, where centred type fills the width). */ edgesOnly?: boolean }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      {SPOTS.filter((s) => s[2] > 0 && (!edgesOnly || s[0] < 15 || s[0] > 85)).map(([x, y, size], i) => (
        <Dot key={i} x={x} y={y} size={size} color={altColor && i % 3 === 1 ? altColor : color} highlight={highlight} phase={i} />
      ))}
    </View>
  );
}

function Dot({ x, y, size, color, highlight, phase }: { x: number; y: number; size: number; color: string; highlight: string; phase: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const reduced = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    t.value = withRepeat(withTiming(1, { duration: 2600 + phase * 310, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(t);
  }, [reduced, phase, t]);
  const bob = useAnimatedStyle(() => ({ transform: [{ translateY: (t.value - 0.5) * 14 }] }));
  const d = size * 2;
  return (
    <Animated.View style={[{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: d, height: d * 1.4 }, bob]}>
      <Svg width={d} height={d * 1.4}>
        <Defs>
          <RadialGradient id={`s${uid}`} cx="35%" cy="30%" r="70%">
            <Stop offset="0" stopColor={highlight} />
            <Stop offset="0.35" stopColor={color} />
            <Stop offset="1" stopColor={color} />
          </RadialGradient>
        </Defs>
        {/* soft contact shadow */}
        <Circle cx={d * 0.62} cy={d * 1.18} r={size * 0.7} fill="rgba(0,0,0,0.18)" />
        <Circle cx={size} cy={size} r={size} fill={`url(#s${uid})`} />
      </Svg>
    </Animated.View>
  );
}
