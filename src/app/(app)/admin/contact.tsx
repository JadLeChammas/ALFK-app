import { Feather } from '@expo/vector-icons';
import { View } from 'react-native';

import { AdminNav } from '@/components/AdminNav';
import { useDialogs } from '@/components/ui/Dialogs';
import { Avatar, Badge, Button, Card, EmptyState, Row } from '@/components/ui/primitives';
import { PageHeader, Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { useStore } from '@/data/store';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

export default function ContactInbox() {
  const { d, relative } = useI18n();
  const { colors } = useTheme();
  const { db, actions } = useStore();
  const { confirm } = useDialogs();
  const list = [...db.contacts].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return (
    <Screen maxWidth={960}>
      <PageHeader title={d.admin.contact} subtitle={d.admin.contactSub} />
      <AdminNav />
      {list.length === 0 && (
        <Card>
          <EmptyState icon="inbox" title={d.admin.noContact} />
        </Card>
      )}
      <View style={{ gap: 12 }}>
        {list.map((c) => (
          <Card key={c.id} style={[{ gap: 12 }, !c.read && { borderColor: colors.primary }]}>
            <Row gap={12} style={{ alignItems: 'flex-start' }}>
              <Avatar name={c.name} size={42} />
              <View style={{ flex: 1, gap: 2 }}>
                <Row gap={8} wrap>
                  <Txt variant="bodyStrong">{c.name}</Txt>
                  {!c.read && <Badge label="●" tone="primary" />}
                </Row>
                <Txt variant="small" color="textSubtle">{c.email} · {relative(c.createdAt)}</Txt>
              </View>
            </Row>
            <View style={{ gap: 4 }}>
              <Txt variant="h3">{c.subject}</Txt>
              <Txt color="textMuted">{c.message}</Txt>
            </View>
            <Row gap={8} wrap>
              <Button label={c.read ? d.admin.markUnread : d.admin.markRead} icon={c.read ? 'mail' : 'check'} size="sm" variant="secondary" onPress={() => actions.setContactRead(c.id, !c.read)} />
              <Button
                label={d.common.delete}
                icon="trash-2"
                size="sm"
                variant="danger"
                onPress={async () => (await confirm({ title: d.common.delete, message: c.subject, danger: true, confirmLabel: d.common.delete })) && actions.deleteContact(c.id)}
              />
              <View style={{ flex: 1 }} />
              <Row gap={6}>
                <Feather name="lock" size={12} color={colors.textSubtle} />
                <Txt variant="small" color="textSubtle">{d.nav.admin}</Txt>
              </Row>
            </Row>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
