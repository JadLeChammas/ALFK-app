import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';
import { Txt } from './Txt';

type Datum = { label: string; value: number };

/** Vertical bars, single series. Hover/press a bar to see its value. */
export function BarChart({ data, height = 160, highlightLast = true }: { data: Datum[]; height?: number; highlightLast?: boolean }) {
  const { colors } = useTheme();
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const ticks = [max, Math.round(max / 2), 0];
  return (
    <View>
      <View style={{ flexDirection: 'row', height }}>
        <View style={{ justifyContent: 'space-between', paddingRight: 8, paddingBottom: 0 }}>
          {ticks.map((t, i) => (
            <Txt key={i} style={{ fontFamily: fonts.medium, fontSize: 10, color: colors.textSubtle }}>{t}</Txt>
          ))}
        </View>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 2, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          {[0, 0.5].map((f) => (
            <View key={f} style={{ position: 'absolute', left: 0, right: 0, top: f * height, height: 1, backgroundColor: colors.border, opacity: 0.6 }} />
          ))}
          {data.map((d, i) => {
            const isActive = active === i;
            const strong = isActive || (active === null && highlightLast && i === data.length - 1);
            return (
              <Pressable
                key={d.label + i}
                onHoverIn={() => setActive(i)}
                onHoverOut={() => setActive(null)}
                onPress={() => setActive(isActive ? null : i)}
                style={{ flex: 1, height: '100%', justifyContent: 'flex-end', alignItems: 'center' }}>
                {isActive && (
                  <View style={{ position: 'absolute', bottom: (d.value / max) * height + 6, backgroundColor: colors.ink, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, zIndex: 2, minWidth: 44, alignItems: 'center' }}>
                    <Txt style={{ color: colors.onInk, fontFamily: fonts.bold, fontSize: 11 }}>{d.value}</Txt>
                    <Txt style={{ color: colors.onInk, fontFamily: fonts.medium, fontSize: 9, opacity: 0.8 }}>{d.label}</Txt>
                  </View>
                )}
                <View
                  style={{
                    width: '70%',
                    maxWidth: 22,
                    height: Math.max(2, (d.value / max) * height),
                    backgroundColor: strong ? colors.chart[0] : colors.primarySoft,
                    borderTopLeftRadius: 4,
                    borderTopRightRadius: 4,
                  }}
                />
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={{ flexDirection: 'row', marginLeft: 24, marginTop: 6 }}>
        {data.map((d, i) => (
          <Txt key={i} numberOfLines={1} style={{ flex: 1, textAlign: 'center', fontFamily: fonts.medium, fontSize: 10, color: colors.textSubtle }}>
            {i % Math.ceil(data.length / 12) === 0 ? d.label : ''}
          </Txt>
        ))}
      </View>
    </View>
  );
}

/** Horizontal bars with labels and values — for ranked categories (countries, promos). */
export function HBarList({ data, max: maxProp, color }: { data: (Datum & { leading?: ReactNode })[]; max?: number; color?: string }) {
  const { colors } = useTheme();
  const max = maxProp ?? Math.max(1, ...data.map((d) => d.value));
  return (
    <View style={{ gap: 12 }}>
      {data.map((d) => (
        <View key={d.label} style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {d.leading}
            <Txt variant="small" numberOfLines={1} style={{ flex: 1 }}>{d.label}</Txt>
            <Txt variant="smallStrong">{d.value}</Txt>
          </View>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.surfaceAlt, overflow: 'hidden' }}>
            <View style={{ width: `${(d.value / max) * 100}%`, height: '100%', borderRadius: 3, backgroundColor: color ?? colors.chart[0] }} />
          </View>
        </View>
      ))}
    </View>
  );
}

/** Donut with legend; colors follow the entity in fixed order. */
export function Donut({ data, size = 140, centerLabel, centerValue }: { data: Datum[]; size?: number; centerLabel?: string; centerValue?: string }) {
  const { colors } = useTheme();
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  const stroke = 18;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const gap = 2;
  const offsets = data.map((_, i) => data.slice(0, i).reduce((a, x) => a + (x.value / total) * c, 0));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.surfaceAlt} strokeWidth={stroke} fill="none" />
          {data.map((d, i) => {
            const len = (d.value / total) * c;
            return (
              <Circle
                key={d.label}
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={colors.chart[i % colors.chart.length]}
                strokeWidth={stroke}
                fill="none"
                strokeDasharray={`${Math.max(0, len - gap)} ${c}`}
                strokeDashoffset={-offsets[i]}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            );
          })}
        </Svg>
        {centerValue && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
            <Txt variant="h2">{centerValue}</Txt>
            {centerLabel && <Txt variant="small" color="textMuted">{centerLabel}</Txt>}
          </View>
        )}
      </View>
      <View style={{ gap: 10, flex: 1, minWidth: 140 }}>
        {data.map((d, i) => (
          <View key={d.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: colors.chart[i % colors.chart.length] }} />
            <Txt variant="small" style={{ flex: 1 }}>{d.label}</Txt>
            <Txt variant="smallStrong">{d.value}</Txt>
            <Txt variant="small" color="textSubtle" style={{ width: 38, textAlign: 'right' }}>{Math.round((d.value / total) * 100)}%</Txt>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Cumulative line with soft area fill; press/hover shows the nearest point. */
export function AreaLine({ data, height = 140 }: { data: Datum[]; height?: number }) {
  const { colors } = useTheme();
  const [w, setW] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const min = Math.min(...data.map((d) => d.value));
  const pad = 6;
  const x = (i: number) => (data.length <= 1 ? 0 : (i / (data.length - 1)) * w);
  const y = (v: number) => pad + (1 - (v - min * 0.9) / (max - min * 0.9 || 1)) * (height - pad * 2);
  const line = data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(' ');
  const area = `${line} L${w},${height} L0,${height} Z`;
  const pick = (px: number) => setActive(Math.max(0, Math.min(data.length - 1, Math.round((px / (w || 1)) * (data.length - 1)))));
  return (
    <View>
      <View
        style={{ height }}
        onLayout={(e) => setW(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onResponderGrant={(e) => pick(e.nativeEvent.locationX)}
        onResponderMove={(e) => pick(e.nativeEvent.locationX)}
        {...({ onMouseMove: (e: { nativeEvent: { offsetX: number } }) => pick(e.nativeEvent.offsetX), onMouseLeave: () => setActive(null) } as object)}>
        {w > 0 && (
          <Svg width={w} height={height}>
            <Defs>
              <LinearGradient id="lfkArea" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.chart[0]} stopOpacity={0.22} />
                <Stop offset="1" stopColor={colors.chart[0]} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Path d={area} fill="url(#lfkArea)" />
            <Path d={line} stroke={colors.chart[0]} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
            {active !== null && (
              <>
                <Path d={`M${x(active)},0 L${x(active)},${height}`} stroke={colors.borderStrong} strokeWidth={1} strokeDasharray="3 3" />
                <Circle cx={x(active)} cy={y(data[active].value)} r={5} fill={colors.chart[0]} stroke={colors.surface} strokeWidth={2} />
              </>
            )}
          </Svg>
        )}
        {active !== null && w > 0 && (
          <View
            pointerEvents="none"
            style={{ position: 'absolute', top: 0, left: Math.min(Math.max(0, x(active) - 40), w - 90), backgroundColor: colors.ink, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
            <Txt style={{ color: colors.onInk, fontFamily: fonts.bold, fontSize: 11 }}>{data[active].value}</Txt>
            <Txt style={{ color: colors.onInk, fontFamily: fonts.medium, fontSize: 9, opacity: 0.8 }}>{data[active].label}</Txt>
          </View>
        )}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
        <Txt style={{ fontFamily: fonts.medium, fontSize: 10, color: colors.textSubtle }}>{data[0]?.label}</Txt>
        <Txt style={{ fontFamily: fonts.medium, fontSize: 10, color: colors.textSubtle }}>{data.at(-1)?.label}</Txt>
      </View>
    </View>
  );
}
