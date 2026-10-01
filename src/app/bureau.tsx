import { router } from 'expo-router';
import { View } from 'react-native';

import { EditorialImageHero, TeamShowcase, type TeamMember } from '@/components/site/blocks';
import { LinkCta, Reveal, Section, SerifHeading, SiteFrame, useTone } from '@/components/site/SiteFrame';
import { Button } from '@/components/ui/primitives';
import { Txt } from '@/components/ui/Txt';
import { usePublicOverview } from '@/data/public';
import { IMAGES } from '@/data/seed';
import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { fonts } from '@/theme/tokens';

/** « Le bureau » — the association's administrators and honorary members (Team Showcase). Public page. */
export default function Board() {
  const { d } = useI18n();
  const { isDesktop } = useLayout();
  const { bureau } = usePublicOverview();
  const b = d.site.bureau;
  // Names, role titles and photos only (see public_overview); the president comes first.
  const team: TeamMember[] = bureau.map((p) => ({ id: p.name, name: p.name, role: p.fonction || (p.role === 'admin' ? b.member : d.roles.honneur), image: p.avatar }));

  return (
    <SiteFrame overlay>
      <EditorialImageHero tagline={d.app.long} title={b.title} description={b.sub} image={IMAGES.meeting} />

      <Section style={{ paddingTop: 0 }}>
        <Reveal style={{ marginBottom: 40 }}>
          <SerifHeading title={`${b.board} · ${b.honorary}`} />
        </Reveal>
        {team.length ? <TeamShowcase members={team} /> : <Empty text={b.empty} />}
      </Section>

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
