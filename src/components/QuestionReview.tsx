import { View } from 'react-native';

import { fullName, useStore, useUserMap } from '@/data/store';
import { useI18n } from '@/i18n';
import { useDialogs } from './ui/Dialogs';
import { Badge, Button, Card, EmptyState, Row, SectionHeader } from './ui/primitives';
import { Txt } from './ui/Txt';

/**
 * Admins: anonymous questions waiting for verification. The author's name is shown here only,
 * so a question can be reworded before publication if a detail gives the student away.
 */
export function QuestionReviewList({ showEmpty }: { showEmpty?: boolean }) {
  const { d, f, relative } = useI18n();
  const { db, actions } = useStore();
  const { confirm, prompt, toast } = useDialogs();
  const users = useUserMap();
  const queue = db.questions.filter((q) => q.status === 'pending').sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  if (!queue.length && !showEmpty) return null;

  return (
    <Card>
      <SectionHeader title={d.questions.queue} icon="help-circle" count={String(queue.length)} />
      {queue.length === 0 ? (
        <EmptyState icon="check-circle" title={d.questions.queueEmpty} />
      ) : (
        <View style={{ gap: 20 }}>
          {queue.map((q) => {
            const author = q.authorId ? users.get(q.authorId) : undefined;
            return (
              <View key={q.id} style={{ gap: 10 }}>
                <Row gap={8} wrap>
                  <Badge label={d.questions.topics[q.topic]} tone="secondary" />
                  <Txt variant="small" color="textSubtle">{relative(q.createdAt)}</Txt>
                </Row>
                <Txt>{q.text}</Txt>
                {author && (
                  <Row gap={6}>
                    <Badge icon="lock" tone="neutral" label={f(d.questions.askedBy, { name: fullName(author) })} />
                    <Txt variant="small" color="textSubtle">{d.questions.askedByNote}</Txt>
                  </Row>
                )}
                <Row gap={8} wrap>
                  <Button
                    label={d.questions.publish}
                    icon="check"
                    size="sm"
                    onPress={() => {
                      actions.reviewQuestion(q.id, 'published');
                      toast(d.questions.published);
                    }}
                  />
                  <Button
                    label={d.questions.reword}
                    icon="edit-2"
                    size="sm"
                    variant="secondary"
                    onPress={async () => {
                      const text = await prompt({ title: d.questions.reword, message: d.questions.rewordHint, initial: q.text, multiline: true, confirmLabel: d.questions.publish });
                      if (text && text.trim().length >= 5) {
                        actions.reviewQuestion(q.id, 'published', text.trim());
                        toast(d.questions.published);
                      }
                    }}
                  />
                  <Button
                    label={d.questions.reject}
                    icon="x"
                    size="sm"
                    variant="danger"
                    onPress={async () => {
                      if (await confirm({ title: d.questions.reject, message: q.text, danger: true, confirmLabel: d.questions.reject })) actions.reviewQuestion(q.id, 'rejected');
                    }}
                  />
                </Row>
              </View>
            );
          })}
        </View>
      )}
    </Card>
  );
}
