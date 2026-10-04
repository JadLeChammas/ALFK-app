import { router } from 'expo-router';
import { Seo } from '@/components/Seo';
import { View } from 'react-native';

import { EditorialImageHero, TeamShowcase, type TeamMember } from '@/components/site/blocks';
import { FacesCard, Float } from '@/components/site/heroAccents';
import { LinkCta, Reveal, Section, SerifHeading, SiteFrame, useTone } from '@/components/site/SiteFrame';
import { Button } from '@/components/ui/primitives';
import { Txt } from '@/components/ui/Txt';
import { LeadersTimeline } from '@/components/LeadersTimeline';
import { usePublicOverview } from '@/data/public';
import { useSchoolLeaders } from '@/data/schoolLeaders';
import { useStore } from '@/data/store';
import { IMAGES } from '@/data/seed';
import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { fonts } from '@/theme/tokens';

/**
 * « Le bureau » — the association's administrators (Team Showcase), then the
 * proviseurs and primary directors of the LFK through the years (timelines, edited by admins here).
 * Public page.
 */
export default function Board() {
  const { d, f } = useI18n();
  const { isDesktop } = useLayout();
  const { bureau } = usePublicOverview();
  const { me } = useStore();
  const admin = me?.role === 'admin' && me.approved;
  const { byKind } = useSchoolLeaders();
  const hasLeaders = byKind('proviseur').length + byKind('directeur').length + byKind('cpe').length > 0;
  const b = d.site.bureau;
  // The Bureau only (no honorary members): names, role titles and photos (see public_overview),
  // in Bureau-code order — the president first.
  const team: TeamMember[] = bureau.filter((p) => p.role === 'admin').map((p) => ({ id: p.name, name: p.name, role: p.fonction || b.member, image: p.avatar }));

  return (
    <SiteFrame overlay>
      <Seo title={b.title} description={b.sub} />
      <EditorialImageHero
        tagline={d.app.long}
        title={b.title}
        description={b.sub}
        image={IMAGES.meeting}
        secondary={{ label: d.site.footer.contact, onPress: () => router.push('/contact') }}
        accent={
          team.length ? (
            <Float style={{ left: -48, bottom: -36 }} delay={1300}>
              <FacesCard people={team.map((m) => ({ name: m.name, avatar: m.image }))} caption={f(team.length > 1 ? d.common.members : d.common.member, { n: team.length })} />
            </Float>
          ) : undefined
        }
      />

      <Section style={isDesktop ? undefined : { paddingTop: 0 }}>
        <Reveal style={{ marginBottom: 40 }}>
          <SerifHeading title={b.board} />
        </Reveal>
        {team.length ? <TeamShowcase members={team} /> : <Empty text={b.empty} />}
      </Section>

      {/* Leadership history: the heads of the LFK through the years (admins add them here). */}
      {(hasLeaders || admin) && (
        <Section style={{ paddingTop: 0 }}>
          <Reveal style={{ marginBottom: 32 }}>
            <SerifHeading title={b.history} />
          </Reveal>
          <View style={{ gap: 40 }}>
            <LeadersTimeline kind="proviseur" editable={admin} />
            <LeadersTimeline kind="directeur" editable={admin} />
            <LeadersTimeline kind="cpe" editable={admin} />
          </View>
        </Section>
      )}

      <Section tone="navy">
        <View style={{ flexDirection: isDesktop ? 'row' : 'column', alignItems: isDesktop ? 'flex-end' : 'flex-start', justifyContent: 'space-between', gap: 24 }}>
          <Reveal style={{ flex: 1 }}>
            <SerifHeading title={b.volunteerTitle} accent={b.volunteerItalic} lead={b.volunteerSub} />
          </Reveal>
          <Reveal index={1} style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <Button label={d.site.footer.contact} onPress={() => router.push('/contact')} />
            <LinkCta label={d.site.nav.join} onPress={() => router.push('/adherer')} />
          </Reveal>
        </View>
      </Section>
    </SiteFrame>
  );
}

function Empty({ text }: { text: string }) {
  const t = useTone();
  return <Txt style={{ fontFamily: fonts.regular, fontSize: 15, color: t.muted }}>{text}</Txt>;
}
