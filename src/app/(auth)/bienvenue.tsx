import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';

import { Band, Container, CtaSection, Eyebrow, Marquee, MIST, NAVY, NetworkSection, PublicSite, SerifTitle, StepsSection } from '@/components/site/PublicSite';
import { Avatar, Button, Tap } from '@/components/ui/primitives';
import { Txt } from '@/components/ui/Txt';
import { usePublicOverview } from '@/data/public';
import { IMAGES } from '@/data/seed';
import { useStore } from '@/data/store';
import { useI18n } from '@/i18n';
import { enterDemo } from '@/lib/supabase';
import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius } from '@/theme/tokens';

const SLIDE_MS = 7000;

/** Public home page: the only page of the member area visible without an account. */
export default function Welcome() {
  const { d } = useI18n();
  const { colors } = useTheme();
  const { isRemote } = useStore();
  const { isMobile } = useLayout();
  const o = usePublicOverview();
  const president = o.bureau.find((p) => p.role === 'admin' && /pr[ée]sident/i.test(p.fonction ?? ''));

  return (
    <PublicSite>
      <Hero />

      {o.schools.length > 0 && (
        <View style={{ paddingVertical: 26, gap: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Container>
            <Eyebrow label={d.site.home.studyAt} color={colors.textSubtle} align="center" />
          </Container>
          <Marquee items={o.schools} color={colors.textMuted} separator="" speed={35} style={{ fontFamily: fonts.serif, fontSize: 24 }} />
        </View>
      )}

      <NetworkSection title={d.site.home.networkTitle} italic={d.site.home.networkItalic} sub={d.site.home.networkSub} />

      {president && (
        <Band>
          <View style={{ maxWidth: 860, alignSelf: 'center', gap: 24, alignItems: 'center' }}>
            <Eyebrow label={d.site.home.quoteTitle} align="center" />
            <SerifTitle text={`“${d.site.home.quote}”`} size={isMobile ? 26 : 38} align="center" />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Avatar uri={president.avatar} name={president.name} size={48} />
              <View>
                <Txt variant="bodyStrong">{president.name}</Txt>
                <Txt variant="small" color="textMuted">{`${president.fonction} · ${d.app.name}`}</Txt>
              </View>
            </View>
          </View>
        </Band>
      )}

      <StepsSection />

      {o.institutions.length > 0 && (
        <Band style={{ paddingTop: 0 }}>
          <View style={{ gap: 18, alignItems: 'center' }}>
            <Eyebrow label={d.site.partners.eyebrow} align="center" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
              {o.institutions.map((i) => (
                <Tap key={i.id} onPress={() => router.push('/partenaires')} style={{ paddingHorizontal: 20, paddingVertical: 14, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}>
                  <Txt style={{ fontFamily: fonts.serif, fontSize: 22, color: colors.text }}>{i.name}</Txt>
                </Tap>
              ))}
            </View>
          </View>
        </Band>
      )}

      {isRemote && Platform.OS === 'web' && (
        <Container style={{ paddingBottom: 48 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, padding: 18, borderRadius: 18, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.borderStrong }}>
            <Feather name="play-circle" size={18} color={colors.primary} />
            <View style={{ flex: 1, minWidth: 220 }}>
              <Txt variant="smallStrong">{d.demo.tryTitle}</Txt>
              <Txt variant="small" color="textMuted">{d.demo.trySub}</Txt>
            </View>
            <Button label={d.demo.tryButton} icon="eye" variant="soft" size="sm" onPress={enterDemo} />
          </View>
        </Container>
      )}

      <CtaSection />
    </PublicSite>
  );
}

/** Four slides (L'Amicale, Annuaire, Repère, Événements) that turn on their own. */
function Hero() {
  const { d } = useI18n();
  const { isDesktop, isMobile } = useLayout();
  const h = d.site.home;
  const slides = [
    { tab: d.site.nav.association, title: h.s1Title, italic: h.s1Italic, sub: h.s1Sub, cta: h.cta1, photos: [IMAGES.graduation, IMAGES.friends] },
    { tab: d.nav.directory, title: h.s2Title, italic: h.s2Italic, sub: h.s2Sub, cta: h.cta2, photos: [IMAGES.crowd, IMAGES.team] },
    { tab: d.nav.repere, title: h.s3Title, italic: h.s3Italic, sub: h.s3Sub, cta: h.cta3, photos: [IMAGES.students, IMAGES.paris] },
    { tab: d.nav.events, title: h.s4Title, italic: h.s4Italic, sub: h.s4Sub, cta: h.cta4, photos: [IMAGES.gala, IMAGES.party] },
  ];
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setI((x) => (x + 1) % slides.length), SLIDE_MS);
    return () => clearTimeout(t);
  }, [i, slides.length]);
  const s = slides[i];
  const go = () => router.push(i === 3 ? '/association' : '/inscription');

  return (
    <View style={{ backgroundColor: NAVY, overflow: 'hidden' }}>
      <Container style={{ minHeight: isMobile ? 480 : 600, justifyContent: 'center', paddingVertical: 48 }}>
        {isDesktop && (
          <>
            <Photo uri={s.photos[0]} style={{ position: 'absolute', left: 0, top: 70, transform: [{ rotate: '-6deg' }] }} />
            <Photo uri={s.photos[1]} style={{ position: 'absolute', right: 0, top: 240, transform: [{ rotate: '5deg' }] }} />
          </>
        )}
        <View style={{ alignItems: 'center', gap: 22, maxWidth: 820, alignSelf: 'center' }}>
          <Eyebrow label={`0${i + 1} / 0${slides.length} · ${s.tab}`} color={MIST} align="center" />
          <View style={{ alignItems: 'center' }}>
            <Txt style={{ fontFamily: fonts.serif, fontSize: isMobile ? 42 : 76, lineHeight: isMobile ? 46 : 80, color: '#fff', textAlign: 'center' }}>{s.title}</Txt>
            <Txt style={{ fontFamily: fonts.serifItalic, fontSize: isMobile ? 42 : 76, lineHeight: isMobile ? 46 : 80, color: MIST, textAlign: 'center' }}>{s.italic}</Txt>
          </View>
          <Txt style={{ color: MIST, fontSize: isMobile ? 15 : 18, lineHeight: isMobile ? 23 : 28, textAlign: 'center', maxWidth: 560 }}>{s.sub}</Txt>
          <Button label={s.cta} iconRight="arrow-right" variant="accent" size="lg" onPress={go} style={{ alignSelf: 'center' }} />
        </View>
      </Container>
      <Container style={{ flexDirection: 'row', gap: 12, paddingBottom: 26 }}>
        {slides.map((sl, k) => (
          <Tap key={sl.tab} onPress={() => setI(k)} style={{ flex: 1, gap: 10, paddingTop: 4 }}>
            <View style={{ height: 2, backgroundColor: k === i ? '#fff' : 'rgba(255,255,255,0.25)' }} />
            {!isMobile && <Txt style={{ fontFamily: fonts.semibold, fontSize: 13, color: k === i ? '#fff' : MIST }}>{`0${k + 1} ${sl.tab}`}</Txt>}
          </Tap>
        ))}
      </Container>
    </View>
  );
}

function Photo({ uri, style }: { uri: string; style: object }) {
  return (
    <View style={[{ width: 220, height: 260, borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 24 }, style]}>
      <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={400} />
    </View>
  );
}
