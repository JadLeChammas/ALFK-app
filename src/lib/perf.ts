import { Platform } from 'react-native';

/**
 * Keeps the decorative animations (globe, world map, floating lines) from hogging a phone.
 *
 *   • LITE — a touch screen or a narrow window: the animations draw fewer frames and fewer dots.
 *   • userBusy() — the person is scrolling or touching the screen right now: the animations hold
 *     their current frame for a moment, so taps and scrolling always get through first.
 */
const web = Platform.OS === 'web' && typeof window !== 'undefined';

export const LITE = web && (!!window.matchMedia?.('(pointer: coarse)').matches || window.innerWidth < 768);

let busyUntil = 0;
if (web) {
  const mark = () => {
    busyUntil = performance.now() + 700;
  };
  // Capture phase: also catches scrolling inside the app's scroll views (scroll events don't bubble).
  for (const type of ['scroll', 'touchstart', 'touchmove', 'wheel', 'pointerdown']) {
    window.addEventListener(type, mark, { passive: true, capture: true });
  }
}

export const userBusy = () => web && performance.now() < busyUntil;

/** Frames per second for a decorative animation: fewer on phones. */
export const animFps = (fps: number) => (LITE ? Math.min(fps, 15) : fps);
