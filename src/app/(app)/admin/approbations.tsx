import { Linking, Platform, View } from 'react-native';

import { AdminNav } from '@/components/AdminNav';
import { RoleBadge } from '@/components/cards';
import { useDialogs } from '@/components/ui/Dialogs';
import { Avatar, Badge, Button, Card, EmptyState, MetaLine, Row } from '@/components/ui/primitives';
import { Grid, PageHeader, Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { countryByCode } from '@/data/countries';
import { fullName, useStore } from '@/data/store';
import { useI18n } from '@/i18n';

export default function Approvals() {
  const { d, f, relative, country } = useI18n();
  const { db, actions } = useStore();
  const { confirm, toast } = useDialogs();
  const pending = db.users.filter((u) => !u.approved).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return (
    <Screen>
      <PageHeader title={d.admin.approvals} subtitle={d.admin.approvalsSub} />
      <AdminNav />
      {pending.length === 0 ? (
        <Card>
          <EmptyState icon="check-circle" title={d.admin.noPending} />
        </Card>
      ) : (
        <Grid min={320} gap={16}>
          {pending.map((u) => {
            const c = countryByCode(u.country);
            return (
              <Card key={u.id} style={{ gap: 16, height: '100%' }}>
                <Row gap={14}>
                  <Avatar uri={u.avatar} name={fullName(u)} size={56} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Txt variant="h3">{fullName(u)}</Txt>
                    <Row gap={8} wrap>
                      <RoleBadge role={u.role} />
                      <Txt variant="small" color="textSubtle">{f(d.admin.pendingSince, { when: relative(u.createdAt) })}</Txt>
                    </Row>
                  </View>
                </Row>
                <View style={{ gap: 8 }}>
                  <MetaLine icon="mail" text={u.email} />
                  {u.promo && <MetaLine icon="award" text={f(d.common.promo, { year: u.promo })} />}
                  {u.school && <MetaLine icon="book" text={u.school} />}
                  {c && <MetaLine icon="map-pin" text={[u.city, country(c.code)].filter(Boolean).join(', ')} />}
                  <MetaLine icon="user" text={d.gender[u.gender]} />
                </View>
                <Row gap={8} wrap>
                  {u.proof ? (
                    <>
                      <Badge label={d.proof.received} tone="success" icon="file-text" />
                      <Button
                        label={d.proof.view}
                        icon="external-link"
                        size="sm"
                        variant="secondary"
                        onPress={async () => {
                          const url = await actions.openProof(u.id);
                          if (!url) return toast(d.auth.errors.unknown, 'danger');
                          if (Platform.OS === 'web') window.open(url, '_blank', 'noopener');
                          else Linking.openURL(url);
                        }}
                      />
                    </>
                  ) : u.createdByAdmin ? (
                    <Badge label={d.proof.adminCreated} tone="info" icon="shield" />
                  ) : (
                    <Badge label={d.proof.none} tone="danger" icon="alert-triangle" />
                  )}
                </Row>
                <View style={{ flex: 1 }} />
                <Row gap={10}>
                  <Button
                    label={d.admin.approve}
                    icon="check"
                    style={{ flex: 1 }}
                    disabled={!u.proof && !u.createdByAdmin}
                    onPress={() => {
                      const r = actions.approveUser(u.id);
                      toast(r.ok ? `${fullName(u)} ✓` : d.admin.proofRequired, r.ok ? 'success' : 'danger');
                    }}
                  />
                  <Button
                    label={d.admin.refuse}
                    icon="x"
                    variant="danger"
                    onPress={async () => {
                      if (await confirm({ title: d.admin.refuse, message: f(d.admin.refuseConfirm, { name: fullName(u) }), danger: true, confirmLabel: d.admin.refuse })) {
                        const r = await actions.refuseUser(u.id);
                        if (!r.ok) toast(d.auth.errors.unknown, 'danger');
                      }
                    }}
                  />
                </Row>
              </Card>
            );
          })}
        </Grid>
      )}
    </Screen>
  );
}
