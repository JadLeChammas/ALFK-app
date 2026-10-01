import { Feather } from '@expo/vector-icons';
import { useEffect, useId, useState, type ComponentProps } from 'react';
import { Pressable } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Defs, Path, Text as SvgText, TextPath } from 'react-native-svg';

import { brand, fonts } from '@/theme/tokens';

/**
 * Port of 21st.dev "Spinning Text With Icon" (shadcnspace) as a round call-to-action:
 * uppercase text runs around a circle and rotates (twice as fast on hover), with a solid
 * round button in the middle — the round red control of delassus.com.
 */
export function SpinningButton({
  text,
  onPress,
  size = 132,
  icon = 'arrow-right',
  color = brand.red,
  textColor = '#fff',
  iconColor = '#fff',
  speed = 14,
  reverse,
  accessibilityLabel,
}: {
  text: string;
  onPress?: () => void;
  size?: number;
  icon?: ComponentProps<typeof Feather>['name'];
  color?: string;
  textColor?: string;
  iconColor?: string;
  /** Seconds per turn. */
  speed?: number;
  reverse?: boolean;
  accessibilityLabel?: string;
}) {
  const reduced = useReducedMotion();
  const ringId = `ring${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [hovered, setHovered] = useState(false);
  const angle = useSharedValue(0);
  const r = size / 2 - 10;
  const c = size / 2;
  const label = `${text} • `.repeat(Math.max(1, Math.round((2 * Math.PI * r) / (text.length * 7.2 + 18))));

  useEffect(() => {
    if (reduced) return;
    const turn = (hovered ? speed / 2 : speed) * 1000;
    const from = angle.value % 360;
    angle.value = from;
    angle.value = withRepeat(withTiming(from + (reverse ? -360 : 360), { duration: turn, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(angle);
  }, [hovered, speed, reverse, reduced, angle]);

  const spin = useAnimatedStyle(() => ({ transform: [{ rotate: `${angle.value}deg` }] }));
  const inner = size * 0.46;

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? text}
      style={({ pressed }) => ({ width: size, height: size, alignItems: 'center', justifyContent: 'center', transform: [{ scale: pressed ? 0.95 : hovered ? 1.04 : 1 }] })}>
      <Animated.View style={[{ position: 'absolute', width: size, height: size }, spin]}>
        <Svg width={size} height={size}>
          <Defs>
            <Path id={ringId} d={`M ${c},${c} m -${r},0 a ${r},${r} 0 1,1 ${2 * r},0 a ${r},${r} 0 1,1 -${2 * r},0`} />
          </Defs>
          <SvgText fill={textColor} fontSize={11} fontFamily={fonts.semibold} letterSpacing={2.2}>
            <TextPath href={`#${ringId}`}>{label.toUpperCase()}</TextPath>
          </SvgText>
        </Svg>
      </Animated.View>
      <Animated.View style={{ width: inner, height: inner, borderRadius: inner / 2, backgroundColor: color, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)' }}>
        <Feather name={icon} size={inner * 0.38} color={iconColor} />
      </Animated.View>
    </Pressable>
  );
}
