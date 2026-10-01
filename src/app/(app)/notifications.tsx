import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { View } from 'react-native';

import { Button, Card, EmptyState, Tap, type IconName, type Tone, toneColors } from '@/components/ui/primitives';
import { PageHeader, Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { useMe, useStore } from '@/data/store';
import type { AppNotification } from '@/data/types';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

const KIND: Record<AppNotification['kind'], [IconName, Tone]> = {
  message: ['message-circle', 'primary'],
  event: ['calendar', 'ink'],
  question: ['help-circle', 'secondary'],
  publication: ['book-open', 'secondary'],
  birthday: ['gift', 'primary'],
  approval: ['user-check', 'secondary'],
  photo: ['image', 'violet'],
};

export default function Notifications() {
  const { d, f, relative } = useI18n();
  const { colors } = useTheme();
  const { db, actions } = useStore();
  const me = useMe();
  const list = db.notifications.filter((n) => n.userId === me.id).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const unread = list.some((n) => !n.read);

  return (
    <Screen maxWidth={820}>
      <PageHeader title={d.notifications.title} right={unread && <Button label={d.notifications.markAll} variant="secondary" size="sm" icon="check" onPress={actions.markNotificationsRead} />} />
      <Card padded={false}>
        {list.length === 0 && <EmptyState icon="bell" title={d.notifications.empty} />}
        {list.map((n, i) => {
          const [icon, tone] = KIND[n.kind];
          const t = toneColors(colors, tone);
          return (
            <Tap
              key={n.id}
              onPress={() => n.href && router.push(n.href as never)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderBottomWidth: i === list.length - 1 ? 0 : 1, borderBottomColor: colors.border, backgroundColor: n.read ? 'transparent' : colors.primarySoft + '55' }}
              hoverStyle={{ backgroundColor: colors.surfaceAlt }}>
              <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
                <Feather name={icon} size={18} color={t.fg} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Txt variant={n.read ? 'body' : 'bodyStrong'}>{f(d.notifications.t[n.template], n.params)}</Txt>
                <Txt variant="small" color="textSubtle">{relative(n.createdAt)}</Txt>
              </View>
              {!n.read && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }} />}
            </Tap>
          );
        })}
      </Card>
    </Screen>
  );
}
