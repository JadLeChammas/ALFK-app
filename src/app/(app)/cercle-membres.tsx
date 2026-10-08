import { router } from 'expo-router';
import { View } from 'react-native';

import { RoleBadge, useStartConversation } from '@/components/cards';
import { Avatar, Button, Card, EmptyState, MetaLine } from '@/components/ui/primitives';
import { Grid, PageHeader, Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { countryByCode } from '@/data/countries';
import { canMessage } from '@/data/permissions';
import { fullName, useApprovedMembers, useMe } from '@/data/store';
import { useI18n } from '@/i18n';

/** Section « MH »: the honorary members — who they are, where they live, and a message to each. */
export default function CircleMembers() {
  const { d, country } = useI18n();
  const me = useMe();
  const start = useStartConversation();
  const honorary = useApprovedMembers()
    .filter((u) => u.role === 'honneur')
    .sort((a, b) => a.lastName.localeCompare(b.lastName));

  return (
    <Screen maxWidth={1000}>
      <PageHeader title={d.mh.members} subtitle={d.mh.membersSub} />
      {honorary.length === 0 ? (
        <Card>
          <EmptyState icon="award" title={d.circle.noMembers} />
        </Card>
      ) : (
        <Grid min={240} gap={14}>
          {honorary.map((u) => {
            const c = countryByCode(u.country);
            return (
              <Card key={u.id} onPress={() => router.push(`/membre/${u.id}`)} style={{ gap: 10, alignItems: 'center', height: '100%' }}>
                <Avatar uri={u.avatar} name={fullName(u)} size={64} />
                <View style={{ alignItems: 'center', gap: 2 }}>
                  <Txt variant="h3" align="center">{fullName(u)}</Txt>
                  {!!u.fonction && <Txt variant="small" color="textMuted" align="center">{u.fonction}</Txt>}
                  {!!u.employer && <Txt variant="small" color="textSubtle" align="center">{u.employer}</Txt>}
                </View>
                {c && <MetaLine icon="map-pin" text={[u.city, country(c.code)].filter(Boolean).join(', ')} />}
                <RoleBadge role={u.role} />
                {u.id !== me.id && canMessage(me, u) && <Button label={d.circle.write} icon="message-circle" size="sm" variant="secondary" onPress={() => start(u.id)} />}
              </Card>
            );
          })}
        </Grid>
      )}
    </Screen>
  );
}
