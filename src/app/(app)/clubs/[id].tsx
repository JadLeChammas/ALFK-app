import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { ClubForm } from '@/components/ClubForm';
import { useDialogs } from '@/components/ui/Dialogs';
import { Avatar, Badge, Button, Card, EmptyState, IconButton, Input, Row, Segmented, Tap } from '@/components/ui/primitives';
import { BackLink, Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { fullName, useMe, useStore, useUserMap } from '@/data/store';
import type { ClubPost } from '@/data/types';
import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

type Tab = 'announcements' | 'discussion' | 'members';

/**
 * A club's page: presentation and joining (on request), then — for its members — the managers'
 * announcements and the group discussion; the members list, where managers accept requests and name
 * co-managers. Admins can do everything managers can.
 */
export default function ClubPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { d, f } = useI18n();
  const c = d.clubs;
  const { colors } = useTheme();
  const { isMobile } = useLayout();
  const { db, actions } = useStore();
  const { confirm, toast } = useDialogs();
  const me = useMe();
  const users = useUserMap();
  const [tab, setTab] = useState<Tab>('announcements');
  const [editing, setEditing] = useState(false);

  const club = db.clubs.find((x) => x.id === id);
  const admin = me.role === 'admin';
  if (!club || (club.status !== 'approved' && club.createdBy !== me.id && !admin)) {
    return (
      <Screen maxWidth={900}>
        <BackLink label={c.title} href="/clubs" />
        <EmptyState icon="grid" title={c.notFound} />
      </Screen>
    );
  }
  const rows = db.clubMembers.filter((m) => m.clubId === club.id);
  const mine = rows.find((m) => m.userId === me.id);
  const isMember = mine?.status === 'active';
  const manager = admin || (isMember && mine?.role === 'manager');
  const active = rows.filter((m) => m.status === 'active').sort((a, b) => (a.role === b.role ? fullName(users.get(a.userId)).localeCompare(fullName(users.get(b.userId))) : a.role === 'manager' ? -1 : 1));
  const requests = rows.filter((m) => m.status === 'pending');
  const posts = db.clubPosts.filter((p) => p.clubId === club.id);

  return (
    <Screen maxWidth={900}>
      <BackLink label={c.title} href="/clubs" />

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <View style={{ height: isMobile ? 140 : 220, backgroundColor: colors.secondarySoft }}>
          {!!club.cover && <Image source={{ uri: club.cover }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={200} />}
        </View>
        <View style={{ padding: 20, gap: 12 }}>
          <Row gap={10} wrap>
            <Txt variant="h1">{club.name}</Txt>
            {club.status !== 'approved' && <Badge label={club.status === 'pending' ? c.pending : c.rejected} tone={club.status === 'pending' ? 'warning' : 'danger'} />}
          </Row>
          {!!club.description && <Txt color="textMuted" style={{ lineHeight: 24 }}>{club.description}</Txt>}
          <Txt variant="small" color="textSubtle">{f(c.memberCount, { n: active.length })}</Txt>
          <Row gap={10} wrap>
            {club.status === 'approved' && !mine && <Button label={c.join} icon="user-plus" onPress={() => { if (actions.requestToJoinClub(club.id) !== false) toast(c.requestSent, 'success'); }} />}
            {mine?.status === 'pending' && <Button label={c.cancelRequest} icon="x" variant="secondary" onPress={() => actions.removeClubMember(club.id, me.id)} />}
            {isMember && mine?.role !== 'manager' && (
              <Button label={c.leave} icon="log-out" variant="secondary" onPress={async () => (await confirm({ title: c.leave, message: club.name, confirmLabel: c.leave })) && actions.removeClubMember(club.id, me.id)} />
            )}
            {manager && <Button label={c.edit} icon="edit-2" variant="secondary" onPress={() => setEditing(true)} />}
            {manager && (
              <Button
                label={c.delete}
                icon="trash-2"
                variant="danger"
                onPress={async () => {
                  if (await confirm({ title: c.delete, message: club.name, danger: true, confirmLabel: d.common.delete })) {
                    actions.deleteClub(club.id);
                    router.replace('/clubs');
                  }
                }}
              />
            )}
          </Row>
        </View>
      </Card>

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'announcements', label: c.announcements, icon: 'volume-2' },
          { value: 'discussion', label: c.discussion, icon: 'message-square' },
          { value: 'members', label: requests.length && manager ? `${c.members} (${requests.length})` : c.members, icon: 'users' },
        ]}
      />

      {tab !== 'members' && !isMember && !admin ? (
        <Card>
          <EmptyState icon="lock" title={c.membersOnly} subtitle={mine?.status === 'pending' ? c.requestSent : c.membersOnlySub} />
        </Card>
      ) : tab === 'announcements' ? (
        <Posts posts={posts.filter((p) => p.kind === 'announcement')} canWrite={manager} kind="announcement" clubId={club.id} />
      ) : tab === 'discussion' ? (
        <Posts posts={posts.filter((p) => p.kind === 'message')} canWrite={isMember || admin} kind="message" clubId={club.id} />
      ) : (
        <Card style={{ gap: 14 }}>
          {manager && requests.length > 0 && (
            <View style={{ gap: 10, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Txt variant="bodyStrong">{c.requests}</Txt>
              {requests.map((m) => {
                const u = users.get(m.userId);
                return (
                  <Row key={m.userId} gap={10}>
                    <Avatar uri={u?.avatar} name={u ? fullName(u) : '?'} size={36} />
                    <Txt style={{ flex: 1 }}>{u ? fullName(u) : '—'}</Txt>
                    <Button label={c.accept} icon="check" size="sm" onPress={() => actions.updateClubMember(club.id, m.userId, { status: 'active' })} />
                    <IconButton icon="x" size={32} label={c.refuse} onPress={() => actions.removeClubMember(club.id, m.userId)} />
                  </Row>
                );
              })}
            </View>
          )}
          {active.map((m) => {
            const u = users.get(m.userId);
            return (
              <Row key={m.userId} gap={10}>
                <Tap onPress={() => u && router.push(`/membre/${u.id}`)}>
                  <Avatar uri={u?.avatar} name={u ? fullName(u) : '?'} size={40} />
                </Tap>
                <View style={{ flex: 1 }}>
                  <Txt variant="bodyStrong">{u ? fullName(u) : c.formerMember}</Txt>
                  {u?.promo && <Txt variant="small" color="textSubtle">{f(d.common.promo, { year: u.promo })}</Txt>}
                </View>
                {m.role === 'manager' && <Badge label={c.manager} tone="secondary" />}
                {manager && m.userId !== me.id && (
                  <>
                    <Button
                      label={m.role === 'manager' ? c.unmakeManager : c.makeManager}
                      size="sm"
                      variant="ghost"
                      onPress={() => actions.updateClubMember(club.id, m.userId, { role: m.role === 'manager' ? 'member' : 'manager' })}
                    />
                    <IconButton
                      icon="user-x"
                      size={32}
                      label={c.remove}
                      onPress={async () => (await confirm({ title: c.remove, message: u ? fullName(u) : '', danger: true, confirmLabel: c.remove })) && actions.removeClubMember(club.id, m.userId)}
                    />
                  </>
                )}
              </Row>
            );
          })}
        </Card>
      )}

      {editing && <ClubForm editing={club} onClose={() => setEditing(false)} />}
    </Screen>
  );
}

/** Announcements (managers write) or the group discussion (members write); newest at the bottom. */
function Posts({ posts, canWrite, kind, clubId }: { posts: ClubPost[]; canWrite: boolean; kind: ClubPost['kind']; clubId: string }) {
  const { d, relative } = useI18n();
  const c = d.clubs;
  const { colors } = useTheme();
  const { actions } = useStore();
  const { confirm } = useDialogs();
  const me = useMe();
  const users = useUserMap();
  const [text, setText] = useState('');
  const list = kind === 'announcement' ? [...posts].reverse() : posts;
  const send = () => {
    if (actions.postToClub(clubId, kind, text) !== false) setText('');
  };
  return (
    <Card style={{ gap: 14 }}>
      {kind === 'announcement' && canWrite && <Composer value={text} onChange={setText} onSend={send} placeholder={c.announcementPlaceholder} />}
      {list.length === 0 && <Txt color="textMuted">{kind === 'announcement' ? c.noAnnouncements : c.noMessages}</Txt>}
      {list.map((p) => {
        const u = p.authorId ? users.get(p.authorId) : undefined;
        const mineOrAdmin = p.authorId === me.id || me.role === 'admin';
        return (
          <Row key={p.id} gap={10} style={{ alignItems: 'flex-start' }}>
            <Avatar uri={u?.avatar} name={u ? fullName(u) : '?'} size={36} />
            <View style={{ flex: 1, gap: 3, padding: 12, borderRadius: 14, backgroundColor: kind === 'announcement' ? colors.secondarySoft : p.authorId === me.id ? colors.primarySoft : colors.surfaceAlt }}>
              <Row gap={8} wrap>
                <Txt variant="smallStrong">{u ? fullName(u) : c.formerMember}</Txt>
                <Txt variant="small" color="textSubtle">{relative(p.createdAt)}</Txt>
              </Row>
              <Txt>{p.text}</Txt>
            </View>
            {mineOrAdmin && (
              <IconButton icon="trash-2" size={30} label={d.common.delete} onPress={async () => (await confirm({ title: d.common.delete, message: p.text, danger: true, confirmLabel: d.common.delete })) && actions.deleteClubPost(p.id)} />
            )}
          </Row>
        );
      })}
      {kind === 'message' && canWrite && <Composer value={text} onChange={setText} onSend={send} placeholder={c.messagePlaceholder} />}
    </Card>
  );
}

function Composer({ value, onChange, onSend, placeholder }: { value: string; onChange: (v: string) => void; onSend: () => void; placeholder: string }) {
  const { d } = useI18n();
  return (
    <Row gap={8} style={{ alignItems: 'flex-end' }}>
      <Input value={value} onChangeText={onChange} placeholder={placeholder} multiline maxLength={4000} containerStyle={{ flex: 1, borderRadius: radius.card }} />
      <Button label={d.common.send} icon="send" disabled={!value.trim()} onPress={onSend} />
    </Row>
  );
}
