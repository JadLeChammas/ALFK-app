import { useEffect, useRef, useState } from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

/** Counts up to `value` with an ease-out — after Magic UI's Number Ticker. */
export function NumberTicker({
  value,
  duration = 1400,
  delay = 0,
  locale = 'fr-FR',
  prefix = '',
  suffix = '',
  style,
}: {
  value: number;
  duration?: number;
  delay?: number;
  locale?: string;
  prefix?: string;
  suffix?: string;
  style?: StyleProp<TextStyle>;
}) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(reduced ? value : 0);
  const from = useRef(0);

  useEffect(() => {
    if (reduced) return;
    const start = from.current;
    let raf = 0;
    let t0 = 0;
    const timer = setTimeout(() => {
      const frame = (now: number) => {
        if (!t0) t0 = now;
        const p = Math.min(1, (now - t0) / duration);
        const eased = 1 - Math.pow(1 - p, 4);
        const v = Math.round(start + (value - start) * eased);
        setShown(v);
        from.current = v;
        if (p < 1) raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    }, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [value, duration, delay, reduced]);

  return (
    <Text style={[{ fontVariant: ['tabular-nums'] }, style]}>
      {prefix}
      {(reduced ? value : shown).toLocaleString(locale)}
      {suffix}
    </Text>
  );
}
