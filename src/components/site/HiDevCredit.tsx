import { Linking, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Tap } from '@/components/ui/primitives';
import { Txt } from '@/components/ui/Txt';
import { useI18n } from '@/i18n';
import { fonts, radius } from '@/theme/tokens';

const HI_DEV_URL = 'https://www.hidevmobile.com';

/**
 * « Powered by HI DEV » pill — same credit as in the LaBreak footer (diamond mark, pill on dark).
 * On the web it is a real <a href> to the studio (a backlink), opening in a new tab.
 */
export function HiDevCredit() {
  const { d } = useI18n();
  const web = Platform.OS === 'web' ? ({ href: HI_DEV_URL, hrefAttrs: { target: '_blank', rel: 'noopener' } } as object) : {};
  return (
    <Tap
      {...web}
      onPress={Platform.OS === 'web' ? undefined : () => Linking.openURL(HI_DEV_URL)}
      role="link"
      accessibilityLabel="Powered by Hi Dev"
      style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, paddingHorizontal: 12, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
      hoverStyle={{ backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.2)' }}>
      <Svg width={14} height={14} viewBox="0 0 64 64">
        <Path d="M 32 4 L 60 32 L 32 60 L 4 32 Z" fill="none" stroke="#fff" strokeWidth={4} strokeLinejoin="miter" />
        <Path d="M 32 16 L 48 32 L 32 48 L 16 32 Z" fill="none" stroke="#fff" strokeWidth={3} strokeLinejoin="miter" />
        <Path d="M 20 34 L 32 46 L 44 34 Z" fill="#9DD9E6" />
      </Svg>
      <Txt style={{ fontFamily: fonts.semibold, fontSize: 12, letterSpacing: 0.04, color: 'rgba(255,255,255,0.85)' }}>
        {d.site.footer.poweredBy} <Txt style={{ fontFamily: fonts.semibold, fontSize: 12, color: '#FFFFFF' }}>HI DEV</Txt>
      </Txt>
    </Tap>
  );
}
