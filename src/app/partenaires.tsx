import { Feather } from '@expo/vector-icons';
import { Seo } from '@/components/Seo';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { View } from 'react-native';

import { FloatingPaths } from '@/components/fx/FloatingPaths';
import { PartnersManager } from '@/components/PartnersManager';
import { AppShell } from '@/components/shell/AppShell';
import { Eyebrow, LogoCloud } from '@/components/site/LogoCloud';
import { LinkCta, Reveal, Section, SerifHeading, SiteFrame, tonePalette, useTone } from '@/components/site/SiteFrame';
import { FramedPhoto } from '@/components/FramedPhoto';
import { Avatar, Button } from '@/components/ui/primitives';
import { Txt } from '@/components/ui/Txt';
import { usePublicOverview } from '@/data/public';
import { LEADER_KINDS, useSchoolLeaders } from '@/data/schoolLeaders';
import { useStore } from '@/data/store';
import type { Institution } from '@/data/types';
import { partnerLogo } from '@/data/partners';
import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';
import { brand, fonts, radius } from '@/theme/tokens';
import { openExternal } from '@/lib/links';

/**
 * Partners. Approved members get it inside their space (admins manage the list there);
 * visitors get the public version. Only institutions that agreed to appear are listed.
 */
export default function Partners() {
  const { me, session } = useStore();
  if (me?.approved && !session?.recovery) {
    return (
      <AppShell>
        <PartnersManager />
      </AppShell>
    );
  }
  return <PublicPartners />;
}

function PublicPartners() {
  const { d } = useI18n();
  const { scheme } = useTheme();
  const { isDesktop } = useLayout();
  const { institutions } = usePublicOverview();
  const p = d.site.partners;

  return (
    <SiteFrame>
      <Seo title={p.title} description={p.sub} />
      <Section background={<FloatingPaths color={scheme === 'dark' ? '#E7ECF2' : brand.navy} fade={tonePalette('page', scheme === 'dark').bg} />}>
        <LogoCloud partners={institutions}>
          <Eyebrow text={p.eyebrow} />
          <SerifHeading title={p.title} lead={p.sub} size="lg" center />
        </LogoCloud>
      </Section>

      <Section style={{ paddingTop: 0 }}>
        <PartnerList partners={institutions} empty={p.empty} />
      </Section>

      <CurrentLeadership />

      <Section tone="blue">
        <View style={{ flexDirection: isDesktop ? 'row' : 'column', alignItems: isDesktop ? 'flex-end' : 'flex-start', justifyContent: 'space-between', gap: 24 }}>
          <Reveal style={{ flex: 1 }}>
            <SerifHeading title={p.becomeTitle} accent={p.becomeItalic} lead={p.becomeSub} />
          </Reveal>
          <Reveal index={1}>
            <Button label={p.becomeCta} variant="white" onPress={() => router.push('/contact')} />
          </Reveal>
        </View>
      </Section>
    </SiteFrame>
  );
}

/**
 * The school's current leadership — proviseur, primary director, CPE — from the Bureau page's
 * timelines (no end year = in office), as on the members' Partners page. Hidden while empty.
 */
function CurrentLeadership() {
  const t = useTone();
  const { d } = useI18n();
  const { isMobile } = useLayout();
  const { byKind } = useSchoolLeaders();
  const leaders = LEADER_KINDS.flatMap((k) => byKind(k).filter((x) => !x.to));
  if (!leaders.length) return null;
  return (
    <Section style={{ paddingTop: 0 }}>
      <Reveal style={{ marginBottom: 32 }}>
        <SerifHeading title={d.honorary.people} />
      </Reveal>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: isMobile ? 24 : 40, justifyContent: isMobile ? 'center' : 'flex-start' }}>
        {leaders.map((x, i) => (
          <Reveal key={x.id} index={i} style={{ width: isMobile ? 150 : 200, alignItems: 'center', gap: 8 }}>
            {x.photo ? <FramedPhoto uri={x.photo} size={isMobile ? 110 : 140} frame={x.photoFrame} /> : <Avatar name={x.name} size={isMobile ? 110 : 140} />}
            <Txt style={{ fontFamily: fonts.semibold, fontSize: 17, textAlign: 'center', color: t.fg, marginTop: 4 }}>{x.name}</Txt>
            <Txt style={{ fontFamily: fonts.medium, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center', color: t.muted }}>{d.leaders.kinds[x.kind]}</Txt>
            {!!x.from && <Txt style={{ fontSize: 13, color: t.muted }}>{`${d.leaders.since} ${x.from}`}</Txt>}
            {!!x.description && <Txt style={{ fontSize: 13, textAlign: 'center', color: brand.red }}>{x.description}</Txt>}
          </Reveal>
        ))}
      </View>
    </Section>
  );
}

function PartnerList({ partners, empty }: { partners: Institution[]; empty: string }) {
  const t = useTone();
  const { d } = useI18n();
  const { isMobile, isDesktop } = useLayout();
  if (!partners.length) return <Txt style={{ fontFamily: fonts.regular, fontSize: 15, color: t.muted }}>{empty}</Txt>;
  return (
    <View style={{ borderTopWidth: 1, borderTopColor: t.rule }}>
      {partners.map((x, i) => {
        const logo = partnerLogo(x);
        return (
          <Reveal key={x.id} index={i}>
            <View style={{ flexDirection: isDesktop ? 'row' : 'column', alignItems: isDesktop ? 'center' : 'flex-start', gap: isDesktop ? 40 : 16, paddingVertical: isMobile ? 28 : 44, borderBottomWidth: 1, borderBottomColor: t.rule }}>
              <Txt style={{ fontFamily: fonts.display, fontSize: 40, color: t.accent, width: 56 }}>{String(i + 1).padStart(2, '0')}</Txt>
              <View style={{ width: 96, height: 96, borderRadius: radius.hero, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', overflow: 'hidden' }}>
                {logo ? <Image source={logo} style={{ width: 80, height: 80 }} contentFit="contain" /> : <Feather name="home" size={32} color={t.accent} />}
              </View>
              <View style={{ flex: 1, gap: 8 }}>
                <Txt style={{ fontFamily: fonts.serif, fontSize: isMobile ? 30 : 40, lineHeight: isMobile ? 34 : 44, color: t.fg }}>{x.name}</Txt>
                <Txt style={{ fontFamily: fonts.regular, fontSize: 15, lineHeight: 24, color: t.muted, maxWidth: 560 }}>{x.description}</Txt>
                {x.website && <LinkCta label={d.honorary.website} onPress={() => openExternal(x.website!)} />}
              </View>
            </View>
          </Reveal>
        );
      })}
    </View>
  );
}
