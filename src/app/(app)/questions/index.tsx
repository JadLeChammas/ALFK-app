import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Sheet } from '@/components/forms';
import { QuestionReviewList } from '@/components/QuestionReview';
import { useDialogs } from '@/components/ui/Dialogs';
import { Badge, Button, Card, Chip, EmptyState, Input, Row, Tap } from '@/components/ui/primitives';
import { PageHeader, Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { canAsk } from '@/data/permissions';
import { useMe, useStore } from '@/data/store';
import type { Question, QuestionTopic } from '@/data/types';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

const TOPICS: QuestionTopic[] = ['etudes', 'orientation', 'pays', 'metier', 'vie', 'autre'];

type Filter = 'all' | 'unanswered' | 'mine';

/** Anonymous questions: students ask, admins verify, alumni answer. */
export default function Questions() {
  const { d } = useI18n();
  const { db } = useStore();
  const me = useMe();
  const [filter, setFilter] = useState<Filter>('all');
  const [topic, setTopic] = useState<QuestionTopic | null>(null);
  const [asking, setAsking] = useState(false);
  const asker = canAsk(me);

  const count = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of db.answers) m.set(a.questionId, (m.get(a.questionId) ?? 0) + 1);
    return m;
  }, [db.answers]);

  const list = db.questions
    .filter((q) => (filter === 'mine' ? q.authorId === me.id : q.status === 'published'))
    .filter((q) => filter !== 'unanswered' || !count.get(q.id))
    .filter((q) => !topic || q.topic === topic)
    .sort((a, b) => ((a.publishedAt ?? a.createdAt) < (b.publishedAt ?? b.createdAt) ? 1 : -1));

  return (
    <Screen>
      <PageHeader title={d.questions.title} subtitle={d.questions.subtitle} right={asker && <Button label={d.questions.ask} icon="edit-3" onPress={() => setAsking(true)} />} />
      {me.role === 'admin' && <QuestionReviewList />}

      <View style={{ gap: 10 }}>
        <Row gap={8} wrap>
          <Chip label={d.questions.all} active={filter === 'all'} onPress={() => setFilter('all')} />
          <Chip label={d.questions.unanswered} icon="message-circle" active={filter === 'unanswered'} onPress={() => setFilter('unanswered')} />
          {asker && <Chip label={d.questions.mine} icon="user" active={filter === 'mine'} onPress={() => setFilter('mine')} />}
        </Row>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {TOPICS.map((t) => (
            <Chip key={t} label={d.questions.topics[t]} active={topic === t} onPress={() => setTopic(topic === t ? null : t)} />
          ))}
        </ScrollView>
      </View>

      {list.length === 0 ? (
        <Card>
          <EmptyState icon="help-circle" title={d.questions.empty} action={asker ? <Button label={d.questions.ask} icon="edit-3" onPress={() => setAsking(true)} /> : undefined} />
        </Card>
      ) : (
        <View style={{ gap: 12 }}>
          {list.map((q) => <QuestionRow key={q.id} q={q} answers={count.get(q.id) ?? 0} />)}
        </View>
      )}

      <AskSheet visible={asking} onClose={() => setAsking(false)} />
    </Screen>
  );
}

function QuestionRow({ q, answers }: { q: Question; answers: number }) {
  const { d, f, relative } = useI18n();
  const { colors } = useTheme();
  return (
    <Tap
      onPress={() => router.push(`/questions/${q.id}`)}
      style={{ padding: 18, gap: 10, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
      hoverStyle={{ borderColor: colors.borderStrong }}>
      <Row gap={8} wrap>
        <Badge label={d.questions.topics[q.topic]} tone="secondary" />
        {q.status === 'pending' && <Badge label={d.questions.pending} tone="warning" icon="clock" />}
        {q.status === 'rejected' && <Badge label={d.questions.rejected} tone="danger" icon="x" />}
        <Txt variant="small" color="textSubtle">{relative(q.publishedAt ?? q.createdAt)}</Txt>
      </Row>
      <Txt variant="bodyStrong" numberOfLines={3}>{q.text}</Txt>
      <Row gap={6}>
        <Feather name="message-circle" size={14} color={answers ? colors.primary : colors.textSubtle} />
        <Txt variant="small" style={{ color: answers ? colors.primary : colors.textSubtle }}>
          {answers === 0 ? d.questions.noAnswers : answers === 1 ? d.questions.answerOne : f(d.questions.answerMany, { n: answers })}
        </Txt>
      </Row>
    </Tap>
  );
}

function AskSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { d } = useI18n();
  const { colors } = useTheme();
  const { actions } = useStore();
  const { toast } = useDialogs();
  const [text, setText] = useState('');
  const [topic, setTopic] = useState<QuestionTopic>('etudes');
  const ok = text.trim().length >= 10;
  return (
    <Sheet visible={visible} title={d.questions.ask} onClose={onClose}>
      <Row gap={10} style={{ padding: 12, borderRadius: 14, backgroundColor: colors.secondarySoft, alignItems: 'flex-start' }}>
        <Feather name="eye-off" size={16} color={colors.secondary} style={{ marginTop: 2 }} />
        <Txt variant="small" style={{ flex: 1 }}>{d.questions.anonNote}</Txt>
      </Row>
      <Input label={d.questions.askField} value={text} onChangeText={setText} placeholder={d.questions.askPlaceholder} multiline maxLength={1000} />
      <View style={{ gap: 8 }}>
        <Txt variant="smallStrong" color="textMuted">{d.questions.topic}</Txt>
        <Row gap={8} wrap>
          {TOPICS.map((t) => (
            <Chip key={t} label={d.questions.topics[t]} active={topic === t} onPress={() => setTopic(t)} />
          ))}
        </Row>
      </View>
      <Button
        label={d.questions.send}
        icon="send"
        full
        size="lg"
        disabled={!ok}
        onPress={() => {
          if (actions.askQuestion(text.trim(), topic) === false) return;
          toast(d.questions.sent);
          setText('');
          onClose();
        }}
      />
    </Sheet>
  );
}
