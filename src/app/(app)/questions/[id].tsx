import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { useDialogs } from '@/components/ui/Dialogs';
import { Avatar, Badge, Button, Card, EmptyState, IconButton, Input, Row, Tap } from '@/components/ui/primitives';
import { BackLink, Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { occupation } from '@/data/members';
import { canAnswer } from '@/data/permissions';
import { fullName, useMe, useStore, useUserMap } from '@/data/store';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

/** One anonymous question and the alumni's (signed) answers. */
export default function QuestionPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { d, f, relative } = useI18n();
  const { colors } = useTheme();
  const { db, actions } = useStore();
  const { confirm, toast } = useDialogs();
  const users = useUserMap();
  const me = useMe();
  const [reply, setReply] = useState('');
  const admin = me.role === 'admin';
  const found = db.questions.find((q) => q.id === id);
  const q = found && (found.status === 'published' || found.authorId === me.id || admin) ? found : undefined;

  if (!q) {
    return (
      <Screen>
        <BackLink label={d.questions.title} href="/questions" />
        <EmptyState icon="help-circle" title={d.questions.notFound} />
      </Screen>
    );
  }
  const answers = db.answers.filter((a) => a.questionId === q.id);
  const author = admin && q.authorId ? users.get(q.authorId) : undefined;
  const mine = q.authorId === me.id;

  return (
    <Screen maxWidth={860}>
      <BackLink label={d.questions.title} href="/questions" />
      <Card style={{ gap: 14 }}>
        <Row gap={8} wrap>
          <Badge label={d.questions.topics[q.topic]} tone="secondary" />
          {q.status === 'pending' && <Badge label={d.questions.pending} tone="warning" icon="clock" />}
          {q.status === 'rejected' && <Badge label={d.questions.rejected} tone="danger" icon="x" />}
          {mine && <Badge label={d.questions.yours} tone="primary" icon="user" />}
        </Row>
        <Row gap={12} style={{ alignItems: 'flex-start' }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="help-circle" size={20} color={colors.textSubtle} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Txt variant="smallStrong" color="textMuted">{`${d.questions.anonymous} · ${relative(q.publishedAt ?? q.createdAt)}`}</Txt>
            <Txt variant="h3">{q.text}</Txt>
          </View>
        </Row>
        {author && (
          <Row gap={6} wrap>
            <Badge icon="lock" tone="neutral" label={f(d.questions.askedBy, { name: fullName(author) })} />
            <Txt variant="small" color="textSubtle">{d.questions.askedByNote}</Txt>
          </Row>
        )}
        {admin && (
          <Row gap={8}>
            <Button
              label={d.common.delete}
              icon="trash-2"
              size="sm"
              variant="ghost"
              onPress={async () => {
                if (await confirm({ title: d.common.delete, message: q.text, danger: true, confirmLabel: d.common.delete })) {
                  actions.deleteQuestion(q.id);
                  router.replace('/questions');
                }
              }}
            />
          </Row>
        )}
      </Card>

      <Txt variant="caption">{answers.length === 0 ? d.questions.noAnswers : answers.length === 1 ? d.questions.answerOne : f(d.questions.answerMany, { n: answers.length })}</Txt>
      {answers.map((a) => {
        const u = a.authorId ? users.get(a.authorId) : undefined;
        return (
          <Card key={a.id} style={{ gap: 10 }}>
            <Row gap={12}>
              <Tap onPress={() => u && router.push(`/membre/${u.id}`)} disabled={!u} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Avatar uri={u?.avatar} name={u ? fullName(u) : '?'} size={38} />
                <View style={{ flex: 1 }}>
                  <Txt variant="bodyStrong" numberOfLines={1}>{u ? fullName(u) : d.questions.formerMember}</Txt>
                  <Txt variant="small" color="textSubtle" numberOfLines={1}>
                    {[u?.promo && f(d.common.promo, { year: u.promo }), u && occupation(u), relative(a.createdAt)].filter(Boolean).join(' · ')}
                  </Txt>
                </View>
              </Tap>
              {(admin || a.authorId === me.id) && (
                <IconButton
                  icon="trash-2"
                  size={32}
                  label={d.common.delete}
                  onPress={async () => {
                    if (await confirm({ title: d.common.delete, message: a.text, danger: true, confirmLabel: d.common.delete })) actions.deleteAnswer(a.id);
                  }}
                />
              )}
            </Row>
            <Txt>{a.text}</Txt>
          </Card>
        );
      })}

      {q.status === 'published' && canAnswer(me) && (
        <Card style={{ gap: 12 }}>
          <Input label={d.questions.answerField} value={reply} onChangeText={setReply} placeholder={d.questions.answerPlaceholder} multiline maxLength={3000} />
          <Txt variant="small" color="textSubtle">{d.questions.signedNote}</Txt>
          <Button
            label={d.questions.reply}
            icon="send"
            disabled={!reply.trim()}
            onPress={() => {
              if (actions.answerQuestion(q.id, reply.trim()) === false) return;
              setReply('');
              toast(d.questions.answered);
            }}
          />
        </Card>
      )}
      {q.status === 'published' && !canAnswer(me) && <Txt variant="small" color="textSubtle" align="center">{d.questions.onlyAlumni}</Txt>}
    </Screen>
  );
}
