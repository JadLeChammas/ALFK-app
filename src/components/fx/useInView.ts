import { useEffect, useRef, useState } from 'react';
import { Platform, type View } from 'react-native';

/**
 * Scroll-triggered visibility (motion's `useInView`, once): true the first time the element
 * crosses into the viewport. Web uses IntersectionObserver; native screens are short enough
 * that elements reveal on mount.
 */
export function useInView<T extends View = View>(margin = '0px 0px -12% 0px') {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(Platform.OS !== 'web');

  useEffect(() => {
    if (Platform.OS !== 'web' || inView) return;
    const node = ref.current as unknown as Element | null;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: margin }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [inView, margin]);

  return [ref, inView] as const;
}
