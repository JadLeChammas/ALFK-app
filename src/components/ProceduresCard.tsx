import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { View } from 'react-native';

import { useUpcomingProcedures } from '@/data/keyDates';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { Badge, Card, IconButton, SectionHeader, Tap } from './ui/primitives';
import { Txt } from './ui/Txt';
import { openExternal } from '@/lib/links';

/** « Démarches à venir »: Parcoursup, competitive exams, applications — in progress or coming up. */
export function ProceduresCard({ limit = 4, footer = true }: { limit?: number; footer?: boolean }) {
  const { d, f } = useI18n();
  const { colors } = useTheme();
  const list = useUpcomingProcedures(limit);
  const day = (dt: Date) => `${dt.getDate()} ${d.months[dt.getMonth()]}`;
  return (
    <Card style={{ height: '100%' }}>
      <SectionHeader title={d.calendar.procedures} icon="clipboard" />
      <View style={{ flex: 1, gap: 14 }}>
        {list.length === 0 && <Txt color="textMuted">{d.calendar.proceduresEmpty}</Txt>}
        {list.map((o) => (
          <View key={o.k.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <Txt variant="smallStrong" numberOfLines={2}>{o.k.title}</Txt>
              <Txt variant="small" color="textSubtle">{o.range ? `${day(o.start)} → ${day(o.end)}` : day(o.start)}</Txt>
              <View style={{ flexDirection: 'row' }}>
                <Badge
                  tone={o.ongoing ? (o.leftDays <= 7 ? 'danger' : 'success') : o.inDays <= 7 ? 'warning' : 'neutral'}
                  label={
                    o.ongoing
                      ? o.leftDays === 0 ? d.calendar.endsToday : f(d.calendar.ongoing, { n: o.leftDays })
                      : o.inDays === 0 ? d.common.today : o.inDays === 1 ? d.common.tomorrow : f(d.common.inDays, { n: o.inDays })
                  }
                />
              </View>
            </View>
            {!!o.k.url && <IconButton icon="external-link" size={34} onPress={() => openExternal(o.k.url!)} label={d.calendar.openLink} />}
          </View>
        ))}
      </View>
      {footer && (
        <Tap onPress={() => router.push('/calendrier?only=demarches')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border }}>
          <Txt variant="smallStrong" color="primary">{d.calendar.seeProcedures}</Txt>
          <Feather name="arrow-right" size={14} color={colors.primary} />
        </Tap>
      )}
    </Card>
  );
}
