import { Feather } from '@expo/vector-icons';
import { View } from 'react-native';

import { AdminNav } from '@/components/AdminNav';
import { Avatar, Card, EmptyState, Row, toneColors, type IconName, type Tone } from '@/components/ui/primitives';
import { PageHeader, Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { fullName, useStore, useUserMap } from '@/data/store';
import type { AdminLogAction } from '@/data/types';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

const ICON: Record<AdminLogAction, [IconName, Tone]> = {
  approve: ['user-check', 'success'],
  refuse: ['user-x', 'danger'],
  create_user: ['user-plus', 'primary'],
  change_role: ['sliders', 'violet'],
  reset_password: ['key', 'warning'],
  delete_user: ['trash-2', 'danger'],
  create_event: ['calendar', 'primary'],
  delete_event: ['calendar', 'danger'],
  delete_photo: ['image', 'danger'],
  create_publication: ['book-open', 'primary'],
  delete_publication: ['book-open', 'danger'],
  open_reported_conversation: ['eye', 'warning'],
  resolve_report: ['check-circle', 'success'],
  approve_publication: ['file-text', 'success'],
  reject_publication: ['file-text', 'danger'],
};

export default function AuditLog() {
  const { d, formatDate, formatTime } = useI18n();
  const { colors } = useTheme();
  const { db } = useStore();
  const users = useUserMap();
  const logs = [...db.logs].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return (
    <Screen maxWidth={960}>
      <PageHeader title={d.admin.logs} subtitle={d.admin.logsSub} />
      <AdminNav />
      <Card padded={false}>
        {logs.length === 0 && <EmptyState icon="list" title={d.common.noResults} />}
        {logs.map((l, i) => {
          const [icon, tone] = ICON[l.action];
          const t = toneColors(colors, tone);
          const actor = users.get(l.actorId);
          return (
            <Row key={l.id} gap={14} style={{ padding: 16, borderBottomWidth: i === logs.length - 1 ? 0 : 1, borderBottomColor: colors.border }}>
              <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
                <Feather name={icon} size={16} color={t.fg} />
              </View>
              <Avatar uri={actor?.avatar} name={fullName(actor) || '?'} size={28} />
              <Txt style={{ flex: 1 }}>
                <Txt variant="bodyStrong">{fullName(actor) || '—'}</Txt>
                <Txt color="textMuted"> {d.admin.actions[l.action]} </Txt>
                <Txt variant="bodyStrong">{l.target}</Txt>
                {l.meta?.role && <Txt color="textMuted"> → {d.roles[l.meta.role]}</Txt>}
              </Txt>
              <Txt variant="small" color="textSubtle">{formatDate(l.createdAt, { year: false })} · {formatTime(l.createdAt)}</Txt>
            </Row>
          );
        })}
      </Card>
    </Screen>
  );
}
