import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Seo } from '@/components/Seo';
import { View } from 'react-native';

import { Accordion, ClosingCta, EditorialImageHero, HeroFigures, RuleColumns } from '@/components/site/blocks';
import { CheckPill, Float, MemberCard } from '@/components/site/heroAccents';
import { INSTAGRAM_HANDLE, instagramLinkProps } from '@/components/site/Instagram';
import { Reveal, Section, SerifHeading, SiteFrame, useTone } from '@/components/site/SiteFrame';
import { Button, Tap } from '@/components/ui/primitives';
import { Txt } from '@/components/ui/Txt';
import { useCommunity } from '@/data/community';
import { IMAGES } from '@/data/seed';
import { useStore } from '@/data/store';
import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { brand, fonts, radius } from '@/theme/tokens';

/** « Adhérer » — who can join, how it works (with the proof of schooling), FAQ. Public page. */
export default function Join() {
  const { d } = useI18n();
  const { me } = useStore();
  const { isDesktop } = useLayout();
  const c = useCommunity();
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
        extra={<HeroFigures items={[{ v: c.alumni, l: h.statAlumni }, { v: c.countries, l: h.statCountries }, { v: c.promos, l: h.statPromos }]} />}
        accent={
          <>
            {/* the card a new member could hold: the next number after today's alumni */}
            <Float style={{ left: -64, bottom: -44 }} rotate={-6} delay={1300}>
              <MemberCard role={d.roles.alumni} number={c.alumni + 1} />
            </Float>
            <Float style={{ right: -24, top: 40 }} delay={1650} amplitude={6} duration={3200}>
              <CheckPill label={h.step2Title} />
            </Float>
          </>
        }
      />

      <Section style={isDesktop ? undefined : { paddingTop: 0 }}>
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
          <Reveal style={{ width: isDesktop ? 340 : '100%', gap: 32 }}>
            <SerifHeading title={j.faqTitle} accent={j.faqItalic} />
            {isDesktop && <HelpCard />}
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
            {!isDesktop && <View style={{ marginTop: 28 }}><HelpCard /></View>}
          </Reveal>
        </View>
      </Section>

      <ClosingCta />
    </SiteFrame>
  );
}

/** Next to the FAQ: write to the Bureau, or find the Amicale on Instagram. */
function HelpCard() {
  const { d } = useI18n();
  const t = useTone();
  const j = d.site.join;
  return (
    <View style={{ padding: 24, borderRadius: radius.hero, backgroundColor: brand.navy, gap: 14, overflow: 'hidden' }}>
      <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(215,180,106,0.16)', alignItems: 'center', justifyContent: 'center' }}>
        <Feather name="message-circle" size={20} color={brand.blue} />
      </View>
      <Txt style={{ fontFamily: fonts.serif, fontSize: 28, lineHeight: 31, color: '#fff' }}>{j.helpTitle}</Txt>
      <Txt style={{ fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: 'rgba(231,236,242,0.78)' }}>{j.helpSub}</Txt>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginTop: 4 }}>
        <Button label={d.site.footer.contact} variant="white" onPress={() => router.push('/contact')} />
        <Tap {...instagramLinkProps()} role="link" hoverStyle={{ opacity: 0.75 }}>
          <Txt style={{ fontFamily: fonts.semibold, fontSize: 14, color: t.onColor ? '#fff' : brand.sky }}>{INSTAGRAM_HANDLE}</Txt>
        </Tap>
      </View>
    </View>
  );
}
