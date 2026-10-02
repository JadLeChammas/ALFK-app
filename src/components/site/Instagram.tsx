import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Linking, Platform, Pressable, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Tap } from '@/components/ui/primitives';
import { Txt } from '@/components/ui/Txt';
import { useI18n } from '@/i18n';
import { fonts } from '@/theme/tokens';

export const INSTAGRAM_URL = 'https://www.instagram.com/amicalelfk';
export const INSTAGRAM_HANDLE = '@amicalelfk';
/** Instagram's own colours (brand colours stay original, like WhatsApp green). */
const IG = ['#FEDA75', '#FA7E1E', '#D62976', '#962FBF', '#4F5BD5'] as const;

/** On the web a real <a href> (new tab, a link search engines follow); elsewhere the app opens it. */
export const instagramLinkProps = () =>
  Platform.OS === 'web'
    ? ({ href: INSTAGRAM_URL, hrefAttrs: { target: '_blank', rel: 'noopener' } } as object)
    : { onPress: () => Linking.openURL(INSTAGRAM_URL) };

/** The official Instagram glyph (as in 21st.dev « Agency Footer », shadcnspace), in one colour. */
export function InstagramGlyph({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill={color}
        d="M12 2.162c3.204 0 3.584.012 4.849.07 1.17.054 1.805.249 2.228.413.56.218.96.478 1.38.898s.68.82.898 1.38c.164.423.36 1.058.413 2.228.058 1.265.07 1.645.07 4.849s-.012 3.584-.07 4.849c-.053 1.17-.249 1.805-.413 2.228a3.7 3.7 0 0 1-.898 1.38c-.42.42-.82.68-1.38.898-.423.164-1.058.36-2.228.413-1.265.058-1.645.07-4.849.07s-3.584-.012-4.849-.07c-1.17-.053-1.805-.249-2.228-.413a3.7 3.7 0 0 1-1.38-.898c-.42-.42-.68-.82-.898-1.38-.164-.423-.36-1.058-.413-2.228-.058-1.265-.07-1.645-.07-4.849s.012-3.584.07-4.849c.054-1.17.249-1.805.413-2.228.218-.56.478-.96.898-1.38s.82-.68 1.38-.898c.423-.164 1.058-.36 2.228-.413 1.265-.058 1.645-.07 4.849-.07M12 0C8.741 0 8.332.014 7.052.072 5.775.131 4.902.333 4.14.63a5.9 5.9 0 0 0-2.126 1.384A5.9 5.9 0 0 0 .63 4.14c-.297.763-.5 1.635-.558 2.912C.014 8.332 0 8.741 0 12s.014 3.668.072 4.948c.059 1.277.261 2.15.558 2.912.307.79.717 1.459 1.384 2.126A5.9 5.9 0 0 0 4.14 23.37c.763.297 1.635.5 2.912.558C8.332 23.986 8.741 24 12 24s3.668-.014 4.948-.072c1.277-.059 2.15-.261 2.912-.558a5.9 5.9 0 0 0 2.126-1.384 5.9 5.9 0 0 0 1.384-2.126c.297-.763.5-1.635.558-2.912.058-1.28.072-1.689.072-4.948s-.014-3.668-.072-4.948c-.059-1.277-.261-2.15-.558-2.912a5.9 5.9 0 0 0-1.384-2.126A5.9 5.9 0 0 0 19.86.63c-.763-.297-1.635-.5-2.912-.558C15.668.014 15.259 0 12 0m0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324M12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8m7.846-10.406a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0"
      />
    </Svg>
  );
}

/**
 * Round Instagram button — port of 21st.dev « Social Media » (ravikatiyar162): a quiet circle with
 * the glyph; on hover Instagram's colours fill it from the bottom and the glyph turns white (the
 * handle is written next to it, so no tooltip). `tone` = the surface it sits on.
 */
export function InstagramButton({ size = 44, tone = 'dark' }: { size?: number; tone?: 'dark' | 'light' }) {
  const [hover, setHover] = useState(false);
  const fill = useSharedValue(0);
  const onHover = (on: boolean) => {
    setHover(on);
    fill.set(withTiming(on ? 1 : 0, { duration: 300, easing: Easing.out(Easing.cubic) }));
  };
  const rise = useAnimatedStyle(() => ({ height: `${fill.get() * 100}%` }));
  const dark = tone === 'dark';
  return (
    <View style={{ alignItems: 'center' }}>
      <Pressable
        {...instagramLinkProps()}
        role="link"
        accessibilityLabel={`Instagram ${INSTAGRAM_HANDLE}`}
        onHoverIn={() => onHover(true)}
        onHoverOut={() => onHover(false)}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: dark ? 'rgba(255,255,255,0.08)' : '#FFFFFF',
          borderWidth: 1,
          borderColor: dark ? 'rgba(231, 236, 242,0.2)' : 'rgba(14, 42, 71,0.12)',
        }}>
        {/* The colour rises inside its own clipped layer; the glyph sits above it. */}
        <Animated.View style={[{ position: 'absolute', left: 0, right: 0, bottom: 0, overflow: 'hidden' }, rise]}>
          <LinearGradient colors={IG} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: size }} />
        </Animated.View>
        <View pointerEvents="none" style={{ position: 'relative', zIndex: 1 }}>
          <InstagramGlyph size={size * 0.46} color={hover || dark ? '#FFFFFF' : '#0E2A47'} />
        </View>
      </Pressable>
    </View>
  );
}

/**
 * « Suivez-nous sur Instagram » text link in the colour of the surface: `inline` under a call to
 * action (hero), `row` as a full-width list row (phone menu).
 */
export function InstagramLink({ variant = 'inline', color = '#FFFFFF', muted = 'rgba(255,255,255,0.75)' }: { variant?: 'inline' | 'row'; color?: string; muted?: string }) {
  const { d } = useI18n();
  if (variant === 'row') {
    return (
      <Tap {...instagramLinkProps()} role="link" accessibilityLabel={`Instagram ${INSTAGRAM_HANDLE}`} style={{ height: 52, flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: 'rgba(231, 236, 242,0.15)' }}>
        <InstagramGlyph size={20} color={color} />
        <Txt style={{ fontFamily: fonts.medium, fontSize: 16, color }}>{d.site.footer.followUs}</Txt>
        <View style={{ flex: 1 }} />
        <Txt style={{ fontFamily: fonts.medium, fontSize: 14, color: muted }}>{INSTAGRAM_HANDLE}</Txt>
      </Tap>
    );
  }
  return (
    <Tap {...instagramLinkProps()} role="link" accessibilityLabel={`Instagram ${INSTAGRAM_HANDLE}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 }} hoverStyle={{ opacity: 0.75 }}>
      <InstagramGlyph size={17} color={color} />
      <Txt style={{ fontFamily: fonts.medium, fontSize: 14, color: muted }}>
        {d.site.footer.followUs} <Txt style={{ fontFamily: fonts.semibold, fontSize: 14, color }}>{INSTAGRAM_HANDLE}</Txt>
      </Txt>
    </Tap>
  );
}
