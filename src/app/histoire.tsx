import { router } from 'expo-router';
import { View } from 'react-native';

import { EditorialImageHero } from '@/components/site/blocks';
import { Reveal } from '@/components/site/Reveal';
import { Section, SerifHeading, SiteFrame, useTone } from '@/components/site/SiteFrame';
import { Button } from '@/components/ui/primitives';
import { Txt } from '@/components/ui/Txt';
import { useLfkStory, type FunFact, type StoryEvent } from '@/data/lfkStory';
import { IMAGES } from '@/data/seed';
import { useStore } from '@/data/store';
import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { fonts } from '@/theme/tokens';

/** « Le LFK » — the lycée's history (timeline) and fun facts, written by the admins. Public page. */
export default function LfkStoryPage() {
  const { d } = useI18n();
  const { me } = useStore();
  const { story } = useLfkStory();
  const h = d.lfk;
  const admin = me?.role === 'admin';

  return (
    <SiteFrame overlay>
      <EditorialImageHero
        tagline={h.eyebrow}
        title={h.title}
        description={story.intro?.trim() || h.sub}
        image={IMAGES.students}
        primary={admin ? { label: h.edit, onPress: () => router.push('/admin/histoire' as never) } : undefined}
        secondary={{ label: d.site.nav.association, onPress: () => router.push('/association') }}
      />

      <Section>
        <Reveal>
          <SerifHeading title={h.factsTitle} lead={h.factsLead} />
        </Reveal>
        {story.facts.length ? <FactsGrid facts={story.facts} /> : <Soon text={h.soon} admin={admin} />}
      </Section>

      <Section tone="navy">
        <Reveal>
          <SerifHeading title={h.timelineTitle} lead={h.timelineLead} />
        </Reveal>
        {story.timeline.length ? <Timeline events={story.timeline} /> : <Soon text={h.soon} admin={admin} />}
      </Section>
    </SiteFrame>
  );
}

function Soon({ text, admin }: { text: string; admin: boolean }) {
  const { d } = useI18n();
  const t = useTone();
  return (
    <View style={{ marginTop: 28, padding: 24, borderRadius: 20, borderWidth: 1, borderStyle: 'dashed', borderColor: t.rule, gap: 12, alignItems: 'flex-start' }}>
      <Txt style={{ color: t.muted }}>{text}</Txt>
      {admin && <Button label={d.lfk.edit} icon="edit-2" size="sm" onPress={() => router.push('/admin/histoire' as never)} />}
    </View>
  );
}

const FACT_COLORS = ['#AE0000', '#00206A', '#6680AE', '#C8961E'];

function FactsGrid({ facts }: { facts: FunFact[] }) {
  const { isMobile } = useLayout();
  return (
    <View style={{ marginTop: 32, flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
      {facts.map((f, i) => (
        <Reveal key={f.id} index={i % 4} style={{ flexGrow: 1, flexBasis: isMobile ? '100%' : 280, maxWidth: isMobile ? undefined : 420 }}>
          <View style={{ padding: 24, borderRadius: 24, backgroundColor: FACT_COLORS[i % FACT_COLORS.length], gap: 10, minHeight: 180 }}>
            <Txt style={{ fontSize: 40, lineHeight: 46 }}>{f.emoji || '✨'}</Txt>
            {!!f.title && <Txt style={{ color: '#fff', fontFamily: fonts.serif, fontSize: 26, lineHeight: 30 }}>{f.title}</Txt>}
            <Txt style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15, lineHeight: 22 }}>{f.text}</Txt>
          </View>
        </Reveal>
      ))}
    </View>
  );
}

function Timeline({ events }: { events: StoryEvent[] }) {
  const t = useTone();
  const { isMobile } = useLayout();
  return (
    <View style={{ marginTop: 36 }}>
      {events.map((e, i) => (
        <Reveal key={e.id} index={i % 4}>
          <View style={{ flexDirection: 'row', gap: isMobile ? 14 : 28 }}>
            <View style={{ width: isMobile ? 70 : 120, alignItems: 'flex-end' }}>
              <Txt style={{ fontFamily: fonts.display, fontSize: isMobile ? 32 : 44, lineHeight: isMobile ? 36 : 48, color: t.accent }}>{e.year}</Txt>
            </View>
            <View style={{ alignItems: 'center' }}>
              <View style={{ width: 14, height: 14, borderRadius: 7, marginTop: isMobile ? 10 : 16, backgroundColor: t.accent, borderWidth: 3, borderColor: t.bg }} />
              {i < events.length - 1 && <View style={{ flex: 1, width: 2, backgroundColor: t.rule }} />}
            </View>
            <View style={{ flex: 1, paddingBottom: 36, gap: 6 }}>
              <Txt style={{ color: t.fg, fontFamily: fonts.serif, fontSize: isMobile ? 22 : 28, lineHeight: isMobile ? 26 : 32 }}>{e.title}</Txt>
              {!!e.text && <Txt style={{ color: t.muted, fontSize: 15, lineHeight: 23 }}>{e.text}</Txt>}
            </View>
          </View>
        </Reveal>
      ))}
    </View>
  );
}
