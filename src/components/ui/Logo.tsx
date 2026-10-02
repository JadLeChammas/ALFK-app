import { Image } from 'expo-image';
import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { useI18n } from '@/i18n';
import { fonts } from '@/theme/tokens';
import { Txt } from './Txt';

/**
 * ALFK Alumni logo (Eiffel Tower and Kuwait Towers in a gold ring, French ribbon).
 * Light surfaces use the original colours; on navy/dark surfaces (`onDark`) the emblem sits on a
 * white seal and the lettering turns white, so the navy tower and letters never disappear.
 */
const emblem = require('@/assets/images/logo-emblem.png');
const badge = require('@/assets/images/logo-emblem-badge.png');
const lockup = require('@/assets/images/logo-lockup.png');
const lockupLight = require('@/assets/images/logo-lockup-light.png');
const LOCKUP_RATIO = 630 / 240;
const LOCKUP_LIGHT_RATIO = 625 / 240;

/** The emblem alone (small sizes, app chrome when there is no room for the name). */
export function LogoMark({ size = 40, onDark }: { size?: number; onDark?: boolean }) {
  const { lang } = useI18n();
  if (lang === 'pirate') return <PirateHat size={size} />;
  return <Image source={onDark ? badge : emblem} style={{ width: size, height: size }} contentFit="contain" accessibilityLabel="ALFK Alumni" />;
}

/** Emblem + « ALFK · ALUMNI · LYCÉE FRANÇAIS DE KOWEÏT » side by side; `height` sets its size. */
export function Logo({ height = 40, onDark }: { height?: number; onDark?: boolean }) {
  const { lang } = useI18n();
  if (lang === 'pirate') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <PirateHat size={height} />
        <Txt style={{ fontFamily: fonts.serif, fontSize: height * 0.55, color: onDark ? '#FFFFFF' : undefined }}>ALFK</Txt>
      </View>
    );
  }
  const ratio = onDark ? LOCKUP_LIGHT_RATIO : LOCKUP_RATIO;
  return <Image source={onDark ? lockupLight : lockup} style={{ width: height * ratio, height }} contentFit="contain" accessibilityLabel="ALFK Alumni — Lycée Français de Koweït" />;
}

/** Large emblem for hero spots (404, sign-in on phones). */
export function LogoFull({ size = 220, onDark }: { size?: number; onDark?: boolean }) {
  return <LogoMark size={size} onDark={onDark} />;
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
