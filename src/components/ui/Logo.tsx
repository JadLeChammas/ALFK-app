import { Image } from 'expo-image';
import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { useI18n } from '@/i18n';
import { fonts } from '@/theme/tokens';
import { Txt } from './Txt';

/** Transparent silver logo: the emblem alone (small sizes) and the full logo with « ALFK ». */
const emblem = require('@/assets/images/logo-emblem-clear.png');
const full = require('@/assets/images/logo-alfk-clear.png');
const FULL_RATIO = 330 / 442;

/** The silver emblem (Eiffel Tower and Kuwait Towers in a ring), no background. */
export function LogoMark({ size = 40 }: { size?: number }) {
  const { lang } = useI18n();
  if (lang === 'pirate') return <PirateHat size={size} />;
  return <Image source={emblem} style={{ width: size, height: size }} contentFit="contain" accessibilityLabel="Amicale LFK" />;
}

/** Emblem + name. `light` = on the navy sidebar. */
export function LogoLockup({ compact, light }: { compact?: boolean; light?: boolean }) {
  const { d } = useI18n();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <LogoMark size={compact ? 34 : 40} />
      <View>
        <Txt style={{ fontFamily: fonts.serif, fontSize: compact ? 22 : 24, lineHeight: compact ? 26 : 28, ...(light ? { color: '#FFFFFF' } : null) }}>{d.app.name}</Txt>
        {!compact && <Txt variant="caption" style={{ fontSize: 9, letterSpacing: 1.4, ...(light ? { color: '#E7ECF2' } : null) }}>ALFK · KOWEÏT</Txt>}
      </View>
    </View>
  );
}

/** Full logo with « ALFK » and the Amicale's name; `size` is its height. */
export function LogoFull({ size = 220 }: { size?: number }) {
  const { lang } = useI18n();
  if (lang === 'pirate') return <PirateHat size={size * 0.8} />;
  return <Image source={full} style={{ width: size * FULL_RATIO, height: size }} contentFit="contain" accessibilityLabel="Amicale LFK" />;
}

/** Easter egg: in Pirate, the logo becomes a tricorne with a skull and crossbones. */
export function PirateHat({ size = 40 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel="Amicale LFK">
      <Path d="M20 60 Q20 20 50 16 Q80 20 80 60 Q50 50 20 60 Z" fill="#141414" />
      <Path d="M4 62 Q30 44 50 50 Q70 44 96 62 Q90 80 50 74 Q10 80 4 62 Z" fill="#1E1E1E" stroke="#D4A017" strokeWidth={2.5} />
      <Path d="M22 58 Q50 48 78 58" stroke="#D4A017" strokeWidth={2.5} fill="none" />
      <Path d="M38 44 L62 56 M62 44 L38 56" stroke="#F5F0E6" strokeWidth={3.2} strokeLinecap="round" />
      <Circle cx={50} cy={34} r={9} fill="#F5F0E6" />
      <Rect x={45} y={38} width={10} height={7} rx={2} fill="#F5F0E6" />
      <Circle cx={46.5} cy={33} r={2.2} fill="#141414" />
      <Circle cx={53.5} cy={33} r={2.2} fill="#141414" />
      <Path d="M48 42 V45 M50 42 V45 M52 42 V45" stroke="#141414" strokeWidth={0.9} />
    </Svg>
  );
}
