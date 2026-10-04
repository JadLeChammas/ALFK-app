import { router } from 'expo-router';

import { Seo } from '@/components/Seo';
import { ClosingCta, ContentGrid, EditorialImageHero, EditorialTestimonial, GlobeCard, RuleColumns, StatsRow, useDestinationMarkers, useQuoteCards } from '@/components/site/blocks';
import { Container, Reveal, Section, SerifHeading, SiteFrame } from '@/components/site/SiteFrame';
import { useCommunity } from '@/data/community';
import { IMAGES } from '@/data/seed';
import { useStore } from '@/data/store';
import { useI18n } from '@/i18n';

/** « L'Amicale » — mission, values and actions of the association. Public page. */
/** LFK pupils forming the school's logo in the playground. */
const STUDENTS_LOGO = require('@/assets/images/lfk-students-logo.png');

export default function Association() {
  const { d, f } = useI18n();
  const { me } = useStore();
  const c = useCommunity();
  const markers = useDestinationMarkers();
  const quotes = useQuoteCards();
  const a = d.site.association;

  return (
    <SiteFrame overlay>
      <Seo title={d.site.nav.association} description={a.sub} />
      <EditorialImageHero
        tagline={a.eyebrow}
        title={`${a.title} ${a.italic}`}
        description={a.sub}
        image={STUDENTS_LOGO}
        primary={me ? undefined : { label: d.site.home.cta1, onPress: () => router.push('/inscription') }}
        secondary={{ label: d.site.nav.bureau, onPress: () => router.push('/bureau') }}
      />

      <Section style={{ paddingTop: 0 }}>
        <Reveal>
          <SerifHeading title={a.valuesTitle} />
        </Reveal>
        <Container style={{ paddingHorizontal: 0, marginTop: 32 }}>
          <RuleColumns
            items={[
              { t: a.v1, d: a.v1Sub },
              { t: a.v2, d: a.v2Sub },
              { t: a.v3, d: a.v3Sub },
              { t: a.v4, d: a.v4Sub },
            ]}
          />
        </Container>
      </Section>

      <Section tone="navy">
        <ContentGrid
          title={a.actionsTitle}
          items={[
            { title: a.a1, description: a.a1Sub, image: IMAGES.party },
            { title: a.a2, description: a.a2Sub, image: IMAGES.lecture },
            { title: a.a3, description: a.a3Sub, image: IMAGES.students },
            { title: a.a4, description: a.a4Sub, image: IMAGES.meeting },
          ]}
        />
      </Section>

      {quotes.length > 0 && (
        <Section tone="blue">
          <EditorialTestimonial quotes={quotes} />
        </Section>
      )}

      <Container style={{ paddingVertical: 64 }}>
        <GlobeCard compact title={a.presenceTitle} accent={f(a.presenceItalic, { n: c.countries })} lead={d.site.home.networkSub} markers={markers} stats={<StatsRow light />} />
      </Container>
      <ClosingCta />
    </SiteFrame>
  );
}
