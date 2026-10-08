import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { useDialogs } from '@/components/ui/Dialogs';
import { Avatar, Button, Card, IconButton, Input, Row, SectionHeader, Tap } from '@/components/ui/primitives';
import { PageHeader, Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { fullName, useMe, useStore, useUserMap } from '@/data/store';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * The honorary members' circle: their group discussion (section « MH »). Read and written by the
 * honorary members and the admins given « Accès à l'espace MH » — guarded in (app)/_layout.tsx and by
 * the database (in_circle, migration 052). The members' list is /cercle-membres.
 */
export default function Circle() {
  const { d, relative } = useI18n();
  const c = d.circle;
  const { colors } = useTheme();
  const { db, actions } = useStore();
  const { confirm } = useDialogs();
  const me = useMe();
  const users = useUserMap();
  const [text, setText] = useState('');
  const messages = db.circleMessages;

  const send = () => {
    if (!text.trim()) return;
    if (actions.postCircleMessage(text) !== false) setText('');
  };

  return (
    <Screen maxWidth={1000}>
      <PageHeader title={c.title} subtitle={d.mh.circleSub} />

      <Card style={{ gap: 14 }}>
        <SectionHeader title={c.discussion} icon="message-square" />
        <Txt variant="small" color="textSubtle">{d.mh.discussionHint}</Txt>
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
