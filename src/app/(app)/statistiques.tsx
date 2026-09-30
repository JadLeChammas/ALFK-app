import { Feather } from '@expo/vector-icons';
import { View } from 'react-native';

import { CommunityStats } from '@/components/CommunityStats';
import { Row } from '@/components/ui/primitives';
import { PageHeader, Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

/** Read-only network statistics for school leadership (and admins). Guarded in (app)/_layout.tsx. */
export default function Statistics() {
  const { d } = useI18n();
  const { colors } = useTheme();
  return (
    <Screen>
      <PageHeader
        title={d.stats.title}
        subtitle={d.stats.subtitle}
        icon={
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.warningSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="bar-chart-2" size={20} color={colors.warning} />
          </View>
        }
      />
      <Row gap={8} style={{ alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.surfaceAlt }}>
        <Feather name="eye" size={13} color={colors.textMuted} />
        <Txt variant="small" color="textMuted">{d.stats.readOnly}</Txt>
      </Row>
      <CommunityStats />
    </Screen>
  );
}
