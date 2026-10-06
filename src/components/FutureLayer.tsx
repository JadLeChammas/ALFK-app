import { useEffect } from 'react';
import { Platform, Pressable, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDialogs } from '@/components/ui/Dialogs';
import { useI18n } from '@/i18n';
import { eggs } from '@/lib/eggs';
import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';
import { FUTURE_NEON } from '@/theme/tokens';
import { Txt } from './ui/Txt';

/** ↓ ↓ ↑ ↑ → ← → ← Y Z on a keyboard (the Konami code turned upside down, for the future). */
export const FUTURE_CODE = ['ArrowDown', 'ArrowDown', 'ArrowUp', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'y', 'z'];

/** Switches the futuristic mode on or off, with a word about it. */
export function useToggleFuture() {
  const { future, setFuture } = useTheme();
  const { d } = useI18n();
  const { toast } = useDialogs();
  return (on = !future) => {
    setFuture(on);
    toast(on ? d.future.on : d.future.off);
  };
}

/**
 * The hidden futuristic mode (« ALFK 2077 »): neon colours and fonts (ThemeProvider), and over the app
 * a glowing grid, a slow scan line and a HUD tag. Switched on by the code above on a keyboard, or by
 * typing « 2077 » in a search box (phones).
 */
export function FutureLayer() {
  const { future } = useTheme();
  const toggle = useToggleFuture();

  useEffect(() => eggs.on('future', () => toggle()), [toggle]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    let pos = 0;
    const onKey = (e: KeyboardEvent) => {
      const want = FUTURE_CODE[pos];
      pos = e.key === want || e.key.toLowerCase() === want ? pos + 1 : e.key === FUTURE_CODE[0] ? 1 : 0;
      if (pos === FUTURE_CODE.length) {
        pos = 0;
        toggle();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle]);

  if (!future) return null;
  return <FutureExtras onExit={() => toggle(false)} />;
}

function FutureExtras({ onExit }: { onExit: () => void }) {
  const { d } = useI18n();
  const { isMobile } = useLayout();
  const insets = useSafeAreaInsets();
  const bottom = isMobile ? insets.bottom + 72 : 16;
  return (
    <>
      {/* A faint neon grid over everything (web), and a scan line sweeping down. */}
      {Platform.OS === 'web' && (
        <View
          pointerEvents="none"
          style={[
            { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 996 },
            {
              backgroundImage: `linear-gradient(${FUTURE_NEON}0D 1px, transparent 1px), linear-gradient(90deg, ${FUTURE_NEON}0D 1px, transparent 1px)`,
              backgroundSize: '44px 44px',
            } as object,
          ]}
        />
      )}
      <ScanLine />
      <View pointerEvents="box-none" style={{ position: 'absolute', right: 12, bottom, zIndex: 999, alignItems: 'flex-end', gap: 8 }}>
        <View pointerEvents="none" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, borderWidth: 1, borderColor: FUTURE_NEON, backgroundColor: 'rgba(3, 8, 20, 0.85)' }}>
          <Pulse />
          <Txt style={{ color: FUTURE_NEON, fontSize: 11, letterSpacing: 2 }}>{d.future.hud}</Txt>
        </View>
        <Pressable onPress={onExit} accessibilityRole="button" style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, borderWidth: 1, borderColor: '#B26BFF', backgroundColor: 'rgba(178, 107, 255, 0.15)' }}>
          <Txt style={{ color: '#E2CCFF', fontSize: 12, letterSpacing: 1 }}>{d.future.exit}</Txt>
        </Pressable>
      </View>
    </>
  );
}

function ScanLine() {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withRepeat(withTiming(1, { duration: 6000, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(y);
  }, [y]);
  const style = useAnimatedStyle(() => ({ top: `${y.value * 100}%` as `${number}%` }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: FUTURE_NEON, opacity: 0.18, zIndex: 997 }, Platform.OS === 'web' ? ({ boxShadow: `0 0 18px 4px ${FUTURE_NEON}55` } as object) : null, style]}
    />
  );
}

/** A small blinking « online » light in the HUD tag. */
function Pulse() {
  const o = useSharedValue(1);
  useEffect(() => {
    o.value = withRepeat(withTiming(0.2, { duration: 700 }), -1, true);
    return () => cancelAnimation(o);
  }, [o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[{ width: 7, height: 7, borderRadius: 4, backgroundColor: FUTURE_NEON }, style]} />;
}
