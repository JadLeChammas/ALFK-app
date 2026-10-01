import { useEffect, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';

/**
 * Seconds elapsed since mount, re-rendering at most `fps` times per second.
 * Frozen (returns `still`) when the OS asks for reduced motion or when `running` is false.
 */
export function useClock({ running = true, fps = 30, still = 1 }: { running?: boolean; fps?: number; still?: number } = {}) {
  const reduced = useReducedMotion();
  const [t, setT] = useState(0);
  const active = running && !reduced;

  useEffect(() => {
    if (!active) return;
    const origin = performance.now();
    let raf = 0;
    let last = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (now - last < 1000 / fps) return;
      last = now;
      setT((now - origin) / 1000);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [active, fps]);

  return active ? t : still;
}
