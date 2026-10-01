import { Image } from 'expo-image';
import { View } from 'react-native';

import { useI18n } from '@/i18n';
import { fonts } from '@/theme/tokens';
import { Txt } from './Txt';

const emblem = require('@/assets/images/logo-emblem.png');
const full = require('@/assets/images/logo-alfk.webp');

/** Silver emblem on its native black tile — reads well on both themes. */
export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.28, overflow: 'hidden', backgroundColor: '#000' }}>
      <Image source={emblem} style={{ width: '100%', height: '100%' }} contentFit="cover" />
    </View>
  );
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

export function LogoFull({ size = 220 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.12, overflow: 'hidden', backgroundColor: '#000' }}>
      <Image source={full} style={{ width: '100%', height: '100%' }} contentFit="cover" />
    </View>
  );
}
