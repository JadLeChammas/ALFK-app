import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { PublicationCard } from '@/components/cards';
import { PublicationFormModal } from '@/components/forms';
import { PublicationReviewList } from '@/components/PublicationReview';
import { Button, Card, Chip, EmptyState, SectionHeader } from '@/components/ui/primitives';
import { Grid, PageHeader, Screen } from '@/components/ui/Screen';
import { can } from '@/data/permissions';
import { useMe, usePublished, useStore } from '@/data/store';
import type { PublicationCategory } from '@/data/types';
import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';

export default function Publications() {
  const { d } = useI18n();
  const { db } = useStore();
  const { isMobile } = useLayout();
  const me = useMe();
  const published = usePublished();
  const [cat, setCat] = useState<PublicationCategory | 'all'>('all');
  const [creating, setCreating] = useState(false);
  const list = useMemo(() => published.filter((p) => cat === 'all' || p.category === cat), [published, cat]);
  const [featured, ...rest] = list;
  // The member's own submissions that are not (or not yet) public.
  const mine = db.publications.filter((p) => p.authorId === me.id && p.status !== 'published');
  const direct = can(me, 'publish');

  return (
    <Screen>
      <PageHeader
        title={d.publications.title}
        subtitle={d.publications.subtitle}
        right={<Button label={direct ? d.publications.create : d.pubReview.propose} icon="edit-3" variant={direct ? 'primary' : 'secondary'} onPress={() => setCreating(true)} />}
      />
      {me.role === 'admin' && <PublicationReviewList />}
      {mine.length > 0 && (
        <Card>
          <SectionHeader title={d.pubReview.mine} icon="send" count={String(mine.length)} />
          <Grid min={260} gap={16}>
            {mine.map((p) => <PublicationCard key={p.id} pub={p} />)}
          </Grid>
        </Card>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        <Chip label={d.common.all} active={cat === 'all'} onPress={() => setCat('all')} count={published.length} />
        {(Object.keys(d.publications.categories) as PublicationCategory[]).map((c) => (
          <Chip key={c} label={d.publications.categories[c]} active={cat === c} onPress={() => setCat(c)} count={published.filter((p) => p.category === c).length} />
        ))}
      </ScrollView>
      {!featured ? (
        <EmptyState icon="book-open" title={d.common.noResults} />
      ) : (
        <View style={{ gap: 16 }}>
          <Grid min={isMobile ? 280 : 420} gap={16} max={2}>
            {[featured, ...rest.slice(0, 1)].map((p) => <PublicationCard key={p.id} pub={p} featured />)}
          </Grid>
          <Grid min={260} gap={16}>
            {rest.slice(1).map((p) => <PublicationCard key={p.id} pub={p} />)}
          </Grid>
        </View>
      )}
      <PublicationFormModal visible={creating} onClose={() => setCreating(false)} />
    </Screen>
  );
}
