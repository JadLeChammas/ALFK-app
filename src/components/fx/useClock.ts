import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';

/**
 * Seconds elapsed while running, re-rendering at most `fps` times per second.
 * Paused (keeping its time) while `running` is false, e.g. scrolled off screen;
 * frozen at `still` when the OS asks for reduced motion.
 */
export function useClock({ running = true, fps = 30, still = 1 }: { running?: boolean; fps?: number; still?: number } = {}) {
  const reduced = useReducedMotion();
  const [t, setT] = useState(0);
  const elapsed = useRef(0);
  const active = running && !reduced;

  useEffect(() => {
    if (!active) return;
    const origin = performance.now() - elapsed.current * 1000;
    let raf = 0;
    let last = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (now - last < 1000 / fps) return;
      last = now;
      elapsed.current = (now - origin) / 1000;
      setT(elapsed.current);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [active, fps]);

  return reduced ? still : t;
}
