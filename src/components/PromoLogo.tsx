import { Image } from 'expo-image';
import { View } from 'react-native';

import { Txt } from '@/components/ui/Txt';
import { brand, fonts } from '@/theme/tokens';

const EMBLEM = require('@/assets/images/logo-emblem.png');
const GOLD = '#C9A13B';

/**
 * A promo's logo: the ALFK emblem with the year under it, between two gold dashes (« — 2026 — »),
 * drawn for every year — so each promo, future ones included, has its own, always sharp.
 */
export function PromoLogo({ year, size = 120 }: { year: number; size?: number }) {
  const dash = Math.round(size * 0.12);
  return (
    <View style={{ width: size, alignItems: 'center', gap: Math.round(size * 0.04), padding: Math.round(size * 0.08), borderRadius: Math.round(size * 0.18), backgroundColor: '#fff' }}>
      <Image source={EMBLEM} style={{ width: size * 0.84, height: size * 0.84 }} contentFit="contain" accessibilityLabel={`Promo ${year}`} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Math.round(size * 0.05) }}>
        <View style={{ width: dash, height: 2, backgroundColor: GOLD }} />
        <Txt style={{ fontFamily: fonts.serif, fontSize: Math.round(size * 0.17), lineHeight: Math.round(size * 0.2), color: brand.navy }}>{year}</Txt>
        <View style={{ width: dash, height: 2, backgroundColor: GOLD }} />
      </View>
    </View>
  );
}
