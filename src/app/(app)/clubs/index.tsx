import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { ClubForm } from '@/components/ClubForm';
import { Badge, Button, Card, EmptyState, Row, SectionHeader } from '@/components/ui/primitives';
import { Grid, PageHeader, Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { fullName, useMe, useStore, useUserMap } from '@/data/store';
import type { Club } from '@/data/types';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Clubs: the approved clubs, mine waiting for the admins, and (admins) the proposals to review.
 * Alumni and admins only — guarded in (app)/_layout.tsx (canSeeClubs).
 */
export default function Clubs() {
  const { d, f } = useI18n();
  const c = d.clubs;
  const { db, actions } = useStore();
  const me = useMe();
  const users = useUserMap();
  const admin = me.role === 'admin';
  const [proposing, setProposing] = useState(false);
  const approved = db.clubs.filter((x) => x.status === 'approved');
  const toReview = admin ? db.clubs.filter((x) => x.status === 'pending') : [];
  const mine = db.clubs.filter((x) => x.status !== 'approved' && x.createdBy === me.id && !admin);
  const count = (id: string) => db.clubMembers.filter((m) => m.clubId === id && m.status === 'active').length;
  const myStatus = (id: string) => db.clubMembers.find((m) => m.clubId === id && m.userId === me.id);

  return (
    <Screen>
      <PageHeader title={c.title} subtitle={c.subtitle} right={<Button label={c.propose} icon="plus" onPress={() => setProposing(true)} />} />

      {toReview.length > 0 && (
        <View style={{ gap: 14 }}>
          <SectionHeader title={c.toReview} icon="clock" count={String(toReview.length)} />
          <Grid min={300} gap={16}>
            {toReview.map((x) => (
              <Card key={x.id} style={{ gap: 10 }}>
                <Txt variant="h3">{x.name}</Txt>
                {!!x.description && <Txt variant="small" color="textMuted" numberOfLines={4}>{x.description}</Txt>}
                <Txt variant="small" color="textSubtle">{f(c.proposedBy, { name: fullName(users.get(x.createdBy ?? '')) || '—' })}</Txt>
                <Row gap={8} wrap>
                  <Button label={c.approve} icon="check" size="sm" onPress={() => actions.reviewClub(x.id, 'approved')} />
                  <Button label={c.reject} icon="x" size="sm" variant="secondary" onPress={() => actions.reviewClub(x.id, 'rejected')} />
                </Row>
              </Card>
            ))}
          </Grid>
        </View>
      )}

      {mine.length > 0 && (
        <View style={{ gap: 14 }}>
          <SectionHeader title={c.mine} icon="send" count={String(mine.length)} />
          <Grid min={280} gap={16}>
            {mine.map((x) => (
              <Card key={x.id} style={{ gap: 8 }}>
                <Txt variant="h3">{x.name}</Txt>
                <Badge label={x.status === 'pending' ? c.pending : c.rejected} tone={x.status === 'pending' ? 'warning' : 'danger'} />
              </Card>
            ))}
          </Grid>
        </View>
      )}

      <View style={{ gap: 14 }}>
        <SectionHeader title={c.all} icon="grid" count={String(approved.length)} />
        {approved.length === 0 ? (
          <Card>
            <EmptyState icon="grid" title={c.empty} subtitle={c.emptySub} action={<Button label={c.propose} icon="plus" onPress={() => setProposing(true)} />} />
          </Card>
        ) : (
          <Grid min={280} gap={16}>
            {approved.map((x) => (
              <ClubCard key={x.id} club={x} members={count(x.id)} status={myStatus(x.id)?.status} manager={myStatus(x.id)?.role === 'manager'} />
            ))}
          </Grid>
        )}
      </View>

      {proposing && <ClubForm onClose={() => setProposing(false)} />}
    </Screen>
  );
}

function ClubCard({ club, members, status, manager }: { club: Club; members: number; status?: 'pending' | 'active'; manager: boolean }) {
  const { d, f } = useI18n();
  const c = d.clubs;
  const { colors } = useTheme();
  return (
    <Card onPress={() => router.push(`/clubs/${club.id}`)} style={{ padding: 0, overflow: 'hidden', height: '100%' }}>
      <View style={{ height: 120, backgroundColor: colors.secondarySoft }}>
        {!!club.cover && <Image source={{ uri: club.cover }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={200} />}
      </View>
      <View style={{ padding: 16, gap: 8 }}>
        <Txt variant="h3" numberOfLines={1}>{club.name}</Txt>
        {!!club.description && <Txt variant="small" color="textMuted" numberOfLines={2}>{club.description}</Txt>}
        <Row gap={8} wrap>
          <Txt variant="small" color="textSubtle">{f(c.memberCount, { n: members })}</Txt>
          {manager ? <Badge label={c.manager} tone="secondary" /> : status === 'active' ? <Badge label={c.member} tone="success" /> : status === 'pending' ? <Badge label={c.requested} tone="warning" /> : null}
        </Row>
      </View>
    </Card>
  );
}
