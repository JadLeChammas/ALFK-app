import { Feather } from '@expo/vector-icons';
import { Seo } from '@/components/Seo';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Platform, View } from 'react-native';

import { Marquee } from '@/components/fx/Marquee';
import { WorldMap } from '@/components/fx/WorldMap';
import { BigStatement, ClosingCta, EditorialTestimonial, GlobeCard, RuleColumns, StatsRow, UniversityRibbon, useDestinationMarkers, useQuoteCards } from '@/components/site/blocks';
import { PillarSlider, type PillarSlide } from '@/components/site/PillarSlider';
import { Container, Section, SerifHeading, SiteFrame, useTone } from '@/components/site/SiteFrame';
import { Flag } from '@/components/ui/Flag';
import { Button, Tap } from '@/components/ui/primitives';
import { Txt } from '@/components/ui/Txt';
import { useCommunity } from '@/data/community';
import { usePublicOverview } from '@/data/public';
import { IMAGES } from '@/data/seed';
import { useStore } from '@/data/store';
import { useI18n } from '@/i18n';
import { useDemoVisible } from '@/data/demoSetting';
import { partnerLogo } from '@/data/partners';
import { enterDemo } from '@/lib/supabase';
import { useLayout } from '@/theme/layout';
import { brand, fonts, radius } from '@/theme/tokens';

const campus = require('@/assets/images/lfk-campus.png');
const kuwaitFlag = require('@/assets/images/lfk-kuwait-flag.png');

/**
 * Public landing page of the association — what signed-out visitors see first.
 * A colour-morphing slider for the pillars of the Amicale, then full-bleed brand bands
 * (light blue, navy, blue, red) whose content animates in as you scroll.
 */
export default function Landing() {
  const { d } = useI18n();
  const h = d.site.home;
  const markers = useDestinationMarkers();
  const quotes = useQuoteCards();
  const steps = [
    { t: h.step1Title, d: h.step1Sub },
    { t: h.step2Title, d: h.step2Sub },
    { t: h.step3Title, d: h.step3Sub },
  ].map((s, i) => ({ ...s, label: `${h.step} ${i + 1}` }));

  const join = () => router.push('/inscription');
  const slides: PillarSlide[] = [
    { key: 's0', label: d.site.nav.association, title: h.s1Title, accent: h.s1Italic, text: h.s1Sub, cta: h.cta1, onPress: join, bg: brand.red, fg: '#FFFFFF', muted: 'rgba(255,255,255,0.82)', accentColor: '#FFC4C5', ctaBg: '#FFFFFF', ctaFg: brand.red, shadow: '#4F0000', images: [campus, kuwaitFlag] },
    { key: 's1', label: d.nav.directory, title: h.s2Title, accent: h.s2Italic, text: h.s2Sub, cta: h.cta2, onPress: join, bg: brand.blue, fg: brand.navy, muted: 'rgba(14, 42, 71, 0.8)', accentColor: brand.red, ctaBg: brand.navy, ctaFg: '#FFFFFF', shadow: '#A88A47', images: [IMAGES.friends, IMAGES.group] },
    { key: 's2', label: d.nav.repere, title: h.s3Title, accent: h.s3Italic, text: h.s3Sub, cta: h.cta3, onPress: join, bg: brand.navy, fg: '#FFFFFF', muted: 'rgba(231, 236, 242,0.88)', accentColor: brand.sky, ctaBg: brand.red, ctaFg: '#FFFFFF', shadow: '#000718', images: [IMAGES.students, IMAGES.paris] },
    { key: 's3', label: d.nav.events, title: h.s4Title, accent: h.s4Italic, text: h.s4Sub, cta: h.cta4, onPress: () => router.push('/association'), bg: '#7E0A14', fg: '#FFFFFF', muted: 'rgba(255,255,255,0.82)', accentColor: '#FFC4C5', ctaBg: '#FFFFFF', ctaFg: '#7E0A14', shadow: '#360004', images: [IMAGES.gala, IMAGES.party] },
  ];

  return (
    <SiteFrame overlay>
      <Seo />
      <PillarSlider slides={slides} />

      <UniversityRibbon />

      {/* Giant figure */}
      <BigStatement tone="page" />

      {/* Globe — full-bleed navy */}
      <GlobeCard bleed title={h.networkTitle} accent={h.networkItalic} lead={h.networkSub} markers={markers} stats={<StatsRow light />} />

      {/* Destinations — world map */}
      <Section>
        <SerifHeading title={h.topDestinations} center />
        <Destinations />
      </Section>

      {/* The president's word */}
      {quotes.length > 0 && (
        <Section tone="blue">
          <EditorialTestimonial quotes={quotes} />
        </Section>
      )}

      {/* How to join */}
      <Section tone="navy">
        <View style={{ marginBottom: 40 }}>
          <SerifHeading title={h.stepsTitle} accent={h.stepsItalic} />
        </View>
        <RuleColumns items={steps} />
      </Section>

      <Partners />
      <DemoInvite />

      <ClosingCta />
    </SiteFrame>
  );
}

function Destinations() {
  const t = useTone();
  const { country } = useI18n();
  const { isMobile } = useLayout();
  const c = useCommunity();
  return (
    <>
      <View style={{ marginTop: isMobile ? 24 : 40 }}>
        <WorldMap arcs={c.destinations.filter((x) => x.country.code !== 'KW').map((x) => ({ key: x.country.code, to: x.country.ll }))} fadeInto={t.bg} dotColor={t.fg} />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 32, rowGap: 12, marginTop: 24 }}>
        {c.destinations.slice(0, isMobile ? 6 : 8).map((x) => (
          <View key={x.country.code} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Flag code={x.country.code} size={12} />
            <Txt style={{ fontFamily: fonts.medium, fontSize: 13, color: t.muted }}>{country(x.country.code)}</Txt>
            <Txt style={{ fontFamily: fonts.display, fontSize: 24, color: t.fg }}>{x.n}</Txt>
          </View>
        ))}
      </View>
    </>
  );
}

/**
 * Partner institutions (only those that agreed to appear — managed by the admins) on an endless,
 * auto-scrolling strip (21st.dev « Logo Cloud Marquee »). It reads the live partner list, so a
 * partner added by an admin joins the carousel by itself; Hi Dev Mobile Inc stays last in the order.
 */
function Partners() {
  const t = useTone();
  const { d } = useI18n();
  const { isDesktop } = useLayout();
  const { institutions } = usePublicOverview();
  if (!institutions.length) return null;
  const label = (
    <Txt style={{ fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase', color: t.muted }}>{d.site.partners.eyebrow}</Txt>
  );
  const strip = (
    <Marquee fade={t.bg} speed={34} gap={56}>
      {institutions.map((p) => {
        const logo = partnerLogo(p);
        return (
          <Tap key={p.id} onPress={() => router.push('/partenaires')} accessibilityLabel={p.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, height: 64 }} hoverStyle={{ opacity: 0.8 }}>
            <View style={{ width: 44, height: 44, borderRadius: radius.input, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {logo ? <Image source={logo} style={{ width: 34, height: 34 }} contentFit="contain" /> : <Feather name="home" size={20} color={brand.navy} />}
            </View>
            <Txt numberOfLines={1} style={{ fontFamily: fonts.serif, fontSize: 26, color: t.fg }}>{p.name}</Txt>
          </Tap>
        );
      })}
    </Marquee>
  );
  return isDesktop ? (
    <Container style={{ paddingVertical: 40, flexDirection: 'row', alignItems: 'center', gap: 40 }}>
      {label}
      <View style={{ flex: 1, minWidth: 0 }}>{strip}</View>
    </Container>
  ) : (
    <View style={{ paddingVertical: 32, gap: 14 }}>
      <Container>{label}</Container>
      {strip}
    </View>
  );
}

/** On the real site: a way to explore the demo without an account. */
function DemoInvite() {
  const t = useTone();
  const { d } = useI18n();
  const { isRemote } = useStore();
  const visible = useDemoVisible();
  if (!isRemote || Platform.OS !== 'web' || !visible) return null;
  return (
    <Container style={{ paddingBottom: 48 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, padding: 18, borderRadius: radius.card, borderWidth: 1, borderStyle: 'dashed', borderColor: t.rule }}>
        <Feather name="play-circle" size={18} color={t.accent} />
        <View style={{ flex: 1, minWidth: 220 }}>
          <Txt style={{ fontFamily: fonts.semibold, fontSize: 14, color: t.fg }}>{d.demo.tryTitle}</Txt>
          <Txt style={{ fontFamily: fonts.regular, fontSize: 13, color: t.muted }}>{d.demo.trySub}</Txt>
        </View>
        <Button label={d.demo.tryButton} icon="eye" variant="soft" size="sm" onPress={enterDemo} />
      </View>
    </Container>
  );
}
