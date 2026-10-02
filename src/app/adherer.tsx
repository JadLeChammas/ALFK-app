import { router } from 'expo-router';
import { Seo } from '@/components/Seo';
import { View } from 'react-native';

import { Accordion, ClosingCta, EditorialImageHero, RuleColumns } from '@/components/site/blocks';
import { Reveal, Section, SerifHeading, SiteFrame } from '@/components/site/SiteFrame';
import { IMAGES } from '@/data/seed';
import { useStore } from '@/data/store';
import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';

/** « Adhérer » — who can join, how it works (with the proof of schooling), FAQ. Public page. */
export default function Join() {
  const { d } = useI18n();
  const { me } = useStore();
  const { isDesktop } = useLayout();
  const j = d.site.join;
  const h = d.site.home;
  const steps = [
    { t: h.step1Title, d: h.step1Sub },
    { t: h.step2Title, d: h.step2Sub },
    { t: h.step3Title, d: h.step3Sub },
  ].map((s, i) => ({ ...s, label: `${h.step} ${i + 1}` }));

  return (
    <SiteFrame overlay>
      <Seo title={d.site.nav.join} description={j.sub} />
      <EditorialImageHero
        tagline={j.eyebrow}
        title={`${j.title} ${j.italic}`}
        description={j.sub}
        image={IMAGES.friends}
        primary={me ? undefined : { label: j.createCta, onPress: () => router.push('/inscription') }}
        secondary={me ? undefined : { label: d.site.nav.signIn, onPress: () => router.push('/connexion') }}
      />

      <Section style={{ paddingTop: 0 }}>
        <Reveal style={{ marginBottom: 32 }}>
          <SerifHeading title={j.whoTitle} accent={j.whoItalic} />
        </Reveal>
        <RuleColumns
          items={[
            { t: j.who1, d: j.who1Sub },
            { t: j.who2, d: j.who2Sub },
            { t: j.who3, d: j.who3Sub },
          ]}
        />
      </Section>

      <Section tone="navy">
        <Reveal style={{ marginBottom: 32 }}>
          <SerifHeading title={h.stepsTitle} accent={h.stepsItalic} light />
        </Reveal>
        <RuleColumns items={steps} />
      </Section>

      <Section>
        <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: isDesktop ? 64 : 24 }}>
          <Reveal style={{ width: isDesktop ? 340 : '100%' }}>
            <SerifHeading title={j.faqTitle} accent={j.faqItalic} />
          </Reveal>
          <Reveal index={1} style={{ flex: 1 }}>
            <Accordion
              items={[
                { t: j.q1, d: j.a1 },
                { t: j.q2, d: j.a2 },
                { t: j.q3, d: j.a3 },
                { t: j.q4, d: j.a4 },
                { t: j.q5, d: j.a5 },
                { t: j.q6, d: j.a6 },
              ]}
            />
          </Reveal>
        </View>
      </Section>

      <ClosingCta />
    </SiteFrame>
  );
}
