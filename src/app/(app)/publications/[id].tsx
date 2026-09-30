import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { PUB_TONE, PublicationCard } from '@/components/cards';
import { useDialogs } from '@/components/ui/Dialogs';
import { Avatar, Badge, Button, EmptyState, Row } from '@/components/ui/primitives';
import { BackLink, Grid, Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { fullName, useMe, useStore, useUserMap } from '@/data/store';
import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { radius } from '@/theme/tokens';

export default function Article() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { d, f, formatDate } = useI18n();
  const { isMobile } = useLayout();
  const { db, actions } = useStore();
  const { confirm } = useDialogs();
  const users = useUserMap();
  const me = useMe();
  const pub = db.publications.find((p) => p.id === id);

  if (!pub) {
    return (
      <Screen>
        <BackLink label={d.publications.title} href="/publications" />
        <EmptyState icon="file-text" title={d.publications.notFound} />
      </Screen>
    );
  }
  const author = users.get(pub.authorId);
  const more = db.publications.filter((p) => p.id !== pub.id).slice(0, 3);

  return (
    <Screen maxWidth={900}>
      <BackLink label={d.publications.title} href="/publications" />
      <View style={{ gap: 16 }}>
        <Row gap={10}>
          <Badge label={d.publications.categories[pub.category]} tone={PUB_TONE[pub.category]} />
          <Txt variant="small" color="textSubtle">{formatDate(pub.date, { weekday: true })}</Txt>
        </Row>
        <Txt variant={isMobile ? 'h1' : 'display'} style={!isMobile && { fontSize: 40, lineHeight: 48 }}>{pub.title}</Txt>
        <Txt style={{ fontSize: 18, lineHeight: 28 }} color="textMuted">{pub.excerpt}</Txt>
        {author && (
          <Row gap={10}>
            <Avatar uri={author.avatar} name={fullName(author)} size={36} />
            <View>
              <Txt variant="smallStrong">{f(d.publications.by, { name: fullName(author) })}</Txt>
              <Txt variant="small" color="textSubtle">{d.roles[author.role]}</Txt>
            </View>
          </Row>
        )}
      </View>
      <View style={{ height: isMobile ? 220 : 420, borderRadius: radius.hero, overflow: 'hidden' }}>
        <Image source={{ uri: pub.cover }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={200} />
      </View>
      <View style={{ gap: 18 }}>
        {pub.body.split('\n\n').map((para, i) => (
          <Txt key={i} style={{ fontSize: 17, lineHeight: 29 }}>{para}</Txt>
        ))}
      </View>
      {me.role === 'admin' && (
        <Button
          label={d.common.delete}
          icon="trash-2"
          variant="danger"
          onPress={async () => {
            if (await confirm({ title: d.common.delete, message: pub.title, danger: true, confirmLabel: d.common.delete })) {
              actions.deletePublication(pub.id);
              router.replace('/publications');
            }
          }}
        />
      )}
      {more.length > 0 && (
        <View style={{ gap: 16 }}>
          <Txt variant="h2">{d.publications.more}</Txt>
          <Grid min={240} gap={16}>
            {more.map((p) => <PublicationCard key={p.id} pub={p} />)}
          </Grid>
        </View>
      )}
    </Screen>
  );
}
