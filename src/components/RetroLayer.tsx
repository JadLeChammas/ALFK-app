import { useEffect } from 'react';
import { Platform, Pressable, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';

import { countVisit, useVisitCount } from '@/data/counter';
import { useI18n } from '@/i18n';
import { KONAMI, useToggleRetro } from '@/lib/retro';
import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';
import { retroFonts } from '@/theme/tokens';
import { Marquee } from './fx/Marquee';
import { Txt } from './ui/Txt';

/**
 * The hidden retro mode's extras, drawn over the app: scrolling banner, visit counter, an
 * « under construction » sign and twinkling stars. Also listens for the Konami code on keyboards.
 */
export function RetroLayer() {
  const { retro } = useTheme();
  const toggle = useToggleRetro();

  // Every visit counts, retro or not, so the number means something when it shows.
  useEffect(() => countVisit(), []);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    let pos = 0;
    const onKey = (e: KeyboardEvent) => {
      const want = KONAMI[pos];
      pos = e.key === want || e.key.toLowerCase() === want ? pos + 1 : e.key === KONAMI[0] ? 1 : 0;
      if (pos === KONAMI.length) {
        pos = 0;
        toggle();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle]);

  if (!retro) return null;
  return <RetroExtras onExit={() => toggle(false)} />;
}

function RetroExtras({ onExit }: { onExit: () => void }) {
  const { d } = useI18n();
  const { isMobile } = useLayout();
  const insets = useSafeAreaInsets();
  const count = useVisitCount(true);
  // Above the phone tab bar; at the very bottom on larger screens.
  const bottom = isMobile ? insets.bottom + 66 : 0;
  return (
    <>
      <Twinkles />
      <View pointerEvents="box-none" style={{ position: 'absolute', right: 10, bottom: bottom + (isMobile ? 36 : 76), gap: 6, alignItems: 'flex-end', zIndex: 999 }}>
        <UnderConstruction label={d.retro.construction} />
        <View style={{ backgroundColor: '#000', borderWidth: 2, borderColor: '#C0C0C0', paddingHorizontal: 8, paddingVertical: 5, gap: 4 }}>
          <Txt style={{ color: '#00FF00', fontSize: 11, fontFamily: retroFonts.bold }}>{d.retro.visitor}</Txt>
          <Odometer value={count} />
        </View>
        <Pressable onPress={onExit} accessibilityRole="button" style={{ backgroundColor: '#C0C0C0', borderWidth: 2, borderTopColor: '#FFFFFF', borderLeftColor: '#FFFFFF', borderRightColor: '#404040', borderBottomColor: '#404040', paddingHorizontal: 10, paddingVertical: 4 }}>
          <Txt style={{ color: '#000', fontSize: 12, fontFamily: retroFonts.bold }}>{d.retro.exit}</Txt>
        </Pressable>
      </View>
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom, height: 28, backgroundColor: '#000080', justifyContent: 'center', borderTopWidth: 2, borderTopColor: '#FFFF00', zIndex: 998 }}>
        <Marquee speed={70} gap={60}>
          {[0, 1].map((k) => (
            <Txt key={k} style={{ color: '#FFFF00', fontSize: 14, fontFamily: retroFonts.bold }}>{d.retro.banner}</Txt>
          ))}
        </Marquee>
      </View>
    </>
  );
}

/** Six digits in little boxes, like the counters of personal pages around 2002. */
function Odometer({ value }: { value: number | null }) {
  const digits = (value === null ? '------' : String(value).padStart(6, '0')).split('');
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {digits.map((ch, i) => (
        <View key={i} style={{ width: 16, height: 22, backgroundColor: '#202020', borderWidth: 1, borderColor: '#606060', alignItems: 'center', justifyContent: 'center' }}>
          <Txt style={{ color: '#FFFFFF', fontSize: 15, lineHeight: 18, fontFamily: retroFonts.bold }}>{ch}</Txt>
        </View>
      ))}
    </View>
  );
}

function useBlink(period = 700, delay = 0) {
  const o = useSharedValue(1);
  useEffect(() => {
    o.value = withDelay(delay, withRepeat(withTiming(0.15, { duration: period, easing: Easing.linear }), -1, true));
    return () => cancelAnimation(o);
  }, [o, period, delay]);
  return useAnimatedStyle(() => ({ opacity: o.value }));
}

function UnderConstruction({ label }: { label: string }) {
  const blink = useBlink(450);
  return (
    <Animated.View style={blink} pointerEvents="none">
      <Svg width={150} height={44}>
        <Rect x={0} y={0} width={150} height={44} fill="#FFD400" stroke="#000" strokeWidth={2} />
        {Array.from({ length: 10 }, (_, i) => (
          <Polygon key={i} points={`${i * 16 - 8},44 ${i * 16 + 2},44 ${i * 16 + 14},34 ${i * 16 + 4},34`} fill="#000" />
        ))}
        <Polygon points="12,30 20,8 28,30" fill="#FF6600" stroke="#000" strokeWidth={1} />
        <Path d="M14 24 H26" stroke="#FFF" strokeWidth={2} />
        <SvgText x={90} y={22} fill="#000" fontSize={12} fontWeight="bold" textAnchor="middle">
          {label}
        </SvgText>
      </Svg>
    </Animated.View>
  );
}

const STARS: [string, string, number][] = [
  ['8%', '12%', 0],
  ['85%', '9%', 300],
  ['46%', '4%', 650],
  ['92%', '48%', 150],
  ['30%', '62%', 500],
  ['70%', '78%', 900],
];

function Twinkles() {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 997 }}>
      {STARS.map(([left, top, delay], i) => (
        <Star key={i} left={left} top={top} delay={delay} />
      ))}
    </View>
  );
}

function Star({ left, top, delay }: { left: string; top: string; delay: number }) {
  const blink = useBlink(600, delay);
  return (
    <Animated.View style={[{ position: 'absolute', left: left as `${number}%`, top: top as `${number}%` }, blink]}>
      <Svg width={22} height={22} viewBox="0 0 24 24">
        <Path d="M12 0 L14.5 9.5 L24 12 L14.5 14.5 L12 24 L9.5 14.5 L0 12 L9.5 9.5 Z" fill="#FFFF66" stroke="#FF00CC" strokeWidth={0.8} />
      </Svg>
    </Animated.View>
  );
}
