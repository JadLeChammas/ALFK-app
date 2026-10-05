import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { RoleBadge, useStartConversation } from '@/components/cards';
import { useDialogs } from '@/components/ui/Dialogs';
import { Avatar, Button, Card, EmptyState, IconButton, Input, Row, SectionHeader, Tap } from '@/components/ui/primitives';
import { Grid, PageHeader, Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { fullName, useApprovedMembers, useMe, useStore, useUserMap } from '@/data/store';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * The honorary members' circle: who they are, and a group discussion only they and the admins see.
 * Guarded in (app)/_layout.tsx (honorary members and admins).
 */
export default function Circle() {
  const { d, relative } = useI18n();
  const c = d.circle;
  const { colors } = useTheme();
  const { db, actions } = useStore();
  const { confirm } = useDialogs();
  const me = useMe();
  const users = useUserMap();
  const start = useStartConversation();
  const honorary = useApprovedMembers().filter((u) => u.role === 'honneur');
  const [text, setText] = useState('');
  const messages = db.circleMessages;

  const send = () => {
    if (!text.trim()) return;
    if (actions.postCircleMessage(text) !== false) setText('');
  };

  return (
    <Screen maxWidth={1000}>
      <PageHeader title={c.title} subtitle={c.subtitle} />

      <View style={{ gap: 14 }}>
        <SectionHeader title={c.members} icon="award" count={String(honorary.length)} />
        {honorary.length === 0 ? (
          <Card>
            <EmptyState icon="award" title={c.noMembers} />
          </Card>
        ) : (
          <Grid min={240} gap={14}>
            {honorary.map((u) => (
              <Card key={u.id} onPress={() => router.push(`/membre/${u.id}`)} style={{ gap: 10, alignItems: 'center', height: '100%' }}>
                <Avatar uri={u.avatar} name={fullName(u)} size={64} />
                <View style={{ alignItems: 'center', gap: 2 }}>
                  <Txt variant="h3" align="center">{fullName(u)}</Txt>
                  {!!u.fonction && <Txt variant="small" color="textMuted" align="center">{u.fonction}</Txt>}
                  {!!u.employer && <Txt variant="small" color="textSubtle" align="center">{u.employer}</Txt>}
                </View>
                <RoleBadge role={u.role} />
                {u.id !== me.id && <Button label={c.write} icon="message-circle" size="sm" variant="secondary" onPress={() => start(u.id)} />}
              </Card>
            ))}
          </Grid>
        )}
      </View>

      <Card style={{ gap: 14 }}>
        <SectionHeader title={c.discussion} icon="message-square" />
        <Txt variant="small" color="textSubtle">{c.discussionHint}</Txt>
        {messages.length === 0 && <Txt color="textMuted">{c.empty}</Txt>}
        <View style={{ gap: 14 }}>
          {messages.map((m) => {
            const u = m.authorId ? users.get(m.authorId) : undefined;
            const mine = m.authorId === me.id;
            return (
              <Row key={m.id} gap={10} style={{ alignItems: 'flex-start' }}>
                <Tap onPress={() => u && router.push(`/membre/${u.id}`)} disabled={!u}>
                  <Avatar uri={u?.avatar} name={u ? fullName(u) : '?'} size={36} />
                </Tap>
                <View style={{ flex: 1, gap: 3, padding: 12, borderRadius: 14, backgroundColor: mine ? colors.primarySoft : colors.surfaceAlt }}>
                  <Row gap={8} wrap>
                    <Txt variant="smallStrong">{u ? fullName(u) : c.formerMember}</Txt>
                    {u?.fonction && <Txt variant="small" color="textSubtle">{u.fonction}</Txt>}
                    <Txt variant="small" color="textSubtle">{relative(m.createdAt)}</Txt>
                  </Row>
                  <Txt>{m.text}</Txt>
                </View>
                {(mine || me.role === 'admin') && (
                  <IconButton
                    icon="trash-2"
                    size={30}
                    label={d.common.delete}
                    onPress={async () => {
                      if (await confirm({ title: d.common.delete, message: m.text, danger: true, confirmLabel: d.common.delete })) actions.deleteCircleMessage(m.id);
                    }}
                  />
                )}
              </Row>
            );
          })}
        </View>
        <Row gap={8} style={{ alignItems: 'flex-end' }}>
          <Input value={text} onChangeText={setText} placeholder={c.placeholder} multiline maxLength={2000} containerStyle={{ flex: 1 }} />
          <Button label={d.common.send} icon="send" disabled={!text.trim()} onPress={send} />
        </Row>
      </Card>
    </Screen>
  );
}
