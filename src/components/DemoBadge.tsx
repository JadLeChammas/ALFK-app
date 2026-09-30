import { Feather } from '@expo/vector-icons';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useI18n } from '@/i18n';
import { exitDemo, isDemoForced } from '@/lib/supabase';
import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';
import { Tap } from './ui/primitives';
import { Txt } from './ui/Txt';

/** Always-visible tag while a visitor explores the demo on the real site, with a way back. */
export function DemoBadge() {
  const { colors } = useTheme();
  const { d } = useI18n();
  const { isMobile } = useLayout();
  const insets = useSafeAreaInsets();
  if (!isDemoForced) return null;
  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 0, right: 0, bottom: (isMobile ? 84 : 20) + insets.bottom, alignItems: isMobile ? 'center' : 'flex-end', paddingHorizontal: 20, zIndex: 900 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 14, paddingRight: 6, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.warning }}>
        <Feather name="eye" size={14} color="#fff" />
        <Txt style={{ color: '#fff', fontFamily: fonts.bold, fontSize: 12 }}>{d.demo.badge}</Txt>
        <Tap onPress={exitDemo} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.25)' }}>
          <Txt style={{ color: '#fff', fontFamily: fonts.bold, fontSize: 12 }}>{d.demo.exit}</Txt>
        </Tap>
      </View>
    </View>
  );
}
