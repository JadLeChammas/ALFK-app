import { Feather } from '@expo/vector-icons';
import { Seo } from '@/components/Seo';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { FloatingPaths } from '@/components/fx/FloatingPaths';
import { PartnersManager } from '@/components/PartnersManager';
import { AppShell } from '@/components/shell/AppShell';
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

function Eyebrow({ text }: { text: string }) {
  const t = useTone();
  return (
    <View style={{ gap: 10, alignItems: 'center' }}>
      <View style={{ width: 32, height: 3, backgroundColor: t.accent }} />
      <Txt style={{ fontFamily: fonts.medium, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: t.fg }}>{text}</Txt>
    </View>
  );
}

/**
 * Places around the title (percent of the area), in the order partners fill them: top corners,
 * sides, bottom corners, then the gaps between. A partner added by an admin takes the next place.
 */
const SLOTS: { left?: number; right?: number; top?: number; bottom?: number; size: number; tilt: number }[] = [
  { left: 4, top: 4, size: 1, tilt: -6 },
  { right: 5, top: 8, size: 0.9, tilt: 5 },
  { left: 0, top: 44, size: 0.85, tilt: 4 },
  { right: 0, top: 40, size: 1, tilt: -4 },
  { left: 12, bottom: 2, size: 0.9, tilt: 6 },
  { right: 13, bottom: 4, size: 0.85, tilt: -5 },
  { left: 24, top: 0, size: 0.7, tilt: 3 },
  { right: 25, top: 0, size: 0.75, tilt: -3 },
  { left: 27, bottom: 0, size: 0.7, tilt: -4 },
  { right: 28, bottom: 0, size: 0.7, tilt: 4 },
  { left: 13, top: 24, size: 0.65, tilt: 5 },
  { right: 14, top: 24, size: 0.65, tilt: -6 },
];

/** The partners' logos scattered around the page title, without tiles. */
function LogoCloud({ partners, children }: { partners: Institution[]; children: ReactNode }) {
  const t = useTone();
  const { isMobile } = useLayout();
  const { scheme } = useTheme();
  const dark = scheme === 'dark';
  const base = isMobile ? 58 : 104;
  const shown = partners.slice(0, SLOTS.length);
  return (
    <View style={{ minHeight: isMobile ? 420 : 520, justifyContent: 'center', alignItems: 'center' }}>
      {shown.map((x, i) => {
        const slot = SLOTS[i];
        const size = Math.round(base * slot.size);
        const logo = partnerLogo(x);
        const pos = {
          ...(slot.left !== undefined && { left: `${slot.left}%` }),
          ...(slot.right !== undefined && { right: `${slot.right}%` }),
          ...(slot.top !== undefined && { top: `${slot.top}%` }),
          ...(slot.bottom !== undefined && { bottom: `${slot.bottom}%` }),
        } as const;
        const mark = logo ? (
          dark ? (
            // Dark page: on a white disc, so dark logos (Hi Dev's navy mark) stay visible.
            <View style={{ width: size * 1.28, height: size * 1.28, borderRadius: size, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
              <Image source={logo} style={{ width: size * 0.86, height: size * 0.86 }} contentFit="contain" accessibilityLabel={x.name} />
            </View>
          ) : (
            // « multiply » lets the page colour through a logo's own white background.
            <Image source={logo} style={[{ width: size, height: size }, Platform.OS === 'web' ? ({ mixBlendMode: 'multiply' } as object) : null]} contentFit="contain" accessibilityLabel={x.name} />
          )
        ) : (
          <Txt numberOfLines={2} style={{ width: size * 1.4, fontFamily: fonts.serif, fontSize: isMobile ? 14 : 18, textAlign: 'center', color: t.fg }}>{x.name}</Txt>
        );
        return (
          <Reveal key={x.id} index={i} style={{ position: 'absolute', ...pos, transform: [{ rotate: `${slot.tilt}deg` }] } as object}>
            {x.website ? <Pressable onPress={() => openExternal(x.website!)} accessibilityRole="link" accessibilityLabel={x.name}>{mark}</Pressable> : mark}
          </Reveal>
        );
      })}
      <Reveal style={{ gap: 14, alignItems: 'center', maxWidth: isMobile ? 240 : 460, paddingVertical: isMobile ? 120 : 0 }}>{children}</Reveal>
    </View>
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
