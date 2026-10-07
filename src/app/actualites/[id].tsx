import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Seo } from '@/components/Seo';
import { Section, SiteFrame, useTone } from '@/components/site/SiteFrame';
import { Avatar } from '@/components/ui/primitives';
import { BackLink } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { usePublicPublications } from '@/data/publicPublications';
import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { fonts, radius } from '@/theme/tokens';

/** One public news item on alfk.org (a publication an admin marked « Public »). */
export default function PublicNewsItem() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { d, f, formatDate } = useI18n();
  const { list, loading } = usePublicPublications();
  const { isMobile } = useLayout();
  const pub = list.find((p) => p.id === id);
  // The cover shown whole, in its own shape.
  const [ratio, setRatio] = useState<number | null>(null);

  return (
    <SiteFrame>
      <Seo title={pub?.title ?? d.site.news.title} description={pub?.excerpt ?? d.site.news.sub} />
      <Section>
        <View style={{ maxWidth: 820, width: '100%', alignSelf: 'center', gap: 20 }}>
          <BackLink label={d.site.news.title} href="/actualites" />
          {!pub ? (
            !loading && <Txt variant="h2">{d.publications.notFound}</Txt>
          ) : (
            <Article pub={pub} ratio={ratio} setRatio={setRatio} isMobile={isMobile} by={pub.authorName ? f(d.publications.by, { name: pub.authorName }) : undefined} date={formatDate(pub.date)} category={d.publications.categories[pub.category]} />
          )}
        </View>
      </Section>
    </SiteFrame>
  );
}

function Article({ pub, ratio, setRatio, isMobile, by, date, category }: {
  pub: NonNullable<ReturnType<typeof usePublicPublications>['list'][number]>;
  ratio: number | null;
  setRatio: (r: number) => void;
  isMobile: boolean;
  by?: string;
  date: string;
  category: string;
}) {
  const t = useTone();
  return (
    <>
      <Txt style={{ fontFamily: fonts.semibold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: t.accent }}>{`${category} · ${date}`}</Txt>
      <Txt style={{ fontFamily: fonts.serif, fontSize: isMobile ? 38 : 54, lineHeight: isMobile ? 42 : 58, color: t.fg }}>{pub.title}</Txt>
      {!!pub.excerpt && <Txt style={{ fontSize: 19, lineHeight: 28, color: t.muted }}>{pub.excerpt}</Txt>}
      {!!by && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Avatar uri={pub.authorAvatar} name={pub.authorName ?? ''} size={42} />
          <View>
            <Txt style={{ fontFamily: fonts.semibold, color: t.fg }}>{by}</Txt>
            {!!pub.authorFonction && <Txt style={{ fontSize: 13, color: t.muted }}>{pub.authorFonction}</Txt>}
          </View>
        </View>
      )}
      {!!pub.cover && (
        <View style={[{ borderRadius: radius.hero, overflow: 'hidden', backgroundColor: t.card }, ratio ? { width: '100%', aspectRatio: Math.max(ratio, 0.8) } : { height: isMobile ? 220 : 420 }]}>
          <Image
            source={{ uri: pub.cover }}
            style={{ width: '100%', height: '100%' }}
            contentFit={ratio && ratio < 0.8 ? 'contain' : 'cover'}
            transition={200}
            onLoad={(e) => e.source.width && e.source.height && setRatio(e.source.width / e.source.height)}
          />
        </View>
      )}
      <View style={{ gap: 18 }}>
        {pub.body.split('\n\n').map((para, i) => (
          <Txt key={i} style={{ fontSize: 17, lineHeight: 29, color: t.fg }}>{para}</Txt>
        ))}
      </View>
    </>
  );
}
