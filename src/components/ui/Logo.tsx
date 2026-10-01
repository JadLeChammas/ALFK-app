import { Image } from 'expo-image';
import { View } from 'react-native';

import { useI18n } from '@/i18n';
import { fonts } from '@/theme/tokens';
import { Txt } from './Txt';

/** Transparent silver logo: the emblem alone (small sizes) and the full logo with « ALFK ». */
const emblem = require('@/assets/images/logo-emblem-clear.png');
const full = require('@/assets/images/logo-alfk-clear.png');
const FULL_RATIO = 330 / 442;

/** The silver emblem (Eiffel Tower and Kuwait Towers in a ring), no background. */
export function LogoMark({ size = 40 }: { size?: number }) {
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
        {!compact && <Txt variant="caption" style={{ fontSize: 9, letterSpacing: 1.4, ...(light ? { color: '#C8D3E5' } : null) }}>ALFK · KOWEÏT</Txt>}
      </View>
    </View>
  );
}

/** Full logo with « ALFK » and the Amicale's name; `size` is its height. */
export function LogoFull({ size = 220 }: { size?: number }) {
  return <Image source={full} style={{ width: size * FULL_RATIO, height: size }} contentFit="contain" accessibilityLabel="Amicale LFK" />;
}
