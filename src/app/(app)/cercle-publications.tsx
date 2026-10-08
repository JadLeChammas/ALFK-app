import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { CoverPicker } from '@/components/forms';
import { useDialogs } from '@/components/ui/Dialogs';
import { Avatar, Button, Card, EmptyState, IconButton, Input, Row, SectionHeader, Tap } from '@/components/ui/primitives';
import { PageHeader, Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { fullName, useMe, useStore, useUserMap } from '@/data/store';
import { useI18n } from '@/i18n';
import { radius } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Section « MH »: private publications — read and written only by the honorary members and the admins
 * given « Accès à l'espace MH » (guarded in (app)/_layout.tsx; table circle_posts, migration 052).
 */
export default function CirclePublications() {
  const { d, relative } = useI18n();
  const m = d.mh;
  const { colors } = useTheme();
  const { db, actions } = useStore();
  const { confirm, toast } = useDialogs();
  const me = useMe();
  const users = useUserMap();
  const [writing, setWriting] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [image, setImage] = useState('');
  const [uploading, setUploading] = useState(false);

  const publish = () => {
    const r = actions.postCirclePost({ title, body, image: image.trim() || undefined });
    if (!r.ok) return;
    setTitle('');
    setBody('');
    setImage('');
    setWriting(false);
    toast(m.published, 'success');
  };

  return (
    <Screen maxWidth={860}>
      <PageHeader title={m.publications} subtitle={m.publicationsSub} right={!writing && <Button label={m.newPost} icon="edit-3" onPress={() => setWriting(true)} />} />

      {writing && (
        <Card style={{ gap: 14 }}>
          <SectionHeader title={m.newPost} icon="edit-3" />
          <Input label={m.postTitle} value={title} onChangeText={setTitle} maxLength={160} />
          <Input label={m.postBody} value={body} onChangeText={setBody} multiline maxLength={8000} style={{ minHeight: 160, textAlignVertical: 'top' }} />
          <CoverPicker value={image} onChange={setImage} folder="circle" onBusy={setUploading} />
          <Row gap={8} wrap>
            <Button label={m.publish} icon="send" onPress={publish} disabled={!title.trim() || !body.trim() || uploading} />
            <Button label={d.common.cancel} variant="ghost" onPress={() => setWriting(false)} />
          </Row>
        </Card>
      )}

      {db.circlePosts.length === 0 && !writing ? (
        <Card>
          <EmptyState icon="book-open" title={m.empty} action={<Button label={m.newPost} icon="edit-3" variant="secondary" onPress={() => setWriting(true)} />} />
        </Card>
      ) : (
        <View style={{ gap: 14 }}>
          {db.circlePosts.map((p) => {
            const author = p.authorId ? users.get(p.authorId) : undefined;
            const canDelete = p.authorId === me.id || me.role === 'admin';
            return (
              <Card key={p.id} style={{ gap: 12 }}>
                <Row gap={10}>
                  <Tap onPress={() => author && router.push(`/membre/${author.id}`)} disabled={!author}>
                    <Avatar uri={author?.avatar} name={author ? fullName(author) : '?'} size={38} />
                  </Tap>
                  <View style={{ flex: 1 }}>
                    <Txt variant="smallStrong">{author ? fullName(author) : d.circle.formerMember}</Txt>
                    <Txt variant="small" color="textSubtle">{[author?.fonction, relative(p.createdAt)].filter(Boolean).join(' · ')}</Txt>
                  </View>
                  {canDelete && (
                    <IconButton
                      icon="trash-2"
                      size={32}
                      label={d.common.delete}
                      onPress={async () => {
                        if (await confirm({ title: d.common.delete, message: p.title, danger: true, confirmLabel: d.common.delete })) actions.deleteCirclePost(p.id);
                      }}
                    />
                  )}
                </Row>
                <Txt variant="h3">{p.title}</Txt>
                {!!p.image && <Image source={{ uri: p.image }} style={{ width: '100%', height: 220, borderRadius: radius.card, backgroundColor: colors.surfaceAlt }} contentFit="cover" />}
                <Txt color="textMuted">{p.body}</Txt>
              </Card>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
