import { useMemo, useRef, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';

import type { ContinentKey } from '@/data/types';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Stylized dot-matrix world map: 60 columns (6° of longitude) × 22 rows (6° of latitude, 78°N → 54°S).
 * Each row lists land segments as [startCol, endCol, continent].
 */
const K: Record<string, ContinentKey> = { N: 'north_america', S: 'south_america', E: 'europe', F: 'africa', A: 'asia', O: 'oceania' };
const ROWS: [number, number, string][][] = [
  [[10, 18, 'N'], [20, 26, 'N'], [42, 53, 'A']],
  [[2, 6, 'N'], [7, 19, 'N'], [21, 26, 'N'], [32, 35, 'E'], [36, 38, 'E'], [39, 59, 'A']],
  [[2, 19, 'N'], [22, 23, 'N'], [26, 26, 'E'], [31, 38, 'E'], [39, 58, 'A']],
  [[7, 20, 'N'], [29, 29, 'E'], [31, 38, 'E'], [39, 56, 'A']],
  [[9, 21, 'N'], [29, 38, 'E'], [39, 53, 'A']],
  [[9, 18, 'N'], [28, 37, 'E'], [38, 52, 'A'], [53, 53, 'A']],
  [[9, 17, 'N'], [28, 30, 'E'], [31, 36, 'E'], [37, 50, 'A'], [51, 51, 'A'], [52, 53, 'A']],
  [[10, 16, 'N'], [28, 34, 'F'], [35, 39, 'A'], [40, 50, 'A']],
  [[11, 13, 'N'], [16, 16, 'N'], [27, 35, 'F'], [36, 39, 'A'], [41, 50, 'A']],
  [[12, 15, 'N'], [16, 16, 'N'], [27, 36, 'F'], [37, 39, 'A'], [42, 44, 'A'], [45, 48, 'A']],
  [[14, 15, 'N'], [27, 37, 'F'], [38, 38, 'A'], [42, 43, 'A'], [46, 47, 'A'], [50, 50, 'A']],
  [[16, 19, 'S'], [28, 37, 'F'], [43, 43, 'A'], [46, 47, 'A'], [50, 50, 'A']],
  [[17, 21, 'S'], [31, 36, 'F'], [46, 49, 'A']],
  [[16, 24, 'S'], [31, 36, 'F'], [47, 52, 'A'], [53, 55, 'O']],
  [[17, 24, 'S'], [32, 36, 'F'], [50, 50, 'A']],
  [[17, 23, 'S'], [32, 36, 'F'], [37, 38, 'F'], [50, 54, 'O']],
  [[18, 23, 'S'], [32, 35, 'F'], [37, 37, 'F'], [49, 55, 'O']],
  [[18, 22, 'S'], [32, 35, 'F'], [49, 55, 'O']],
  [[18, 21, 'S'], [33, 34, 'F'], [49, 50, 'O'], [52, 55, 'O']],
  [[17, 20, 'S'], [54, 54, 'O'], [58, 59, 'O']],
  [[17, 19, 'S'], [58, 58, 'O']],
  [[17, 18, 'S']],
];

export const MAP_COLS = 60;
export const MAP_ROWS = ROWS.length;

/** Continent under a map cell, falling back to the nearest land dot within one cell. */
function continentAt(col: number, row: number): ContinentKey | null {
  for (const [dc, dr] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
    const seg = ROWS[row + dr]?.find(([a, b]) => col + dc >= a && col + dc <= b);
    if (seg) return K[seg[2]];
  }
  return null;
}

export function WorldDots({
  selected,
  onSelect,
  pins = [],
}: {
  selected?: ContinentKey | null;
  onSelect?: (c: ContinentKey) => void;
  pins?: { col: number; row: number; count: number; active?: boolean }[];
}) {
  const { colors } = useTheme();
  const ref = useRef<View>(null);
  const [w, setW] = useState(0);
  const [hover, setHover] = useState<ContinentKey | null>(null);
  const dots = useMemo(() => {
    const out: { c: number; r: number; k: ContinentKey }[] = [];
    ROWS.forEach((segs, r) => segs.forEach(([a, b, k]) => {
      for (let c = a; c <= b; c++) out.push({ c, r, k: K[k] });
    }));
    return out;
  }, []);
  const cell = w / MAP_COLS;
  const h = cell * MAP_ROWS;
  const maxPin = Math.max(1, ...pins.map((p) => p.count));

  // Hit-testing happens on the container (not on each SVG dot): react-native-svg does not deliver
  // per-shape presses reliably on web, and one handler beats 550.
  const toCell = (x: number, y: number) => (cell > 0 ? continentAt(Math.floor(x / cell), Math.floor(y / cell)) : null);
  const localPoint = (e: { nativeEvent: { locationX?: number; locationY?: number; clientX?: number; clientY?: number; pageX?: number; pageY?: number } }) => {
    if (Platform.OS === 'web') {
      const rect = (ref.current as unknown as HTMLElement).getBoundingClientRect();
      const ne = e.nativeEvent;
      const cx = ne.clientX ?? (ne.pageX ?? 0) - window.scrollX;
      const cy = ne.clientY ?? (ne.pageY ?? 0) - window.scrollY;
      return [cx - rect.left, cy - rect.top] as const;
    }
    return [e.nativeEvent.locationX ?? 0, e.nativeEvent.locationY ?? 0] as const;
  };

  const svg = w > 0 && (
    <Svg width={w} height={h} pointerEvents="none">
      {dots.map(({ c, r, k }) => {
        const isSel = selected === k;
        const isHover = hover === k;
        return (
          <Circle
            key={`${c}-${r}`}
            cx={c * cell + cell / 2}
            cy={r * cell + cell / 2}
            r={cell * (isSel ? 0.36 : 0.3)}
            fill={isSel ? colors.primary : isHover ? colors.silver : colors.borderStrong}
            opacity={selected && !isSel ? 0.55 : 1}
          />
        );
      })}
      {pins.map((p, i) => {
        const rr = cell * (0.55 + (p.count / maxPin) * 0.9);
        return (
          <G key={i}>
            <Circle cx={p.col * cell + cell / 2} cy={p.row * cell + cell / 2} r={rr * 1.9} fill={p.active ? colors.primary : colors.ink} opacity={0.12} />
            <Circle cx={p.col * cell + cell / 2} cy={p.row * cell + cell / 2} r={rr} fill={p.active ? colors.primary : colors.ink} stroke={colors.surface} strokeWidth={2} />
          </G>
        );
      })}
    </Svg>
  );

  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ width: '100%', height: h || 200 }}>
      {onSelect ? (
        <Pressable
          ref={ref}
          accessibilityRole="button"
          onPress={(e) => {
            const [x, y] = localPoint(e);
            const k = toCell(x, y);
            if (k) onSelect(k);
          }}
          style={{ width: '100%', height: '100%', ...(Platform.OS === 'web' ? ({ cursor: hover ? 'pointer' : 'default' } as object) : {}) }}
          {...(Platform.OS === 'web'
            ? ({
                onMouseMove: (e: { nativeEvent: { clientX: number; clientY: number } }) => {
                  const [x, y] = localPoint(e);
                  const k = toCell(x, y);
                  if (k !== hover) setHover(k);
                },
                onMouseLeave: () => setHover(null),
              } as object)
            : {})}>
          {svg}
        </Pressable>
      ) : (
        <View ref={ref}>{svg}</View>
      )}
    </View>
  );
}

/**
 * The same map on a dark (navy) background, with an arc from the lycée to every country
 * where former students study. Used on the public pages.
 */
export function WorldArcs({ origin, targets }: { origin: [number, number]; targets: { col: number; row: number; n: number }[] }) {
  const [w, setW] = useState(0);
  const dots = useMemo(() => ROWS.flatMap((segs, r) => segs.flatMap(([a, b]) => Array.from({ length: b - a + 1 }, (_, i) => [a + i, r] as const))), []);
  const cell = w / MAP_COLS;
  const h = cell * MAP_ROWS;
  const at = (c: number, r: number) => [c * cell + cell / 2, r * cell + cell / 2] as const;
  const [ox, oy] = at(origin[0], origin[1]);
  const max = Math.max(1, ...targets.map((t) => t.n));
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ width: '100%', height: h || 180 }} pointerEvents="none">
      {w > 0 && (
        <Svg width={w} height={h}>
          {dots.map(([c, r]) => (
            <Circle key={`${c}-${r}`} cx={c * cell + cell / 2} cy={r * cell + cell / 2} r={cell * 0.26} fill="#FFFFFF" opacity={0.16} />
          ))}
          {targets.map((t, i) => {
            const [tx, ty] = at(t.col, t.row);
            if (Math.abs(tx - ox) < 1 && Math.abs(ty - oy) < 1) return null;
            // A quadratic curve lifted above the straight line, higher for longer trips.
            const mx = (ox + tx) / 2;
            const my = (oy + ty) / 2 - Math.hypot(tx - ox, ty - oy) * 0.35;
            return (
              <G key={i}>
                <Path d={`M${ox},${oy} Q${mx},${my} ${tx},${ty}`} stroke="#C8D3E5" strokeWidth={1.4} fill="none" opacity={0.75} />
                <Circle cx={tx} cy={ty} r={cell * (0.35 + (t.n / max) * 0.5)} fill="#FFFFFF" />
              </G>
            );
          })}
          <Circle cx={ox} cy={oy} r={cell * 1.6} fill="#AE0000" opacity={0.3} />
          <Circle cx={ox} cy={oy} r={cell * 0.75} fill="#AE0000" stroke="#FFFFFF" strokeWidth={2} />
        </Svg>
      )}
    </View>
  );
}
