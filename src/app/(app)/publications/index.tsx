import { useMemo, useState } from 'react';
import { ScrollView } from 'react-native';

import { PublicationCard } from '@/components/cards';
import { PublicationFormModal } from '@/components/forms';
import { Button, Chip, EmptyState } from '@/components/ui/primitives';
import { Grid, PageHeader, Screen } from '@/components/ui/Screen';
import { can } from '@/data/permissions';
import { useMe, useStore } from '@/data/store';
import type { PublicationCategory } from '@/data/types';
import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';

export default function Publications() {
  const { d } = useI18n();
  const { db } = useStore();
  const { isMobile } = useLayout();
  const me = useMe();
  const [cat, setCat] = useState<PublicationCategory | 'all'>('all');
  const [creating, setCreating] = useState(false);
  const list = useMemo(() => [...db.publications].filter((p) => cat === 'all' || p.category === cat).sort((a, b) => (a.date < b.date ? 1 : -1)), [db.publications, cat]);
  const [featured, ...rest] = list;

  return (
    <Screen>
      <PageHeader
        title={d.publications.title}
        subtitle={d.publications.subtitle}
        right={can(me, 'publish') && <Button label={d.publications.create} icon="edit-3" onPress={() => setCreating(true)} />}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        <Chip label={d.common.all} active={cat === 'all'} onPress={() => setCat('all')} count={db.publications.length} />
        {(Object.keys(d.publications.categories) as PublicationCategory[]).map((c) => (
          <Chip key={c} label={d.publications.categories[c]} active={cat === c} onPress={() => setCat(c)} count={db.publications.filter((p) => p.category === c).length} />
        ))}
      </ScrollView>
      {!featured ? (
        <EmptyState icon="book-open" title={d.common.noResults} />
      ) : (
        <>
          <Grid min={isMobile ? 280 : 420} gap={16} max={2}>
            {[featured, ...rest.slice(0, 1)].map((p) => <PublicationCard key={p.id} pub={p} featured />)}
          </Grid>
          <Grid min={260} gap={16}>
            {rest.slice(1).map((p) => <PublicationCard key={p.id} pub={p} />)}
          </Grid>
        </>
      )}
      <PublicationFormModal visible={creating} onClose={() => setCreating(false)} />
    </Screen>
  );
}
