import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Linking, Platform, View } from 'react-native';

import { Tap } from '@/components/ui/primitives';
import { Txt } from '@/components/ui/Txt';
import { useI18n } from '@/i18n';
import { fonts, radius } from '@/theme/tokens';

export const INSTAGRAM_URL = 'https://www.instagram.com/amicalelfk';
export const INSTAGRAM_HANDLE = '@amicalelfk';
/** Instagram's own gradient (brand colours stay original, like WhatsApp green). */
const IG = ['#F58529', '#DD2A7B', '#8134AF', '#515BD4'] as const;

/** On the web a real <a href> (new tab, a link search engines follow); elsewhere the app opens it. */
export const instagramLinkProps = () =>
  Platform.OS === 'web'
    ? ({ href: INSTAGRAM_URL, hrefAttrs: { target: '_blank', rel: 'noopener' } } as object)
    : { onPress: () => Linking.openURL(INSTAGRAM_URL) };

/** The Instagram glyph on its gradient, as a rounded square. */
export function InstagramMark({ size = 20 }: { size?: number }) {
  return (
    <LinearGradient colors={IG} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={{ width: size, height: size, borderRadius: size * 0.3, alignItems: 'center', justifyContent: 'center' }}>
      <Feather name="instagram" size={size * 0.62} color="#FFFFFF" />
    </LinearGradient>
  );
}

/**
 * « Suivez-nous sur Instagram » link.
 *  · `inline` — small line of text under a call to action (hero), coloured to sit on any slide;
 *  · `pill` — mark + @amicalelfk in a bordered pill (footer, dark surfaces);
 *  · `row` — full-width list row (phone menu).
 */
export function InstagramLink({ variant = 'inline', color = '#FFFFFF', muted = 'rgba(255,255,255,0.75)' }: { variant?: 'inline' | 'pill' | 'row'; color?: string; muted?: string }) {
  const { d } = useI18n();
  if (variant === 'pill') {
    return (
      <Tap
        {...instagramLinkProps()}
        role="link"
        accessibilityLabel={`Instagram ${INSTAGRAM_HANDLE}`}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7, paddingLeft: 7, paddingRight: 14, borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(231, 236, 242,0.2)', backgroundColor: 'rgba(255,255,255,0.04)' }}
        hoverStyle={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
        <InstagramMark size={26} />
        <Txt style={{ fontFamily: fonts.semibold, fontSize: 14, color }}>{INSTAGRAM_HANDLE}</Txt>
      </Tap>
    );
  }
  if (variant === 'row') {
    return (
      <Tap {...instagramLinkProps()} role="link" accessibilityLabel={`Instagram ${INSTAGRAM_HANDLE}`} style={{ height: 52, flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: 'rgba(231, 236, 242,0.15)' }}>
        <InstagramMark size={26} />
        <Txt style={{ fontFamily: fonts.medium, fontSize: 16, color }}>{d.site.footer.followUs}</Txt>
        <View style={{ flex: 1 }} />
        <Txt style={{ fontFamily: fonts.medium, fontSize: 14, color: muted }}>{INSTAGRAM_HANDLE}</Txt>
      </Tap>
    );
  }
  return (
    <Tap {...instagramLinkProps()} role="link" accessibilityLabel={`Instagram ${INSTAGRAM_HANDLE}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 }} hoverStyle={{ opacity: 0.8 }}>
      <InstagramMark size={20} />
      <Txt style={{ fontFamily: fonts.medium, fontSize: 14, color: muted }}>
        {d.site.footer.followUs} <Txt style={{ fontFamily: fonts.semibold, fontSize: 14, color }}>{INSTAGRAM_HANDLE}</Txt>
      </Txt>
    </Tap>
  );
}
