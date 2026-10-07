import { Image } from 'expo-image';
import { router } from 'expo-router';
import { View } from 'react-native';

import { Seo } from '@/components/Seo';
import { Reveal, Section, SerifHeading, SiteFrame, useTone } from '@/components/site/SiteFrame';
import { Tap } from '@/components/ui/primitives';
import { Txt } from '@/components/ui/Txt';
import { usePublicPublications, type PublicPublication } from '@/data/publicPublications';
import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { fonts, radius } from '@/theme/tokens';

/**
 * « Actualités » — the Amicale's public news on alfk.org: the publications an admin marked « Public ».
 * The members-only ones stay in the member space (/publications).
 */
export default function PublicNews() {
  const { d } = useI18n();
  const n = d.site.news;
  const { list, loading } = usePublicPublications();
  const { isMobile } = useLayout();

  return (
    <SiteFrame>
      <Seo title={n.title} description={n.sub} />
      <Section>
        <Reveal style={{ marginBottom: isMobile ? 28 : 44 }}>
          <SerifHeading title={n.title} lead={n.sub} size="lg" />
        </Reveal>
        {!loading && list.length === 0 ? (
          <Txt style={{ opacity: 0.8 }}>{n.empty}</Txt>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: isMobile ? 16 : 24 }}>
            {list.map((p, i) => (
              <Reveal key={p.id} index={i % 3} style={{ flexBasis: isMobile ? '100%' : '47%', flexGrow: 1 }}>
                <NewsCard pub={p} />
              </Reveal>
            ))}
          </View>
        )}
      </Section>
    </SiteFrame>
  );
}

function NewsCard({ pub }: { pub: PublicPublication }) {
  const { d, formatDate } = useI18n();
  const t = useTone();
  return (
    <Tap onPress={() => router.push(`/actualites/${pub.id}`)} style={{ borderRadius: radius.hero, overflow: 'hidden', backgroundColor: t.card }}>
      {!!pub.cover && <Image source={{ uri: pub.cover }} style={{ width: '100%', height: 220 }} contentFit="cover" transition={200} />}
      <View style={{ padding: 20, gap: 8 }}>
        <Txt style={{ fontFamily: fonts.semibold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: t.accent }}>
          {`${d.publications.categories[pub.category]} · ${formatDate(pub.date)}`}
        </Txt>
        <Txt style={{ fontFamily: fonts.serif, fontSize: 26, lineHeight: 30, color: t.cardFg }}>{pub.title}</Txt>
        {!!pub.excerpt && <Txt numberOfLines={3} style={{ color: t.cardMuted }}>{pub.excerpt}</Txt>}
      </View>
    </Tap>
  );
}
