import { LinearGradient } from 'expo-linear-gradient';
import { useId, useMemo, useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient as SvgGradient, Path, Stop, Text as SvgText } from 'react-native-svg';

import { LFK_LL } from '@/data/countries';
import { mapDots } from '@/data/worldDots';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';
import { useClock } from './useClock';
import { useOnScreen } from './useOnScreen';

/**
 * React Native port of 21st.dev "World Map" (Aceternity): dotted continents, curved lines that
 * draw in one after another (pathLength 0 → 1, 1 s each, 0.5 s stagger) with faded ends, and
 * pulsing endpoints. Dots and lines share one equirectangular projection so they line up.
 */

export type MapArc = { key: string; to: [number, number]; active?: boolean; label?: string };

const W = 800;
const H = 400;
const TOP = (90 - 76) * (H / 180);
const BOTTOM = (90 + 58) * (H / 180);
const project = (lat: number, lng: number) => ({ x: (lng + 180) * (W / 360), y: (90 - lat) * (H / 180) });

/** Samples a quadratic curve and keeps the first `p` (0–1) of it. */
function partialQuad(a: { x: number; y: number }, c: { x: number; y: number }, b: { x: number; y: number }, p: number) {
  if (p <= 0) return '';
  const n = 32;
  let d = '';
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * p;
    const x = (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * c.x + t * t * b.x;
    const y = (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * c.y + t * t * b.y;
    d += `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
  }
  return d;
}

const easeOut = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

export function WorldMap({ arcs = [], lineColor, fadeInto, dotColor }: { arcs?: MapArc[]; lineColor?: string; fadeInto?: string; dotColor?: string }) {
  const { colors, scheme } = useTheme();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [w, setW] = useState(0);
  // Arcs draw in when the map comes on screen; the clock stops while it is scrolled away.
  const [ref, onScreen] = useOnScreen();
  const t = useClock({ running: onScreen, still: 60 });
  const line = lineColor ?? colors.primary;
  const fade = fadeInto ?? colors.surface;

  const dotsPath = useMemo(
    () =>
      mapDots()
        .map(([la, lo]) => {
          const { x, y } = project(la, lo);
          return `M${(x - 1.35).toFixed(1)},${y.toFixed(1)}a1.35,1.35 0 1,0 2.7,0a1.35,1.35 0 1,0 -2.7,0`;
        })
        .join(''),
    []
  );

  const start = project(LFK_LL[0], LFK_LL[1]);
  const h = (w * (BOTTOM - TOP)) / W;
  const pulse = (offset: number) => ((t + offset) % 1.5) / 1.5;

  return (
    <View ref={ref} onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ width: '100%', height: h || 200 }}>
      {w > 0 && (
        <Svg width={w} height={h} viewBox={`0 ${TOP} ${W} ${BOTTOM - TOP}`}>
          <Defs>
            <SvgGradient id={`pg${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={line} stopOpacity={0} />
              <Stop offset="5%" stopColor={line} stopOpacity={1} />
              <Stop offset="95%" stopColor={line} stopOpacity={1} />
              <Stop offset="100%" stopColor={line} stopOpacity={0} />
            </SvgGradient>
          </Defs>
          <Path d={dotsPath} fill={dotColor ?? (scheme === 'dark' ? '#FFFFFF' : '#0E2A47')} opacity={0.26} />
          {arcs.map((arc, i) => {
            const end = project(arc.to[0], arc.to[1]);
            const ctrl = { x: (start.x + end.x) / 2, y: Math.min(start.y, end.y) - 50 };
            const p = easeOut((t - 0.3 - 0.5 * i) / 1);
            return <Path key={arc.key} d={partialQuad(start, ctrl, end, p)} fill="none" stroke={`url(#pg${uid})`} strokeWidth={arc.active ? 2 : 1} />;
          })}
          {arcs.map((arc, i) => {
            const end = project(arc.to[0], arc.to[1]);
            const q = pulse(i * 0.2);
            return (
              <G key={`p-${arc.key}`}>
                <Circle cx={end.x} cy={end.y} r={arc.active ? 3 : 2} fill={line} />
                <Circle cx={end.x} cy={end.y} r={2 + q * 6} fill={line} opacity={0.5 * (1 - q)} />
                {arc.active && arc.label && (
                  <SvgText x={end.x + 7} y={end.y - 6} fill={colors.text} fontSize={12} fontFamily={fonts.semibold}>
                    {arc.label}
                  </SvgText>
                )}
              </G>
            );
          })}
          <Circle cx={start.x} cy={start.y} r={3} fill={colors.navy} stroke={line} strokeWidth={1.5} />
          <Circle cx={start.x} cy={start.y} r={2 + pulse(0) * 6} fill={line} opacity={0.5 * (1 - pulse(0))} />
        </Svg>
      )}
      {/* Top/bottom fade — the original masks the map with a vertical gradient. */}
      <LinearGradient colors={[fade, `${fade}00`]} pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '10%' }} />
      <LinearGradient colors={[`${fade}00`, fade]} pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '10%' }} />
    </View>
  );
}
