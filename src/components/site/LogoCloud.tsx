import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { Reveal } from '@/components/site/Reveal';
import { useTone } from '@/components/site/SiteFrame';
import { Txt } from '@/components/ui/Txt';
import { partnerLogo } from '@/data/partners';
import type { Institution } from '@/data/types';
import { openExternal } from '@/lib/links';
import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';

/**
 * The partners' logos scattered around a title — the public Partners page and the members' one.
 */

export function Eyebrow({ text }: { text: string }) {
  const t = useTone();
  return (
    <View style={{ gap: 10, alignItems: 'center' }}>
      <View style={{ width: 32, height: 3, backgroundColor: t.accent }} />
      <Txt style={{ fontFamily: fonts.medium, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: t.fg }}>{text}</Txt>
    </View>
  );
}

/**
 * Places around the title (percent of the area), in the order partners fill them: top corners,
 * sides, bottom corners, then the gaps between. A partner added by an admin takes the next place.
 */
const SLOTS: { left?: number; right?: number; top?: number; bottom?: number; size: number; tilt: number }[] = [
  { left: 4, top: 4, size: 1, tilt: -6 },
  { right: 5, top: 8, size: 0.9, tilt: 5 },
  { left: 0, top: 44, size: 0.85, tilt: 4 },
  { right: 0, top: 40, size: 1, tilt: -4 },
  { left: 12, bottom: 2, size: 0.9, tilt: 6 },
  { right: 13, bottom: 4, size: 0.85, tilt: -5 },
  { left: 24, top: 0, size: 0.7, tilt: 3 },
  { right: 25, top: 0, size: 0.75, tilt: -3 },
  { left: 27, bottom: 0, size: 0.7, tilt: -4 },
  { right: 28, bottom: 0, size: 0.7, tilt: 4 },
  { left: 13, top: 24, size: 0.65, tilt: 5 },
  { right: 14, top: 24, size: 0.65, tilt: -6 },
];

/** The partners' logos scattered around the page title, without tiles. */
export function LogoCloud({ partners, children }: { partners: Institution[]; children: ReactNode }) {
  const t = useTone();
  const { isMobile } = useLayout();
  const { scheme } = useTheme();
  const dark = scheme === 'dark';
  const base = isMobile ? 58 : 104;
  const shown = partners.slice(0, SLOTS.length);
  return (
    <View style={{ minHeight: isMobile ? 420 : 520, justifyContent: 'center', alignItems: 'center' }}>
      {shown.map((x, i) => {
        const slot = SLOTS[i];
        const size = Math.round(base * slot.size);
        const logo = partnerLogo(x);
        const pos = {
          ...(slot.left !== undefined && { left: `${slot.left}%` }),
          ...(slot.right !== undefined && { right: `${slot.right}%` }),
          ...(slot.top !== undefined && { top: `${slot.top}%` }),
          ...(slot.bottom !== undefined && { bottom: `${slot.bottom}%` }),
        } as const;
        const mark = logo ? (
          dark ? (
            // Dark page: on a white disc, so dark logos (Hi Dev's navy mark) stay visible.
            <View style={{ width: size * 1.28, height: size * 1.28, borderRadius: size, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
              <Image source={logo} style={{ width: size * 0.86, height: size * 0.86 }} contentFit="contain" accessibilityLabel={x.name} />
            </View>
          ) : (
            // « multiply » lets the page colour through a logo's own white background.
            <Image source={logo} style={[{ width: size, height: size }, Platform.OS === 'web' ? ({ mixBlendMode: 'multiply' } as object) : null]} contentFit="contain" accessibilityLabel={x.name} />
          )
        ) : (
          <Txt numberOfLines={2} style={{ width: size * 1.4, fontFamily: fonts.serif, fontSize: isMobile ? 14 : 18, textAlign: 'center', color: t.fg }}>{x.name}</Txt>
        );
        return (
          <Reveal key={x.id} index={i} style={{ position: 'absolute', ...pos, transform: [{ rotate: `${slot.tilt}deg` }] } as object}>
            {x.website ? <Pressable onPress={() => openExternal(x.website!)} accessibilityRole="link" accessibilityLabel={x.name}>{mark}</Pressable> : mark}
          </Reveal>
        );
      })}
      <Reveal style={{ gap: 14, alignItems: 'center', maxWidth: isMobile ? 240 : 460, paddingVertical: isMobile ? 120 : 0 }}>{children}</Reveal>
    </View>
  );
}
