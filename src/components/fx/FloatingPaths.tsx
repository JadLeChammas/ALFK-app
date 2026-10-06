import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { Platform, View } from 'react-native';
import Animated, { useAnimatedProps, useFrameCallback, useReducedMotion, useSharedValue } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { LITE } from '@/lib/perf';
import { useOnScreen } from './useOnScreen';

const AnimatedPath = Animated.createAnimatedComponent(Path);

type Pt = [number, number];

/** Approximate length of a cubic Bézier (sampled), to drive the dash « draw » effect. */
function cubicLength(p0: Pt, c1: Pt, c2: Pt, p1: Pt) {
  let len = 0;
  let prev = p0;
  for (let k = 1; k <= 48; k++) {
    const t = k / 48;
    const u = 1 - t;
    const x = u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p1[0];
    const y = u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p1[1];
    len += Math.hypot(x - prev[0], y - prev[1]);
    prev = [x, y];
  }
  return len;
}

/** The 21st.dev « Floating paths » curves (bundui), for one side (`position` 1 or -1). */
function buildPaths(position: number, count: number) {
  return Array.from({ length: count }, (_, i) => {
    const s = i * 5 * position;
    const p0: Pt = [-(380 - s), -(189 + i * 6)];
    const c2a: Pt = [-(312 - s), 216 - i * 6];
    const p1: Pt = [152 - s, 343 - i * 6];
    const c1b: Pt = [616 - s, 470 - i * 6];
    const p2: Pt = [684 - s, 875 - i * 6];
    const d = `M${p0[0]} ${p0[1]}C${p0[0]} ${p0[1]} ${c2a[0]} ${c2a[1]} ${p1[0]} ${p1[1]}C${c1b[0]} ${c1b[1]} ${p2[0]} ${p2[1]} ${p2[0]} ${p2[1]}`;
    const length = cubicLength(p0, p0, c2a, p1) + cubicLength(p1, c1b, p2, p2);
    // Deterministic « random » numbers: a duration between 20 and 30 s, as in the original, and a
    // starting point in the cycle so the curves are spread out from the first second.
    const rand = (seed: number) => ((Math.sin(seed) * 43758.5453) % 1 + 1) % 1;
    const duration = 20 + rand((i + 1) * 12.9898 * (position + 2)) * 10;
    const phase = rand((i + 1) * 78.233 * (position + 3));
    return { key: `${position}-${i}`, d, length, duration, phase, width: 0.5 + i * 0.03, opacity: Math.min(1, 0.1 + i * 0.03) };
  });
}

function FloatingPath({ path, clock, color, intensity }: { path: ReturnType<typeof buildPaths>[number]; clock: { value: number }; color: string; intensity: number }) {
  const props = useAnimatedProps(() => {
    // pathOffset and opacity go 0 → 1 → 0 over the path's own duration, forever (linear).
    const u = (clock.value / path.duration + path.phase) % 1;
    const tri = u < 0.5 ? u * 2 : (1 - u) * 2;
    return { strokeDashoffset: -tri * path.length, strokeOpacity: path.opacity * (0.3 + 0.3 * tri) * intensity };
  });
  return <AnimatedPath d={path.d} stroke={color} strokeWidth={path.width} strokeDasharray={[path.length, path.length]} fill="none" animatedProps={props} />;
}

/**
 * Port of 21st.dev « Floating paths » (bundui): two families of long curves that slowly erase and
 * redraw themselves while breathing in opacity — a quiet animated backdrop. Covers its parent;
 * runs only while on screen and stays still when the OS asks for reduced motion.
 */
export function FloatingPaths({
  color,
  fade,
  count = 28,
  intensity = 0.9,
}: {
  color: string;
  /** Background colour: the lines fade into it at the bottom and leave a clear area for centred text. */
  fade?: string;
  count?: number;
  /** Overall strength of the lines (1 = the original's opacity). */
  intensity?: number;
}) {
  const reduced = useReducedMotion();
  const [box, onScreen] = useOnScreen();
  // Phones: half the lines (each one is redrawn many times a second).
  const lines = LITE ? Math.ceil(count / 2) : count;
  const paths = useMemo(() => [...buildPaths(1, lines), ...buildPaths(-1, lines)], [lines]);
  const clock = useSharedValue(0);
  const pending = useSharedValue(0);
  // The motion is very slow (20–30 s cycles): 24 updates a second are plenty and keep the page light.
  useFrameCallback((f) => {
    if (!onScreen || reduced) return;
    pending.value += Math.min(0.05, (f.timeSincePreviousFrame ?? 16) / 1000);
    if (pending.value >= 1 / 24) {
      clock.value += pending.value;
      pending.value = 0;
    }
  });
  return (
    <View ref={box} pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <Svg width="100%" height="100%" viewBox="0 0 696 316" preserveAspectRatio="xMidYMid slice">
        {paths.map((p) => (
          <FloatingPath key={p.key} path={p} clock={clock} color={color} intensity={intensity} />
        ))}
      </Svg>
      {fade && (
        <>
          {Platform.OS === 'web' && (
            <View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, { backgroundImage: `radial-gradient(ellipse 42% 34% at 50% 46%, ${fade} 0%, ${fade}e6 45%, ${fade}00 100%)` } as object]} />
          )}
          <LinearGradient colors={[`${fade}00`, fade]} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '35%' }} />
        </>
      )}
    </View>
  );
}
