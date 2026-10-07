import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import Svg, { Circle, Defs, G, Line, Path, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { LFK_LL } from '@/data/countries';
import { globeDots, mapDots } from '@/data/worldDots';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { brand, fonts } from '@/theme/tokens';
import { useOnScreen } from './useOnScreen';

/**
 * React Native port of 21st.dev "Interactive Globe" (dev.yadhakim).
 * Web: drawn on a <canvas> straight from the animation loop, like the original — no React render per
 * frame (the SVG version rebuilt thousands of dot paths 30 times a second, which made phones lag).
 * Native: the same projection runs per frame into a handful of SVG paths.
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
/** Depth bands for the land dots, front to back: lower bound of the band, its typical depth (dot size) and opacity. */
const BANDS = [
  { from: 0.75, depth: 0.87, opacity: 0.85 },
  { from: 0.5, depth: 0.62, opacity: 0.7 },
  { from: 0.28, depth: 0.39, opacity: 0.52 },
  { from: -1, depth: 0.14, opacity: 0.3 },
];

const toVec = (lat: number, lng: number): Vec => {
  const la = lat * DEG;
  const lo = lng * DEG;
  return [Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)];
};

const dot = (x: number, y: number, r: number) =>
  `M${(x - r).toFixed(1)},${y.toFixed(1)}a${r.toFixed(2)},${r.toFixed(2)} 0 1,0 ${(2 * r).toFixed(2)},0a${r.toFixed(2)},${r.toFixed(2)} 0 1,0 ${(-2 * r).toFixed(2)},0`;

/** Web: the browser keeps vertical swipes (page scroll) and hands sideways ones to the globe. */
const PAN_Y = (Platform.OS === 'web' ? { touchAction: 'pan-y' } : {}) as object;

const shortest = (from: number, to: number) => {
  let d = (to - from) % (2 * Math.PI);
  if (d > Math.PI) d -= 2 * Math.PI;
  if (d < -Math.PI) d += 2 * Math.PI;
  return d;
};

const TAU = Math.PI * 2;

/** What the canvas painter needs from the latest render (kept in a ref, read by the loop). */
type Paint = {
  size: number;
  land: Vec[];
  origin: Vec;
  targets: (GlobeMarker & { v: Vec })[];
  onDark: boolean;
  arcs: boolean;
  labels: boolean;
  originLabel: string;
  reduced: boolean;
};

/** Web: one frame of the globe on a canvas — same geometry, colours and layers as the SVG version. */
function paintCanvas(cv: HTMLCanvasElement, p: Paint, phi: number, theta: number, t: number) {
  const { size } = p;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const px = Math.round(size * dpr);
  if (cv.width !== px) {
    cv.width = px;
    cv.height = px;
  }
  const ctx = cv.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, size, size);

  const c = size / 2;
  const R = size * 0.38;
  const fov = R * 3.4;
  const limb = R / fov;
  const rim = R / Math.sqrt(1 - limb * limb);
  const k = Math.max(0.6, size / 460);
  const lk = Math.min(1.4, k);
  const cp = Math.cos(phi);
  const sp = Math.sin(phi);
  const ct = Math.cos(theta);
  const st = Math.sin(theta);
  const project = (v: Vec, h = 1) => {
    const x1 = v[0] * cp + v[2] * sp;
    const z1 = -v[0] * sp + v[2] * cp;
    const y = v[1] * ct - z1 * st;
    const z = z1 * ct + v[1] * st;
    const s = fov / (fov - z * R * h);
    return { x: c + x1 * R * h * s, y: c - y * R * h * s, z };
  };
  const dotFill = p.onDark ? brand.sky : brand.blue;
  const red = p.onDark ? '#E05A5D' : brand.red;
  const labelFill = p.onDark ? 'rgba(231, 236, 242,0.75)' : 'rgba(14, 42, 71,0.7)';

  // rim
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(c, c, rim, 0, TAU);
  ctx.strokeStyle = p.onDark ? 'rgba(231, 236, 242,0.14)' : 'rgba(14, 42, 71,0.1)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // land dots: one path per depth band, filled back to front
  const bands = BANDS.map(() => new Path2D());
  const radii = BANDS.map(({ depth }) => (1 + depth * 0.8) * 0.72 * k);
  for (const v of p.land) {
    const x1 = v[0] * cp + v[2] * sp;
    const z1 = -v[0] * sp + v[2] * cp;
    const z = z1 * ct + v[1] * st;
    if (z <= limb) continue;
    const y = v[1] * ct - z1 * st;
    const s = fov / (fov - z * R);
    const depth = (z - limb) / (1 - limb);
    let b = 0;
    while (b < BANDS.length - 1 && depth <= BANDS[b].from) b++;
    const x = c + x1 * R * s;
    const yy = c - y * R * s;
    bands[b].moveTo(x + radii[b], yy);
    bands[b].arc(x, yy, radii[b], 0, TAU);
  }
  ctx.fillStyle = dotFill;
  for (let b = BANDS.length - 1; b >= 0; b--) {
    ctx.globalAlpha = b === 0 && p.onDark ? 0.9 : BANDS[b].opacity;
    ctx.fill(bands[b]);
  }

  // arcs from the LFK, each with its travelling light
  if (p.arcs) {
    const a = project(p.origin);
    p.targets.forEach((m, i) => {
      const b = project(m.v);
      if (a.z < limb - 0.3 && b.z < limb - 0.3) return;
      const mid: Vec = [(p.origin[0] + m.v[0]) / 2, (p.origin[1] + m.v[1]) / 2, (p.origin[2] + m.v[2]) / 2];
      const len = Math.hypot(...mid) || 1;
      const ctrl = project([mid[0] / len, mid[1] / len, mid[2] / len], 1.25);
      const group = a.z < limb && b.z < limb ? 0.35 : 1;
      ctx.globalAlpha = group * (m.active ? 0.9 : 0.45);
      ctx.strokeStyle = red;
      ctx.lineWidth = (m.active ? 1.8 : 1.2) * lk;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(ctrl.x, ctrl.y, b.x, b.y);
      ctx.stroke();
      if (!p.reduced) {
        const u = (Math.sin(t * 1.2 + i * 0.9) + 1) / 2;
        const qx = (1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * ctrl.x + u * u * b.x;
        const qy = (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * ctrl.y + u * u * b.y;
        ctx.globalAlpha = group;
        ctx.fillStyle = red;
        ctx.beginPath();
        ctx.arc(qx, qy, 2 * lk, 0, TAU);
        ctx.fill();
      }
    });
  }

  // markers: pulsing ring, dot, label for the biggest ones
  const ranked = [...p.targets].sort((x, y) => (y.weight ?? 0) - (x.weight ?? 0));
  const labelled = new Set(ranked.slice(0, size >= 380 ? 6 : 3).map((m) => m.key));
  p.targets.forEach((m, i) => {
    const q = project(m.v);
    if (q.z < limb) return;
    const group = Math.min(1, 0.3 + (q.z - limb) * 3);
    const pulse = Math.sin(t * 2 + i) * 0.5 + 0.5;
    const r0 = 2.5 * lk * (m.active ? 1.5 : 1);
    ctx.globalAlpha = group * (0.25 + pulse * 0.25);
    ctx.strokeStyle = red;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(q.x, q.y, r0 + 1.5 + pulse * 4 * lk, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = group;
    ctx.fillStyle = red;
    ctx.beginPath();
    ctx.arc(q.x, q.y, r0, 0, TAU);
    ctx.fill();
    if (p.labels && m.label && (m.active || labelled.has(m.key))) {
      ctx.fillStyle = m.active ? (p.onDark ? '#fff' : brand.navy) : labelFill;
      ctx.font = `${10 * Math.min(1.25, k)}px ${fonts.medium}`;
      ctx.fillText(m.label, q.x + 8, q.y + 3.5);
    }
  });

  // the LFK
  const o = project(p.origin);
  if (o.z > limb) {
    ctx.globalAlpha = Math.min(1, 0.3 + (o.z - limb) * 3);
    ctx.beginPath();
    ctx.arc(o.x, o.y, 4 * lk, 0, TAU);
    ctx.fillStyle = p.onDark ? '#fff' : brand.navy;
    ctx.fill();
    ctx.strokeStyle = red;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    if (p.labels) {
      ctx.font = `${11 * Math.min(1.25, k)}px ${fonts.semibold}`;
      ctx.fillText(p.originLabel, o.x + 9, o.y + 4);
    }
  }
  ctx.globalAlpha = 1;
}

const WEB = Platform.OS === 'web';

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
  const [box, onScreen] = useOnScreen();

  const land = useMemo(() => globeDots().map(([la, lo]) => toVec(la, lo)), []);
  const origin = useMemo(() => toVec(LFK_LL[0], LFK_LL[1]), []);
  const targets = useMemo(() => markers.map((m) => ({ ...m, v: toVec(m.ll[0], m.ll[1]) })), [markers]);

  const [view, setView] = useState({ phi: -35 * DEG, theta: 0.38, t: 0 });
  const focusKey = focus ? `${focus[0]},${focus[1]}` : '';
  const live = useRef({ phi: -35 * DEG, theta: 0.38, t: 0, focus: focus ?? null, focusKey, ignoredFocus: '', autoRotate, idleUntil: 0 });
  const drag = useRef({ active: false, dx: 0, dy: 0, phi0: 0, theta0: 0 });
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const paint = useRef<Paint | null>(null);
  const paintVersion = useRef(0);
  const start = useRef({ x: 0, y: 0 });

  useEffect(() => {
    live.current.focus = focus ?? null;
    live.current.focusKey = focusKey;
    live.current.autoRotate = autoRotate;
    // Web: what the canvas loop draws (a new version repaints even when the globe is still).
    paint.current = { size, land, origin, targets, onDark, arcs, labels, originLabel, reduced };
    paintVersion.current += 1;
  });

  // The animation loop only runs while the globe is on screen (and the tab visible): off screen it
  // used to re-render 30 times a second and slowed the whole page down.
  useEffect(() => {
    if (!onScreen) return;
    let raf = 0;
    let last = performance.now();
    let lastPaint = 0;
    let painted = '';
    let paintedVersion = -1;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = live.current;
      s.t += dt;
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
      if (WEB) {
        // Canvas: drawn every frame (about a millisecond for all the dots), no React render at all.
        const p = paint.current;
        const cv = canvas.current;
        if (!p || !cv || p.size <= 0) return;
        const t = reduced ? 0.8 : s.t;
        const key = `${s.phi.toFixed(4)}|${s.theta.toFixed(4)}|${t.toFixed(2)}`;
        if (key === painted && paintedVersion === paintVersion.current) return;
        painted = key;
        paintedVersion = paintVersion.current;
        paintCanvas(cv, p, s.phi, s.theta, t);
        return;
      }
      if (now - lastPaint >= 1000 / FPS) {
        lastPaint = now;
        const t = reduced ? 0.8 : s.t;
        // Nothing moved (reduced motion, no drag): skip the render.
        const key = `${s.phi.toFixed(4)}|${s.theta.toFixed(4)}|${t.toFixed(2)}`;
        if (key !== painted) {
          painted = key;
          setView({ phi: s.phi, theta: s.theta, t });
        }
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [reduced, onScreen]);

  type Touch = { nativeEvent: { pageX: number; pageY: number } };
  const onGrant = () => {
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

  // Rotation terms computed once per frame instead of once per dot.
  const cp = Math.cos(phi);
  const sp = Math.sin(phi);
  const ct = Math.cos(theta);
  const st = Math.sin(theta);
  const project = (v: Vec, h = 1) => {
    const x1 = v[0] * cp + v[2] * sp;
    const z1 = -v[0] * sp + v[2] * cp;
    const y = v[1] * ct - z1 * st;
    const z = z1 * ct + v[1] * st;
    const s = fov / (fov - z * R * h);
    return { x: c + x1 * R * h * s, y: c - y * R * h * s, z };
  };

  // Dots — depth bands (the canvas version sets alpha per dot); each band has one dot size, so the
  // circle arcs are written once per band and every dot only adds its position.
  const bands = BANDS.map(() => '');
  if (size > 0 && !WEB) {
    const tails = BANDS.map(({ depth }) => {
      const r = (1 + depth * 0.8) * 0.72 * k;
      return { r, tail: `a${r.toFixed(2)},${r.toFixed(2)} 0 1,0 ${(2 * r).toFixed(2)},0a${r.toFixed(2)},${r.toFixed(2)} 0 1,0 ${(-2 * r).toFixed(2)},0` };
    });
    for (const v of land) {
      const x1 = v[0] * cp + v[2] * sp;
      const z1 = -v[0] * sp + v[2] * cp;
      const z = z1 * ct + v[1] * st;
      if (z <= limb) continue;
      const y = v[1] * ct - z1 * st;
      const s = fov / (fov - z * R);
      const depth = (z - limb) / (1 - limb);
      let b = 0;
      while (b < BANDS.length - 1 && depth <= BANDS[b].from) b++;
      bands[b] += `M${(c + x1 * R * s - tails[b].r).toFixed(1)},${(c - y * R * s).toFixed(1)}${tails[b].tail}`;
    }
  }

  const dotFill = onDark ? brand.sky : brand.blue;
  const red = onDark ? '#E05A5D' : brand.red;
  const labelFill = onDark ? 'rgba(231, 236, 242,0.75)' : 'rgba(14, 42, 71,0.7)';
  const lk = Math.min(1.4, k);

  const arcEls: React.ReactNode[] = [];
  if (arcs && size > 0 && !WEB) {
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
  const markerEls = WEB ? [] : targets.map((m, i) => {
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
      <Animated.View style={[{ width: fixedSize ?? '100%', maxWidth: maxSize, aspectRatio: 1, alignSelf: 'center' }, style]} onLayout={fixedSize ? undefined : (e) => setMeasured(e.nativeEvent.layout.width)}>
        {size > 0 && <TreasureMap size={size} markers={markers} label={d.eggs.treasure} title={d.eggs.mapTitle} />}
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ alignSelf: 'center', width: fixedSize ?? '100%', maxWidth: maxSize }}>
    <View
      ref={box}
      style={[{ width: fixedSize ?? '100%', maxWidth: maxSize, aspectRatio: 1, alignSelf: 'center' }, PAN_Y, style]}
      onLayout={fixedSize ? undefined : (e) => setMeasured(e.nativeEvent.layout.width)}
      // Only a sideways drag turns the globe: a vertical swipe over it keeps scrolling the page (phones).
      onStartShouldSetResponderCapture={(e: Touch) => {
        start.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
        return false;
      }}
      onMoveShouldSetResponder={(e: Touch) => {
        const dx = e.nativeEvent.pageX - start.current.x;
        const dy = e.nativeEvent.pageY - start.current.y;
        return Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy);
      }}
      onResponderTerminationRequest={() => false}
      onResponderGrant={onGrant}
      onResponderMove={onMove}
      onResponderRelease={onRelease}
      onResponderTerminate={onRelease}>
      {size > 0 && WEB && <canvas ref={canvas} aria-hidden style={{ width: size, height: size, display: 'block' }} />}
      {size > 0 && !WEB && (
        <Svg width={size} height={size}>
          <Circle cx={c} cy={c} r={rim} fill="none" stroke={onDark ? 'rgba(231, 236, 242,0.14)' : 'rgba(14, 42, 71,0.1)'} strokeWidth={1} />
          {BANDS.map((band, b) => (
            <Path key={b} d={bands[b]} fill={dotFill} opacity={b === 0 && onDark ? 0.9 : band.opacity} />
          )).reverse()}
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
