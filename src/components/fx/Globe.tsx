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

/** Pirate easter egg (treasure map instead of the globe): switched off for now, kept for later. */
const TREASURE_MAP = false;

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
  const red = onDark ? '#E05A5D' : brand.red;
  const labelFill = onDark ? 'rgba(231, 236, 242,0.75)' : 'rgba(14, 42, 71,0.7)';
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
  if (TREASURE_MAP && lang === 'pirate') {
    return (
      <Animated.View style={[{ width: fixedSize ?? '100%', maxWidth: maxSize, aspectRatio: 1, alignSelf: 'center' }, style, fall]} onLayout={fixedSize ? undefined : (e) => setMeasured(e.nativeEvent.layout.width)}>
        {size > 0 && <TreasureMap size={size} markers={markers} label={d.eggs.treasure} title={d.eggs.mapTitle} />}
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
          <Circle cx={c} cy={c} r={rim} fill="none" stroke={onDark ? 'rgba(231, 236, 242,0.14)' : 'rgba(14, 42, 71,0.1)'} strokeWidth={1} />
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

/** Pirate easter egg: an old treasure map — routes from the LFK to where alumni went, an X on Kuwait. */
const LAT_TOP = 78;
const LAT_SPAN = 134;

function TreasureMap({ size, markers, label, title }: { size: number; markers: GlobeMarker[]; label: string; title: string }) {
  const ink = '#4A2C12';
  const red = '#A3120F';
  const k = size / 500;
  // Map area: latitudes 78°N → 56°S, all longitudes, filling most of the width.
  const left = size * 0.06;
  const w = size * 0.88;
  // Old maps were drawn taller than a true projection: it fills the parchment better.
  const h = w * 0.62;
  const top = size * 0.19;
  const at = (lat: number, lng: number) => ({ x: left + ((lng + 180) / 360) * w, y: top + ((LAT_TOP - lat) / LAT_SPAN) * h });

  // Overlapping dots make solid continents; a slightly bigger dark pass underneath draws the coastline.
  const land = useMemo(() => {
    const l = size * 0.06;
    const ww = size * 0.88;
    const hh = ww * 0.62;
    const t = size * 0.19;
    const kk = size / 500;
    const pts = mapDots()
      .filter(([la]) => la <= LAT_TOP && la >= LAT_TOP - LAT_SPAN)
      .map(([la, lo]) => [l + ((lo + 180) / 360) * ww, t + ((LAT_TOP - la) / LAT_SPAN) * hh] as const);
    return {
      coast: pts.map(([px, py]) => dot(px, py, 3.5 * kk)).join(''),
      fill: pts.map(([px, py]) => dot(px, py, 2.6 * kk)).join(''),
    };
  }, [size]);

  const x = at(LFK_LL[0], LFK_LL[1]);
  const xr = 11 * k;
  // Routes: from the X to the main destinations, like a navigator's chart.
  const routes = [...markers].sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0)).slice(0, 8);
  const graticule: string[] = [];
  for (let lng = -150; lng <= 150; lng += 30) {
    const a = at(LAT_TOP, lng);
    const b = at(LAT_TOP - LAT_SPAN, lng);
    graticule.push(`M${a.x},${a.y}V${b.y}`);
  }
  for (let lat = 60; lat >= -50; lat -= 30) {
    const a = at(lat, -180);
    graticule.push(`M${a.x},${a.y}H${a.x + w}`);
  }
  const wave = (lat: number, lng: number) => {
    const q = at(lat, lng);
    const s = 7 * k;
    return `M${q.x - s * 2},${q.y} q${s / 2},${-s / 2} ${s},0 t${s},0 t${s},0 t${s},0`;
  };
  const peak = (lat: number, lng: number, n = 3) => {
    const q = at(lat, lng);
    const s = 4.5 * k;
    let d = '';
    for (let i = 0; i < n; i++) d += `M${q.x + (i - (n - 1) / 2) * s * 1.6 - s},${q.y + s * 0.6} l${s},${-s * 1.4} l${s},${s * 1.4}`;
    return d;
  };
  const mountains = [peak(32, 82), peak(-18, -67, 2), peak(42, -110), peak(46, 9, 2), peak(-5, 37, 2)].join('');
  const waves = [wave(28, -45), wave(5, -28), wave(-30, -20), wave(10, -150), wave(-20, -120), wave(30, 160), wave(-25, 75), wave(-45, 120)].join('');
  const z = size;
  const torn = `M${z * 0.03},${z * 0.06} L${z * 0.18},${z * 0.025} L${z * 0.34},${z * 0.05} L${z * 0.52},${z * 0.02} L${z * 0.7},${z * 0.045} L${z * 0.86},${z * 0.02} L${z * 0.975},${z * 0.07} L${z * 0.96},${z * 0.3} L${z * 0.985},${z * 0.52} L${z * 0.96},${z * 0.75} L${z * 0.975},${z * 0.95} L${z * 0.78},${z * 0.975} L${z * 0.6},${z * 0.95} L${z * 0.42},${z * 0.98} L${z * 0.22},${z * 0.955} L${z * 0.03},${z * 0.97} L${z * 0.045},${z * 0.74} L${z * 0.015},${z * 0.5} L${z * 0.04},${z * 0.27} Z`;
  // Compass rose (bottom right), ship (bottom left), sea serpent (Pacific).
  const cx = z * 0.85;
  const cy = z * 0.875;
  const cr = 24 * k;
  const ship = { x: z * 0.16, y: z * 0.9 };
  const serpent = at(-35, -125);
  const bw = Math.min(z * 0.78, 360 * k);
  const bh = 34 * k;
  const by = z * 0.105;
  const bx = z / 2;

  return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id="parchment" cx="50%" cy="45%" r="62%">
          <Stop offset="0" stopColor="#F6E7C1" />
          <Stop offset="0.65" stopColor="#E6CC93" />
          <Stop offset="1" stopColor="#B8864A" />
        </RadialGradient>
        <RadialGradient id="stain" cx="50%" cy="50%" r="50%">
          <Stop offset="0.7" stopColor="#8A5A2B" stopOpacity="0" />
          <Stop offset="0.92" stopColor="#8A5A2B" stopOpacity="0.18" />
          <Stop offset="1" stopColor="#8A5A2B" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      {/* Parchment with burnt edges and coffee stains */}
      <Path d={torn} fill="#3B2410" opacity={0.35} transform={`translate(${3 * k},${4 * k})`} />
      <Path d={torn} fill="url(#parchment)" stroke="#6B4220" strokeWidth={2 * k} />
      <Path d={torn} fill="none" stroke="#8A5A2B" strokeWidth={10 * k} opacity={0.18} />
      <Circle cx={z * 0.5} cy={z * 0.9} r={30 * k} fill="url(#stain)" opacity={0.6} />

      {/* Title cartouche */}
      <Path
        d={`M${bx - bw / 2},${by - bh / 2} H${bx + bw / 2} l${-10 * k},${bh / 2} l${10 * k},${bh / 2} H${bx - bw / 2} l${10 * k},${-bh / 2} Z`}
        fill="#EAD3A0"
        stroke={ink}
        strokeWidth={1.4 * k}
      />
      <SvgText x={bx} y={by + 6 * k} fill={ink} fontSize={17 * k} fontFamily={fonts.serifItalic} textAnchor="middle">
        {title}
      </SvgText>

      {/* Graticule, waves, land */}
      <Path d={graticule.join('')} stroke={ink} strokeWidth={0.6 * k} opacity={0.18} />
      <Rect x={left} y={top} width={w} height={h} fill="none" stroke={ink} strokeWidth={1.2 * k} opacity={0.45} />
      <Path d={waves} stroke={ink} strokeWidth={1.1 * k} fill="none" opacity={0.35} />
      <Path d={land.coast} fill={ink} opacity={0.85} />
      <Path d={land.fill} fill="#D4B477" />
      <Path d={land.fill} fill="#8E6A2E" opacity={0.12} transform={`translate(${0.8 * k},${0.8 * k})`} />
      {/* Mountains */}
      <Path d={mountains} stroke={ink} strokeWidth={1.1 * k} fill="none" strokeLinejoin="round" opacity={0.8} />

      {/* Sea serpent */}
      <Path
        d={`M${serpent.x - 22 * k},${serpent.y} q${5 * k},${-14 * k} ${10 * k},0 q${5 * k},${-14 * k} ${10 * k},0 q${5 * k},${-14 * k} ${10 * k},0 q${4 * k},${-10 * k} ${12 * k},${-8 * k}`}
        stroke="#2F5D50"
        strokeWidth={3 * k}
        fill="none"
        strokeLinecap="round"
      />
      <Circle cx={serpent.x + 21 * k} cy={serpent.y - 9 * k} r={1.4 * k} fill={ink} />
      <SvgText x={serpent.x} y={serpent.y + 14 * k} fill={ink} fontSize={9 * k} fontFamily={fonts.serifItalic} textAnchor="middle" opacity={0.75}>
        Hic sunt dracones
      </SvgText>

      {/* Ship */}
      <G transform={`translate(${ship.x},${ship.y}) scale(${k})`}>
        <Path d="M-16,0 L16,0 L11,8 L-11,8 Z" fill="#5C3A1A" />
        <Path d="M0,0 V-24" stroke="#5C3A1A" strokeWidth={1.6} />
        <Path d="M1,-22 L14,-6 L1,-6 Z" fill="#F3E6C8" stroke="#5C3A1A" strokeWidth={0.8} />
        <Path d="M-1,-20 L-12,-6 L-1,-6 Z" fill="#F3E6C8" stroke="#5C3A1A" strokeWidth={0.8} />
        <Path d="M0,-24 L7,-27 L0,-29" fill="#141414" />
      </G>

      {/* Routes from the LFK to where alumni went */}
      {routes.map((m) => {
        const b = at(m.ll[0], m.ll[1]);
        const mx = (x.x + b.x) / 2;
        const my = Math.min(x.y, b.y) - Math.abs(b.x - x.x) * 0.22 - 8 * k;
        return (
          <G key={m.key}>
            <Path d={`M${x.x},${x.y} Q${mx},${my} ${b.x},${b.y}`} stroke={red} strokeWidth={1.3 * k} strokeDasharray={`${5 * k} ${4 * k}`} fill="none" opacity={0.75} />
            <Circle cx={b.x} cy={b.y} r={3 * k} fill="#F6E7C1" stroke={ink} strokeWidth={1.2 * k} />
          </G>
        );
      })}

      {/* X marks the spot */}
      <Circle cx={x.x} cy={x.y} r={xr * 1.7} fill="none" stroke={red} strokeWidth={1.4 * k} strokeDasharray={`${3 * k} ${2 * k}`} />
      <Line x1={x.x - xr} y1={x.y - xr} x2={x.x + xr} y2={x.y + xr} stroke={red} strokeWidth={4.5 * k} strokeLinecap="round" />
      <Line x1={x.x + xr} y1={x.y - xr} x2={x.x - xr} y2={x.y + xr} stroke={red} strokeWidth={4.5 * k} strokeLinecap="round" />
      <Rect x={x.x - 62 * k} y={x.y + xr * 2.1} width={124 * k} height={20 * k} rx={3 * k} fill="#F3E2B6" stroke={ink} strokeWidth={0.8 * k} opacity={0.95} />
      <SvgText x={x.x} y={x.y + xr * 2.1 + 14 * k} fill={red} fontSize={12.5 * k} fontFamily={fonts.serifItalic} textAnchor="middle">
        {label}
      </SvgText>

      {/* Compass rose */}
      <G opacity={0.85}>
        <Circle cx={cx} cy={cy} r={cr} fill="none" stroke={ink} strokeWidth={1 * k} />
        <Circle cx={cx} cy={cy} r={cr * 0.72} fill="none" stroke={ink} strokeWidth={0.6 * k} strokeDasharray={`${2 * k} ${2 * k}`} />
        <Path d={`M${cx},${cy - cr * 1.25} L${cx + cr * 0.2},${cy} L${cx},${cy + cr * 1.25} L${cx - cr * 0.2},${cy} Z`} fill={ink} />
        <Path d={`M${cx - cr * 1.25},${cy} L${cx},${cy - cr * 0.2} L${cx + cr * 1.25},${cy} L${cx},${cy + cr * 0.2} Z`} fill="#8A5A2B" />
        <Path d={`M${cx - cr * 0.7},${cy - cr * 0.7} L${cx + cr * 0.1},${cy - cr * 0.1} L${cx + cr * 0.7},${cy + cr * 0.7} L${cx - cr * 0.1},${cy + cr * 0.1} Z`} fill="#A0784A" opacity={0.7} />
        <Path d={`M${cx + cr * 0.7},${cy - cr * 0.7} L${cx + cr * 0.1},${cy + cr * 0.1} L${cx - cr * 0.7},${cy + cr * 0.7} L${cx - cr * 0.1},${cy - cr * 0.1} Z`} fill="#A0784A" opacity={0.7} />
        <Circle cx={cx} cy={cy} r={3 * k} fill={red} />
        <SvgText x={cx} y={cy - cr * 1.35} fill={ink} fontSize={11 * k} fontFamily={fonts.semibold} textAnchor="middle">
          N
        </SvgText>
      </G>
    </Svg>
  );
}
