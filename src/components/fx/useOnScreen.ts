import { useEffect, useRef, useState } from 'react';
import { Platform, type View } from 'react-native';

/**
 * Whether the element is on screen right now and the browser tab is visible. Unlike `useInView`
 * (once), it turns false again when the element scrolls away, so continuous animations (globe,
 * map, hero autoplay) can pause instead of burning the main thread off screen.
 * Native screens: always true.
 */
export function useOnScreen<T extends View = View>(margin = '120px 0px') {
  const ref = useRef<T>(null);
  const [onScreen, setOnScreen] = useState(Platform.OS !== 'web');

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = ref.current as unknown as Element | null;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setOnScreen(true);
      return;
    }
    let intersecting = false;
    const update = () => setOnScreen(intersecting && document.visibilityState !== 'hidden');
    const io = new IntersectionObserver(
      (entries) => {
        intersecting = entries[entries.length - 1].isIntersecting;
        update();
      },
      { rootMargin: margin }
    );
    io.observe(node);
    document.addEventListener('visibilitychange', update);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', update);
    };
  }, [margin]);

  return [ref, onScreen] as const;
}
