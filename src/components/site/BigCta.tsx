import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Platform, Pressable } from 'react-native';

import { Txt } from '@/components/ui/Txt';
import { useLayout } from '@/theme/layout';
import { fonts } from '@/theme/tokens';

/**
 * The chunky call-to-action of delassus.com: a tall rounded button with an arrow and a soft
 * shadow in a darker shade of the band behind it. The arrow slides and the button lifts on hover.
 */
export function BigCta({ label, onPress, bg, fg, shadow }: { label: string; onPress: () => void; bg: string; fg: string; shadow: string }) {
  const { isMobile } = useLayout();
  const [hovered, setHovered] = useState(false);
  const web = Platform.OS === 'web' ? ({ transitionProperty: 'transform, box-shadow', transitionDuration: '250ms', transitionTimingFunction: 'cubic-bezier(0.22,1,0.36,1)' } as object) : {};
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      accessibilityRole="button"
      style={({ pressed }) => ({
        height: isMobile ? 54 : 62,
        paddingHorizontal: isMobile ? 26 : 34,
        borderRadius: 999,
        backgroundColor: bg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: hovered ? 18 : 12,
        alignSelf: 'center',
        shadowColor: shadow,
        shadowOpacity: 0.55,
        shadowRadius: hovered ? 28 : 20,
        shadowOffset: { width: 0, height: hovered ? 14 : 10 },
        elevation: 6,
        transform: [{ translateY: hovered ? -2 : 0 }, { scale: pressed ? 0.97 : 1 }],
        ...web,
      })}>
      <Txt style={{ fontFamily: fonts.semibold, fontSize: isMobile ? 15 : 16, color: fg }}>{label}</Txt>
      <Feather name="arrow-right" size={isMobile ? 18 : 20} color={fg} />
    </Pressable>
  );
}
