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
  const mark = <Image source={onDark ? badge : emblem} style={{ width: size, height: size }} contentFit="contain" accessibilityLabel="ALFK Alumni" />;
  if (lang !== 'lb' && lang !== 'kw') return mark;
  // Lebanese: a little cedar on the emblem; Kuwaiti: the Kuwait Towers.
  return (
    <View style={{ width: size, height: size }}>
      {mark}
      <View style={{ position: 'absolute', right: -size * 0.1, bottom: -size * 0.06 }}>
        {lang === 'kw' ? <KuwaitTowers size={size * 0.46} /> : <Cedar size={size * 0.46} />}
      </View>
    </View>
  );
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
  const lockupImg = <Image source={onDark ? lockupLight : lockup} style={{ width: height * ratio, height }} contentFit="contain" accessibilityLabel="ALFK Alumni — Lycée Français de Koweït" />;
  if (lang !== 'lb' && lang !== 'kw') return lockupImg;
  // Lebanese: the cedar beside the name; Kuwaiti: the Kuwait Towers.
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: height * 0.08 }}>
      {lockupImg}
      {lang === 'kw' ? <KuwaitTowers size={height * 0.62} /> : <Cedar size={height * 0.62} />}
    </View>
  );
}

/** Large emblem for hero spots (404, sign-in on phones). */
export function LogoFull({ size = 220, onDark }: { size?: number; onDark?: boolean }) {
  return <LogoMark size={size} onDark={onDark} />;
}

/** The cedar of the Lebanese flag, on a white round (hidden Lebanese language). */
export function Cedar({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel="🇱🇧">
      <Circle cx={50} cy={50} r={48} fill="#FFFFFF" stroke="#ED1C24" strokeWidth={4} />
      <Path d="M50 14 L62 30 H56 L68 44 H60 L74 58 H64 L80 72 H20 L36 58 H26 L40 44 H32 L44 30 H38 Z" fill="#00A651" />
      <Rect x={46} y={72} width={8} height={14} rx={1.5} fill="#00A651" />
    </Svg>
  );
}

/** The Kuwait Towers on a white round edged in the flag's green (hidden Kuwaiti language). */
export function KuwaitTowers({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel="🇰🇼">
      <Circle cx={50} cy={50} r={48} fill="#FFFFFF" stroke="#007A3D" strokeWidth={4} />
      {/* main tower: two spheres */}
      <Path d="M44 86 L47 16 L49 16 L52 86 Z" fill="#B8C4CF" />
      <Circle cx={48} cy={44} r={10} fill="#1C5D8C" />
      <Circle cx={48} cy={30} r={5.5} fill="#1C5D8C" />
      {/* second tower: one sphere */}
      <Path d="M62 86 L64.5 34 L66.5 34 L69 86 Z" fill="#B8C4CF" />
      <Circle cx={65.5} cy={56} r={7} fill="#1C5D8C" />
      {/* third, the needle */}
      <Path d="M30 86 L32 46 L34 86 Z" fill="#B8C4CF" />
      <Rect x={22} y={84} width={56} height={4} rx={2} fill="#CE1126" />
    </Svg>
  );
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
