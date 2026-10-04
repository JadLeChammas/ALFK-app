import { router } from 'expo-router';
import { useMemo } from 'react';
import { Seo } from '@/components/Seo';
import { Platform, View } from 'react-native';

import { ImageReveal } from '@/components/fx/ImageReveal';
import { EditorialImageHero } from '@/components/site/blocks';
import { Float, ResultSeal, TurningStamp } from '@/components/site/heroAccents';
import { Reveal } from '@/components/site/Reveal';
import { Section, SerifHeading, SiteFrame, useTone } from '@/components/site/SiteFrame';
import { Button } from '@/components/ui/primitives';
import { Txt } from '@/components/ui/Txt';
import { foundingYear, parseStoryText, useLfkStory, type FunFact, type StoryEvent } from '@/data/lfkStory';
import { LFK_LOGO } from '@/data/partners';
import { useStore } from '@/data/store';
import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { brand, fonts, radius } from '@/theme/tokens';

/** « Le LFK » — the lycée's history (timeline) and fun facts, written by the admins. Public page. */
/** The LFK campus from above. */
const CAMPUS_AERIAL = require('@/assets/images/lfk-campus-aerial.png');
/** The school's front, and pupils forming the logo in the playground (beside the story). */
const CAMPUS = require('@/assets/images/lfk-campus.png');
const STUDENTS_LOGO = require('@/assets/images/lfk-students-logo.png');

export default function LfkStoryPage() {
  const { d } = useI18n();
  const { me } = useStore();
  const { story } = useLfkStory();
  const h = d.lfk;
  const admin = me?.role === 'admin';
  const { isDesktop } = useLayout();
  const year = foundingYear(story);
  const intro = story.intro?.trim();

  return (
    <SiteFrame overlay>
      <Seo title={h.title} description={h.sub} />
      <EditorialImageHero
        tagline={h.eyebrow}
        title={h.title}
        description={h.sub}
        image={CAMPUS_AERIAL}
        primary={admin ? { label: h.edit, onPress: () => router.push('/admin/histoire' as never) } : undefined}
        secondary={{ label: d.site.nav.association, onPress: () => router.push('/association') }}
        extra={isDesktop ? undefined : <ResultSeal value={h.bacValue} label={h.bacLabel} compact />}
        accent={
          <>
            <Float style={{ left: -60, bottom: -52 }} delay={1300} amplitude={6}>
              <TurningStamp text={year ? `${h.eyebrow} • ${year}` : h.eyebrow} logo={LFK_LOGO} />
            </Float>
            <Float style={{ right: -34, top: -30 }} delay={1650} amplitude={7} duration={4300} rotate={8}>
              <ResultSeal value={h.bacValue} label={h.bacLabel} />
            </Float>
          </>
        }
      />

      {!!intro && (
        <Section>
          <StoryArticle text={intro} />
        </Section>
      )}

      <Section>
        <Reveal>
          <SerifHeading title={h.factsTitle} lead={h.factsLead} />
        </Reveal>
        {story.facts.length ? <FactsGrid facts={story.facts} /> : <Soon text={h.soon} admin={admin} />}
      </Section>

      <Section tone="navy">
        {/* laptop: the heading on the left, the dates on the right */}
        <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: isDesktop ? 64 : 0, alignItems: 'flex-start' }}>
          <Reveal style={[{ width: isDesktop ? 360 : '100%' }, isDesktop && Platform.OS === 'web' ? ({ position: 'sticky', top: 120 } as object) : null]}>
            <SerifHeading title={h.timelineTitle} lead={h.timelineLead} />
          </Reveal>
          <View style={{ flex: isDesktop ? 1 : undefined, width: isDesktop ? undefined : '100%', marginTop: isDesktop ? -36 : 0 }}>
            {story.timeline.length ? <Timeline events={story.timeline} /> : <Soon text={h.soon} admin={admin} />}
          </View>
        </View>
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

const FACT_COLORS = ['#C53B3E', '#0E2A47', '#D7B46A', '#C8961E'];

function FactsGrid({ facts }: { facts: FunFact[] }) {
  const { isMobile, isDesktop } = useLayout();
  // Columns that leave no card alone on its row: 4 facts → 4 across on a laptop, 2 × 2 on a tablet.
  const options = isDesktop ? [4, 3, 2] : [2];
  const cols = isMobile ? 1 : options.find((c) => facts.length % c === 0) ?? options.find((c) => facts.length % c !== 1) ?? 2;
  return (
    <View style={{ marginTop: 32, marginHorizontal: -8, flexDirection: 'row', flexWrap: 'wrap' }}>
      {facts.map((f, i) => (
        <Reveal key={f.id} index={i % 4} style={{ width: `${100 / cols}%`, padding: 8 }}>
          <View style={{ flex: 1, padding: 24, borderRadius: 24, backgroundColor: FACT_COLORS[i % FACT_COLORS.length], gap: 10, minHeight: isMobile ? undefined : 180 }}>
            {/* the emoji and the title on one line */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Txt style={{ fontSize: 30, lineHeight: 36 }}>{f.emoji || '✨'}</Txt>
              {!!f.title && <Txt style={{ flex: 1, color: '#fff', fontFamily: fonts.serif, fontSize: 24, lineHeight: 27 }}>{f.title}</Txt>}
            </View>
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

/**
 * The admins' text as an article: title, then each part under its heading. Laptop: text on the left,
 * the school's photos on the right, staying in view while the text scrolls. Phone: photos first.
 */
function StoryArticle({ text }: { text: string }) {
  const t = useTone();
  const { isDesktop, isMobile } = useLayout();
  const { title, sections } = useMemo(() => parseStoryText(text), [text]);
  const photos = (
    <View style={{ width: '100%', marginBottom: isDesktop ? 0 : 36 }}>
      <View style={{ width: '100%', aspectRatio: isDesktop ? 0.84 : 1.35, borderRadius: radius.hero, overflow: 'hidden' }}>
        <ImageReveal source={CAMPUS} style={{ width: '100%', height: '100%' }} />
      </View>
      <View
        style={{
          position: 'absolute',
          left: isDesktop ? -40 : 14,
          bottom: isDesktop ? -44 : -30,
          width: isDesktop ? '58%' : '48%',
          aspectRatio: 1.3,
          borderRadius: 18,
          borderWidth: isMobile ? 4 : 6,
          borderColor: t.bg,
          overflow: 'hidden',
          transform: [{ rotate: '-4deg' }],
        }}>
        <ImageReveal source={STUDENTS_LOGO} style={{ width: '100%', height: '100%' }} cover={brand.red} delay={300} />
      </View>
    </View>
  );
  return (
    <View style={{ flexDirection: isDesktop ? 'row' : 'column', alignItems: 'flex-start', gap: isDesktop ? 88 : 28 }}>
      {!isDesktop && photos}
      <View style={{ flex: isDesktop ? 1.25 : undefined, width: isDesktop ? undefined : '100%', gap: isMobile ? 30 : 40 }}>
        {!!title && <SerifHeading title={title} />}
        {sections.map((s, i) => (
          <Reveal key={i} index={i % 3} style={{ gap: 14 }}>
            {!!s.heading && (
              <View style={{ gap: 12 }}>
                <View style={{ width: 28, height: 3, backgroundColor: t.accent }} />
                <Txt style={{ fontFamily: fonts.serif, fontSize: isMobile ? 25 : 30, lineHeight: isMobile ? 29 : 34, color: t.fg }}>{s.heading}</Txt>
              </View>
            )}
            {s.paragraphs.map((p, k) => (
              <Txt key={k} style={{ fontFamily: fonts.regular, fontSize: isMobile ? 16 : 17, lineHeight: isMobile ? 26 : 29, color: t.muted, maxWidth: 680 }}>
                {p}
              </Txt>
            ))}
          </Reveal>
        ))}
      </View>
      {isDesktop && (
        <View style={[{ flex: 1, maxWidth: 470, paddingBottom: 44 }, Platform.OS === 'web' ? ({ position: 'sticky', top: 120 } as object) : null]}>{photos}</View>
      )}
    </View>
  );
}
