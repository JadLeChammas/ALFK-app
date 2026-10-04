import { Feather } from '@expo/vector-icons';
import { Image, type ImageSource } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useId, type ComponentProps, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Defs, Path, Text as SvgText, TextPath } from 'react-native-svg';

import { TextRoll } from '@/components/fx/TextRoll';
import { LogoMark } from '@/components/ui/Logo';
import { Txt } from '@/components/ui/Txt';
import { brand, fonts } from '@/theme/tokens';

/**
 * Pieces that float over the photo of the split hero (EditorialImageHero, laptop layout): a member
 * card, a « verified » badge, a turning stamp, figures, the Bureau's faces. Each one arrives with a
 * short rise and then bobs gently; all stay still when the system asks for reduced motion.
 */

const shadow = { shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 8 } as const;

/** Positioned piece that rises into place, then floats up and down. */
export function Float({ children, style, amplitude = 8, duration = 3800, delay = 0, rotate = 0 }: { children: ReactNode; style?: StyleProp<ViewStyle>; amplitude?: number; duration?: number; delay?: number; rotate?: number }) {
  const reduced = useReducedMotion();
  const enter = useSharedValue(reduced ? 1 : 0);
  const bob = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    enter.value = withDelay(delay, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }));
    bob.value = withDelay(delay + 900, withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true));
    return () => cancelAnimation(bob);
  }, [reduced, delay, duration, enter, bob]);
  const anim = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateY: (1 - enter.value) * 28 - amplitude * bob.value }, { rotate: `${rotate}deg` }],
  }));
  return <Animated.View style={[{ position: 'absolute', zIndex: 2 }, style, anim]}>{children}</Animated.View>;
}

/** A gold ALFK member card; a light sheen crosses it every few seconds. `number`: the card number shown. */
export function MemberCard({ role, number }: { role: string; number: number }) {
  const reduced = useReducedMotion();
  const sheen = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    sheen.value = withRepeat(withSequence(withDelay(2600, withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.cubic) })), withTiming(0, { duration: 0 })), -1, false);
    return () => cancelAnimation(sheen);
  }, [reduced, sheen]);
  const sheenStyle = useAnimatedStyle(() => ({ transform: [{ translateX: -160 + sheen.value * 520 }, { rotate: '20deg' }] }));
  return (
    <View style={[{ width: 300, height: 186, borderRadius: 18, overflow: 'hidden' }, shadow]}>
      <LinearGradient colors={['#EED9A2', '#D2AE5C', '#A98330']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, padding: 18, justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
            <LogoMark size={32} />
          </View>
          <Txt style={{ fontFamily: fonts.semibold, fontSize: 12, letterSpacing: 2.4, color: brand.navy }}>AMICALE LFK</Txt>
          <View style={{ flex: 1 }} />
          {/* card chip */}
          <View style={{ width: 38, height: 28, borderRadius: 6, backgroundColor: 'rgba(14,42,71,0.16)', borderWidth: 1, borderColor: 'rgba(14,42,71,0.25)', justifyContent: 'space-evenly', paddingHorizontal: 5 }}>
            {[0, 1, 2].map((k) => <View key={k} style={{ height: 1, backgroundColor: 'rgba(14,42,71,0.35)' }} />)}
          </View>
        </View>
        <View style={{ gap: 2 }}>
          <Txt style={{ fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 2.2, color: 'rgba(14,42,71,0.7)', textTransform: 'uppercase' }}>{role}</Txt>
          <Txt style={{ fontFamily: fonts.display, fontSize: 28, lineHeight: 32, letterSpacing: 2, color: brand.navy }}>{`N° ${String(Math.max(1, number)).padStart(5, '0')}`}</Txt>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Txt style={{ fontFamily: fonts.semibold, fontSize: 10, letterSpacing: 2, color: 'rgba(14,42,71,0.6)' }}>ALFK.ORG</Txt>
          <Feather name="wifi" size={16} color="rgba(14,42,71,0.55)" style={{ transform: [{ rotate: '90deg' }] }} />
        </View>
      </LinearGradient>
      {!reduced && (
        <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: -60, bottom: -60, width: 70 }, sheenStyle]}>
          <LinearGradient colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.55)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
        </Animated.View>
      )}
    </View>
  );
}

/** White pill with a green tick. */
export function CheckPill({ label }: { label: string }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 8, paddingRight: 16, height: 46, borderRadius: 23, backgroundColor: '#fff' }, shadow]}>
      <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#1F9D57', alignItems: 'center', justifyContent: 'center' }}>
        <Feather name="check" size={16} color="#fff" />
      </View>
      <Txt style={{ fontFamily: fonts.semibold, fontSize: 13, color: brand.navy }}>{label}</Txt>
    </View>
  );
}

/** Round stamp: the text turns slowly around an emblem (`logo`; the ALFK emblem by default). */
export function TurningStamp({ text, size = 156, logo }: { text: string; size?: number; logo?: ImageSource | number }) {
  const reduced = useReducedMotion();
  const ringId = `stamp${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const angle = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    angle.value = withRepeat(withTiming(360, { duration: 26000, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(angle);
  }, [reduced, angle]);
  const spin = useAnimatedStyle(() => ({ transform: [{ rotate: `${angle.value}deg` }] }));
  const r = size / 2 - 16;
  const c = size / 2;
  // The text goes round exactly once or more: as many copies as fit, then the letter spacing is
  // set so they close the circle without overlapping (about 0.66 em per uppercase letter).
  const fontSize = 10.5;
  const unit = `${text} • `;
  const circumference = 2 * Math.PI * r;
  const copies = Math.max(1, Math.floor(circumference / (unit.length * (fontSize * 0.66 + 2))));
  const label = unit.repeat(copies);
  const spacing = Math.min(9, Math.max(0.5, circumference / label.length - fontSize * 0.66));
  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: brand.navy, borderWidth: 1, borderColor: 'rgba(215,180,106,0.6)', alignItems: 'center', justifyContent: 'center' }, shadow]}>
      <Animated.View style={[{ position: 'absolute', width: size, height: size }, spin]}>
        <Svg width={size} height={size}>
          <Defs>
            <Path id={ringId} d={`M ${c},${c} m -${r},0 a ${r},${r} 0 1,1 ${2 * r},0 a ${r},${r} 0 1,1 -${2 * r},0`} />
          </Defs>
          <SvgText fill={brand.blue} fontSize={fontSize} fontFamily={fonts.semibold} letterSpacing={spacing}>
            <TextPath href={`#${ringId}`}>{label.toUpperCase()}</TextPath>
          </SvgText>
        </Svg>
      </Animated.View>
      <View style={{ width: size * 0.5, height: size * 0.5, borderRadius: size * 0.25, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {logo ? <Image source={logo} style={{ width: size * 0.4, height: size * 0.4 }} contentFit="contain" accessibilityLabel={text} /> : <LogoMark size={size * 0.4} />}
      </View>
    </View>
  );
}

/** A white card with one figure (rolls in) and its label. */
export function FigureCard({ value, label, icon }: { value: number; label: string; icon?: ComponentProps<typeof Feather>['name'] }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingLeft: 14, paddingRight: 22, borderRadius: 20, backgroundColor: '#fff' }, shadow]}>
      {icon && (
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(197,59,62,0.1)', alignItems: 'center', justifyContent: 'center' }}>
          <Feather name={icon} size={20} color={brand.red} />
        </View>
      )}
      <View>
        <TextRoll style={{ fontFamily: fonts.display, fontSize: 34, lineHeight: 38, color: brand.navy }} delay={0.6}>
          {String(value)}
        </TextRoll>
        <Txt style={{ fontFamily: fonts.semibold, fontSize: 10.5, letterSpacing: 1.4, textTransform: 'uppercase', color: '#4A5B70' }}>{label}</Txt>
      </View>
    </View>
  );
}

/** Overlapping round photos (initials when there is no photo) and a caption. */
export function FacesCard({ people, caption }: { people: { name: string; avatar?: string }[]; caption: string }) {
  const shown = people.slice(0, 5);
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, paddingRight: 22, borderRadius: 24, backgroundColor: '#fff' }, shadow]}>
      <View style={{ flexDirection: 'row' }}>
        {shown.map((p, i) => (
          <View key={p.name} style={{ width: 48, height: 48, borderRadius: 24, marginLeft: i ? -14 : 0, borderWidth: 3, borderColor: '#fff', backgroundColor: brand.sky, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
            {p.avatar ? (
              <Image source={{ uri: p.avatar }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
            ) : (
              <Txt style={{ fontFamily: fonts.semibold, fontSize: 15, color: brand.navy }}>{p.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('')}</Txt>
            )}
          </View>
        ))}
      </View>
      <Txt style={{ fontFamily: fonts.semibold, fontSize: 14, lineHeight: 19, color: brand.navy, maxWidth: 170 }}>{caption}</Txt>
    </View>
  );
}

/** Gold seal with a figure and its caption (e.g. « 100 % · de réussite au bac »); `compact`: a pill. */
export function ResultSeal({ value, label, compact }: { value: string; label: string; compact?: boolean }) {
  if (compact) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 12, paddingVertical: 8, paddingLeft: 8, paddingRight: 18, borderRadius: 999, backgroundColor: 'rgba(215,180,106,0.16)', borderWidth: 1, borderColor: 'rgba(215,180,106,0.55)' }}>
        <LinearGradient colors={['#EED9A2', '#C9A24E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
          <Feather name="award" size={19} color={brand.navy} />
        </LinearGradient>
        <Txt style={{ fontFamily: fonts.display, fontSize: 24, lineHeight: 28, color: brand.navy }}>{value}</Txt>
        <Txt style={{ fontFamily: fonts.semibold, fontSize: 13, lineHeight: 17, color: brand.navy, flexShrink: 1 }}>{label}</Txt>
      </View>
    );
  }
  return (
    <LinearGradient colors={['#EED9A2', '#D2AE5C', '#A98330']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[{ width: 138, height: 138, borderRadius: 69, alignItems: 'center', justifyContent: 'center', padding: 14 }, shadow]}>
      {/* inner ring, like a printed seal */}
      <View style={{ position: 'absolute', top: 7, left: 7, right: 7, bottom: 7, borderRadius: 62, borderWidth: 1, borderColor: 'rgba(14,42,71,0.35)', borderStyle: 'dashed' }} />
      <Feather name="award" size={18} color={brand.navy} />
      <Txt style={{ fontFamily: fonts.display, fontSize: 36, lineHeight: 40, color: brand.navy }}>{value}</Txt>
      <Txt numberOfLines={2} style={{ fontFamily: fonts.semibold, fontSize: 10, lineHeight: 13, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center', color: brand.navy }}>{label}</Txt>
    </LinearGradient>
  );
}
