import { Feather } from '@expo/vector-icons';
import { Seo } from '@/components/Seo';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Linking, View } from 'react-native';

import { PartnersManager } from '@/components/PartnersManager';
import { AppShell } from '@/components/shell/AppShell';
import { EditorialImageHero } from '@/components/site/blocks';
import { LinkCta, Reveal, Section, SerifHeading, SiteFrame, useTone } from '@/components/site/SiteFrame';
import { Button } from '@/components/ui/primitives';
import { Txt } from '@/components/ui/Txt';
import { usePublicOverview } from '@/data/public';
import { useStore } from '@/data/store';
import type { Institution } from '@/data/types';
import { partnerLogo } from '@/data/partners';
import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { fonts, radius } from '@/theme/tokens';

const campus = require('@/assets/images/lfk-campus.png');

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
  const { isDesktop } = useLayout();
  const { institutions } = usePublicOverview();
  const p = d.site.partners;

  return (
    <SiteFrame overlay>
      <Seo title={p.title} description={p.sub} />
      <EditorialImageHero tagline={p.eyebrow} title={p.title} description={p.sub} image={campus} />

      <Section style={{ paddingTop: 0 }}>
        <PartnerList partners={institutions} empty={p.empty} />
      </Section>

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
                {x.website && <LinkCta label={d.honorary.website} onPress={() => Linking.openURL(x.website!)} />}
              </View>
            </View>
          </Reveal>
        );
      })}
    </View>
  );
}
