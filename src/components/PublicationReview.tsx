import { router } from 'expo-router';
import { View } from 'react-native';

import { fullName, useStore, useUserMap } from '@/data/store';
import { useI18n } from '@/i18n';
import { useDialogs } from './ui/Dialogs';
import { Avatar, Button, Card, EmptyState, Row, SectionHeader } from './ui/primitives';
import { Txt } from './ui/Txt';

/** Admins: members' announcements waiting for verification, with publish / reject. */
export function PublicationReviewList({ showEmpty }: { showEmpty?: boolean }) {
  const { d, relative } = useI18n();
  const { db, actions } = useStore();
  const { confirm, toast } = useDialogs();
  const users = useUserMap();
  const queue = db.publications.filter((p) => p.status === 'pending').sort((a, b) => (a.date < b.date ? -1 : 1));
  if (!queue.length && !showEmpty) return null;

  return (
    <Card>
      <SectionHeader title={d.pubReview.queue} icon="inbox" count={String(queue.length)} />
      {queue.length === 0 ? (
        <EmptyState icon="check-circle" title={d.pubReview.queueEmpty} />
      ) : (
        <View style={{ gap: 18 }}>
          {queue.map((p) => {
            const author = users.get(p.authorId);
            return (
              <View key={p.id} style={{ gap: 10 }}>
                <Row gap={10}>
                  <Avatar uri={author?.avatar} name={author ? fullName(author) : '?'} size={34} />
                  <View style={{ flex: 1 }}>
                    <Txt variant="bodyStrong" numberOfLines={1}>{p.title}</Txt>
                    <Txt variant="small" color="textSubtle" numberOfLines={1}>{[author && fullName(author), relative(p.date)].filter(Boolean).join(' · ')}</Txt>
                  </View>
                </Row>
                <Txt variant="small" color="textMuted" numberOfLines={3}>{p.body}</Txt>
                <Row gap={8} wrap>
                  <Button
                    label={d.pubReview.approve}
                    icon="check"
                    size="sm"
                    onPress={() => {
                      actions.reviewPublication(p.id, 'published');
                      toast(d.pubReview.published);
                    }}
                  />
                  <Button label={d.common.see} icon="eye" size="sm" variant="secondary" onPress={() => router.push(`/publications/${p.id}`)} />
                  <Button
                    label={d.pubReview.reject}
                    icon="x"
                    size="sm"
                    variant="danger"
                    onPress={async () => {
                      if (await confirm({ title: d.pubReview.reject, message: p.title, danger: true, confirmLabel: d.pubReview.reject })) actions.reviewPublication(p.id, 'rejected');
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
