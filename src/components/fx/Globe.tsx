import { useEffect, useMemo, useRef, useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, G, Line, Path, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { LFK_LL } from '@/data/countries';
import { globeDots, mapDots } from '@/data/worldDots';
import { useI18n } from '@/i18n';
import { askMotionPermission, eggs } from '@/lib/eggs';
import { useTheme } from '@/theme/ThemeProvider';
import { brand, fonts } from '@/theme/tokens';

/**
 * React Native port of 21st.dev "Interactive Globe" (dev.yadhakim) — the original draws on a
 * <canvas>; here the same projection runs per frame into a handful of SVG paths.
 *  · perspective projection, depth-faded dots (real land from `dotted-map` instead of a plain sphere)
 *  · arcs through a raised midpoint, each with a travelling light particle
 *  · pulsing rings + labels on markers, drag to rotate, auto-rotate when idle
 * Arcs all start at the LFK (Kuwait).
 */

export type GlobeMarker = { key: string; ll: [number, number]; weight?: number; active?: boolean; label?: string };

type Vec = [number, number, number];
const DEG = Math.PI / 180;
const FPS = 30;

const toVec = (lat: number, lng: number): Vec => {
  const la = lat * DEG;
  const lo = lng * DEG;
  return [Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)];
};

/** Longitude spin `phi`, then tilt `theta`; +z faces the viewer. */
function rotate([x, y, z]: Vec, phi: number, theta: number): Vec {
  const cp = Math.cos(phi);
  const sp = Math.sin(phi);
  const x1 = x * cp + z * sp;
  const z1 = -x * sp + z * cp;
  const ct = Math.cos(theta);
  const st = Math.sin(theta);
  return [x1, y * ct - z1 * st, z1 * ct + y * st];
}

const dot = (x: number, y: number, r: number) =>
  `M${(x - r).toFixed(1)},${y.toFixed(1)}a${r.toFixed(2)},${r.toFixed(2)} 0 1,0 ${(2 * r).toFixed(2)},0a${r.toFixed(2)},${r.toFixed(2)} 0 1,0 ${(-2 * r).toFixed(2)},0`;

const shortest = (from: number, to: number) => {
  let d = (to - from) % (2 * Math.PI);
  if (d > Math.PI) d -= 2 * Math.PI;
  if (d < -Math.PI) d += 2 * Math.PI;
  return d;
};

export function Globe({
  size: fixedSize,
  maxSize = 520,
  markers = [],
  focus,
  tone = 'light',
  autoRotate = true,
  arcs = true,
  labels = true,
  originLabel = 'LFK',
  style,
}: {
  size?: number;
  maxSize?: number;
  markers?: GlobeMarker[];
  /** Turns the globe to face this point (e.g. the selected country). */
  focus?: [number, number] | null;
  /** Surface behind the globe — 'dark' on navy panels. */
  tone?: 'light' | 'dark';
  autoRotate?: boolean;
  arcs?: boolean;
  labels?: boolean;
  originLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { scheme } = useTheme();
  const reduced = useReducedMotion();
  const [measured, setMeasured] = useState(0);
  const size = fixedSize ?? Math.min(measured, maxSize);
  const onDark = tone === 'dark' || scheme === 'dark';
  const { lang, d } = useI18n();

  // Easter egg: shake the phone and the globe drops, then bounces back.
  const drop = useSharedValue(0);
  const spin = useSharedValue(0);
  useEffect(
    () =>
      eggs.on('shake', () => {
        drop.value = withSequence(withTiming(180, { duration: 420, easing: Easing.in(Easing.quad) }), withSpring(0, { damping: 4, stiffness: 140 }));
        spin.value = withSequence(withTiming(25, { duration: 420 }), withSpring(0, { damping: 5 }));
      }),
    [drop, spin],
  );
  const fall = useAnimatedStyle(() => ({ transform: [{ translateY: drop.value }, { rotate: `${spin.value}deg` }] }));

  const land = useMemo(() => globeDots().map(([la, lo]) => toVec(la, lo)), []);
  const origin = useMemo(() => toVec(LFK_LL[0], LFK_LL[1]), []);
  const targets = useMemo(() => markers.map((m) => ({ ...m, v: toVec(m.ll[0], m.ll[1]) })), [markers]);

  const [view, setView] = useState({ phi: -35 * DEG, theta: 0.38, t: 0 });
  const focusKey = focus ? `${focus[0]},${focus[1]}` : '';
  const live = useRef({ phi: -35 * DEG, theta: 0.38, focus: focus ?? null, focusKey, ignoredFocus: '', autoRotate, idleUntil: 0 });
  const drag = useRef({ active: false, dx: 0, dy: 0, phi0: 0, theta0: 0 });
  const start = useRef({ x: 0, y: 0 });

  useEffect(() => {
    live.current.focus = focus ?? null;
    live.current.focusKey = focusKey;
    live.current.autoRotate = autoRotate;
  });

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let lastPaint = 0;
    let t = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      const s = live.current;
      const g = drag.current;
      if (g.active) {
        // Same feel as the original: 0.005 rad per dragged pixel, tilt clamped.
        s.phi = g.phi0 + g.dx * 0.005;
        s.theta = Math.max(-0.6, Math.min(1, g.theta0 + g.dy * 0.005));
      } else if (s.focus && s.ignoredFocus !== s.focusKey) {
        const k = 1 - Math.exp(-dt * 3);
        s.phi += shortest(s.phi, -s.focus[1] * DEG) * k;
        s.theta += (Math.max(-0.5, Math.min(0.9, s.focus[0] * DEG * 0.8)) - s.theta) * k;
      } else if (s.autoRotate && !reduced && Date.now() > s.idleUntil) {
        s.phi += dt * 0.14;
        s.theta += (0.38 - s.theta) * (1 - Math.exp(-dt));
      }
      if (now - lastPaint >= 1000 / FPS) {
        lastPaint = now;
        setView({ phi: s.phi, theta: s.theta, t: reduced ? 0.8 : t });
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  type Touch = { nativeEvent: { pageX: number; pageY: number } };
  const onGrant = (e: Touch) => {
    askMotionPermission();
    start.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
    drag.current = { active: true, dx: 0, dy: 0, phi0: live.current.phi, theta0: live.current.theta };
  };
  const onMove = (e: Touch) => {
    drag.current.dx = e.nativeEvent.pageX - start.current.x;
    drag.current.dy = e.nativeEvent.pageY - start.current.y;
  };
  const onRelease = () => {
    const g = drag.current;
    g.active = false;
    if (Math.abs(g.dx) + Math.abs(g.dy) > 6) live.current.ignoredFocus = live.current.focusKey;
    live.current.idleUntil = Date.now() + 1800;
  };

  const { phi, theta, t } = view;
  const c = size / 2;
  const R = size * 0.38;
  const fov = R * 3.4;
  // In perspective the visible rim is where the eye's tangent touches the sphere: z = R / fov (not 0),
  // and it projects slightly outside R.
  const limb = R / fov;
  const rim = R / Math.sqrt(1 - limb * limb);
  const k = Math.max(0.6, size / 460); // scales the original's pixel sizes

  const project = (v: Vec, h = 1) => {
    const [x, y, z] = rotate(v, phi, theta);
    const s = fov / (fov - z * R * h);
    return { x: c + x * R * h * s, y: c - y * R * h * s, z };
  };

  // Dots — three depth bands (the canvas version sets alpha per dot).
  const bands = ['', '', ''];
  if (size > 0) {
    for (const p of land) {
      const q = project(p);
      if (q.z <= limb) continue;
      const depth = (q.z - limb) / (1 - limb);
      const b = depth > 0.6 ? 0 : depth > 0.28 ? 1 : 2;
      bands[b] += dot(q.x, q.y, (1 + depth * 0.8) * 0.72 * k);
    }
  }

  const dotFill = onDark ? brand.sky : brand.blue;
  const red = onDark ? '#FF5A5C' : brand.red;
  const labelFill = onDark ? 'rgba(200,211,229,0.75)' : 'rgba(0,32,106,0.7)';
  const lk = Math.min(1.4, k);

  const arcEls: React.ReactNode[] = [];
  if (arcs && size > 0) {
    const a = project(origin);
    targets.forEach((m, i) => {
      const b = project(m.v);
      if (a.z < limb - 0.3 && b.z < limb - 0.3) return;
      // Raised midpoint (radius × 1.25 in the original), used as the quadratic control point.
      const mid: Vec = [(origin[0] + m.v[0]) / 2, (origin[1] + m.v[1]) / 2, (origin[2] + m.v[2]) / 2];
      const len = Math.hypot(...mid) || 1;
      const ctrl = project([mid[0] / len, mid[1] / len, mid[2] / len], 1.25);
      const d = `M${a.x.toFixed(1)},${a.y.toFixed(1)}Q${ctrl.x.toFixed(1)},${ctrl.y.toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}`;
      const u = (Math.sin(t * 1.2 + i * 0.9) + 1) / 2;
      const px = (1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * ctrl.x + u * u * b.x;
      const py = (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * ctrl.y + u * u * b.y;
      arcEls.push(
        <G key={`arc-${m.key}`} opacity={a.z < limb && b.z < limb ? 0.35 : 1}>
          <Path d={d} stroke={red} strokeOpacity={m.active ? 0.9 : 0.45} strokeWidth={(m.active ? 1.8 : 1.2) * lk} fill="none" />
          {!reduced && <Circle cx={px} cy={py} r={2 * lk} fill={red} />}
        </G>
      );
    });
  }

  const ranked = [...targets].sort((x, y) => (y.weight ?? 0) - (x.weight ?? 0));
  const labelled = new Set(ranked.slice(0, size >= 380 ? 6 : 3).map((m) => m.key));
  const markerEls = targets.map((m, i) => {
    const q = project(m.v);
    if (q.z < limb) return null;
    const pulse = Math.sin(t * 2 + i) * 0.5 + 0.5;
    const r0 = 2.5 * lk * (m.active ? 1.5 : 1);
    return (
      <G key={`m-${m.key}`} opacity={Math.min(1, 0.3 + (q.z - limb) * 3)}>
        <Circle cx={q.x} cy={q.y} r={r0 + 1.5 + pulse * 4 * lk} fill="none" stroke={red} strokeOpacity={0.25 + pulse * 0.25} strokeWidth={1} />
        <Circle cx={q.x} cy={q.y} r={r0} fill={red} />
        {labels && m.label && (m.active || labelled.has(m.key)) && (
          <SvgText x={q.x + 8} y={q.y + 3.5} fill={m.active ? (onDark ? '#fff' : brand.navy) : labelFill} fontSize={10 * Math.min(1.25, k)} fontFamily={fonts.medium}>
            {m.label}
          </SvgText>
        )}
      </G>
    );
  });

  const o = project(origin);
  const originEl = o.z > limb && (
    <G opacity={Math.min(1, 0.3 + (o.z - limb) * 3)}>
      <Circle cx={o.x} cy={o.y} r={4 * lk} fill={onDark ? '#fff' : brand.navy} stroke={red} strokeWidth={1.5} />
      {labels && (
        <SvgText x={o.x + 9} y={o.y + 4} fill={onDark ? '#fff' : brand.navy} fontSize={11 * Math.min(1.25, k)} fontFamily={fonts.semibold}>
          {originLabel}
        </SvgText>
      )}
    </G>
  );

  // Easter egg: in Pirate, an old treasure map with an X on Kuwait.
  if (lang === 'pirate') {
    return (
      <Animated.View style={[{ width: fixedSize ?? '100%', maxWidth: maxSize, aspectRatio: 1, alignSelf: 'center' }, style, fall]} onLayout={fixedSize ? undefined : (e) => setMeasured(e.nativeEvent.layout.width)}>
        {size > 0 && <TreasureMap size={size} markers={markers} label={d.eggs.treasure} />}
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[{ alignSelf: 'center', width: fixedSize ?? '100%', maxWidth: maxSize }, fall]}>
    <View
      style={[{ width: fixedSize ?? '100%', maxWidth: maxSize, aspectRatio: 1, alignSelf: 'center' }, style]}
      onLayout={fixedSize ? undefined : (e) => setMeasured(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={onGrant}
      onResponderMove={onMove}
      onResponderRelease={onRelease}
      onResponderTerminate={onRelease}>
      {size > 0 && (
        <Svg width={size} height={size}>
          <Circle cx={c} cy={c} r={rim} fill="none" stroke={onDark ? 'rgba(200,211,229,0.14)' : 'rgba(0,32,106,0.1)'} strokeWidth={1} />
          <Path d={bands[2]} fill={dotFill} opacity={0.3} />
          <Path d={bands[1]} fill={dotFill} opacity={0.55} />
          <Path d={bands[0]} fill={dotFill} opacity={onDark ? 0.9 : 0.85} />
          {arcEls}
          {markerEls}
          {originEl}
        </Svg>
      )}
    </View>
    </Animated.View>
  );
}

/** Pirate easter egg: parchment world map, a dotted trail and a red X on the LFK. */
function TreasureMap({ size, markers, label }: { size: number; markers: GlobeMarker[]; label: string }) {
  const dots = useMemo(() => mapDots(), []);
  const pad = size * 0.07;
  const w = size - pad * 2;
  const h = w / 2;
  const top = (size - h) / 2 - size * 0.04;
  const at = (lat: number, lng: number) => ({ x: pad + ((lng + 180) / 360) * w, y: top + ((90 - lat) / 180) * h });
  const land = dots.map(([la, lo]) => {
    const p = at(la, lo);
    return dot(p.x, p.y, Math.max(0.7, size / 420));
  }).join('');
  const x = at(LFK_LL[0], LFK_LL[1]);
  const start = at(-35, -30);
  const xr = size * 0.025;
  const torn = `M${size * 0.03},${size * 0.05} L${size * 0.3},${size * 0.02} L${size * 0.55},${size * 0.06} L${size * 0.8},${size * 0.02} L${size * 0.97},${size * 0.06} L${size * 0.95},${size * 0.4} L${size * 0.98},${size * 0.7} L${size * 0.95},${size * 0.96} L${size * 0.6},${size * 0.93} L${size * 0.35},${size * 0.98} L${size * 0.04},${size * 0.94} L${size * 0.02},${size * 0.6} L${size * 0.05},${size * 0.3} Z`;
  const cx = size * 0.84;
  const cy = size * 0.8;
  const cr = size * 0.07;
  return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id="parchment" cx="50%" cy="50%" r="60%">
          <Stop offset="0" stopColor="#F4E4BC" />
          <Stop offset="0.7" stopColor="#E3C88E" />
          <Stop offset="1" stopColor="#B88A4A" />
        </RadialGradient>
      </Defs>
      <Path d={torn} fill="url(#parchment)" stroke="#7A5230" strokeWidth={1.5} />
      <Rect x={pad * 0.9} y={top - pad * 0.3} width={w + pad * 0.2} height={h + pad * 0.6} fill="none" stroke="#7A5230" strokeWidth={1} strokeDasharray="2 3" opacity={0.6} />
      <Path d={land} fill="#7A5230" opacity={0.55} />
      {markers.map((m) => {
        const p = at(m.ll[0], m.ll[1]);
        return <Circle key={m.key} cx={p.x} cy={p.y} r={Math.max(1.5, size / 200)} fill="#5C3A1A" />;
      })}
      <Path d={`M${start.x},${start.y} Q${(start.x + x.x) / 2},${start.y - h * 0.9} ${x.x},${x.y}`} stroke="#8B1A1A" strokeWidth={Math.max(1.2, size / 260)} strokeDasharray="5 5" fill="none" />
      <Line x1={x.x - xr} y1={x.y - xr} x2={x.x + xr} y2={x.y + xr} stroke="#B00000" strokeWidth={Math.max(2.5, size / 110)} strokeLinecap="round" />
      <Line x1={x.x + xr} y1={x.y - xr} x2={x.x - xr} y2={x.y + xr} stroke="#B00000" strokeWidth={Math.max(2.5, size / 110)} strokeLinecap="round" />
      <SvgText x={x.x} y={x.y - xr * 2} fill="#5C1A1A" fontSize={Math.max(10, size / 30)} fontFamily={fonts.serifItalic} textAnchor="middle">
        {label}
      </SvgText>
      <G opacity={0.75}>
        <Circle cx={cx} cy={cy} r={cr} fill="none" stroke="#7A5230" strokeWidth={1} />
        <Path d={`M${cx},${cy - cr * 1.3} L${cx + cr * 0.22},${cy} L${cx},${cy + cr * 1.3} L${cx - cr * 0.22},${cy} Z`} fill="#7A5230" />
        <Path d={`M${cx - cr * 1.3},${cy} L${cx},${cy - cr * 0.22} L${cx + cr * 1.3},${cy} L${cx},${cy + cr * 0.22} Z`} fill="#A0784A" />
        <SvgText x={cx} y={cy - cr * 1.45} fill="#5C3A1A" fontSize={Math.max(8, size / 45)} fontFamily={fonts.semibold} textAnchor="middle">N</SvgText>
      </G>
    </Svg>
  );
}
