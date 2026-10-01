import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { View } from 'react-native';

import { Band, CtaSection, Eyebrow, NetworkSection, PageHero, PublicSite, SerifTitle } from '@/components/site/PublicSite';
import { Button, type IconName } from '@/components/ui/primitives';
import { Txt } from '@/components/ui/Txt';
import { usePublicOverview } from '@/data/public';
import { IMAGES } from '@/data/seed';
import { useStore } from '@/data/store';
import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

/** L'Amicale: who we are, our values and what we do. Public page. */
export default function Association() {
  const { d, f } = useI18n();
  const { colors } = useTheme();
  const { me } = useStore();
  const { isMobile } = useLayout();
  const o = usePublicOverview();
  const a = d.site.association;
  const values: [IconName, string, string][] = [
    ['users', a.v1, a.v1Sub],
    ['repeat', a.v2, a.v2Sub],
    ['compass', a.v3, a.v3Sub],
    ['globe', a.v4, a.v4Sub],
  ];
  const actions: [string, string][] = [
    [a.a1, a.a1Sub],
    [a.a2, a.a2Sub],
    [a.a3, a.a3Sub],
    [a.a4, a.a4Sub],
  ];

  return (
    <PublicSite>
      <PageHero eyebrow={a.eyebrow} title={a.title} italic={a.italic} sub={a.sub} image={IMAGES.graduation}>
        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
          {!me && <Button label={d.site.home.cta1} variant="accent" size="lg" onPress={() => router.push('/inscription')} />}
          <Button label={d.site.nav.bureau} variant="secondary" size="lg" onPress={() => router.push('/bureau')} />
        </View>
      </PageHero>

      <Band>
        <View style={{ gap: 28 }}>
          <SerifTitle text={a.valuesTitle} size={isMobile ? 36 : 52} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
            {values.map(([icon, title, sub]) => (
              <View key={title} style={{ flexGrow: 1, flexBasis: isMobile ? '100%' : 240, gap: 12, padding: 24, borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Feather name={icon} size={20} color={colors.primary} />
                </View>
                <SerifTitle text={title} size={30} />
                <Txt color="textMuted">{sub}</Txt>
              </View>
            ))}
          </View>
        </View>
      </Band>

      <Band style={{ paddingTop: 0 }}>
        <View style={{ gap: 28 }}>
          <SerifTitle text={a.actionsTitle} size={isMobile ? 36 : 52} />
          <View style={{ gap: 0 }}>
            {actions.map(([title, sub], i) => (
              <View key={title} style={{ flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 6 : 32, paddingVertical: 22, borderTopWidth: 1, borderTopColor: colors.border }}>
                <Eyebrow label={`0${i + 1}`} />
                <Txt variant="h2" style={{ width: isMobile ? undefined : 320 }}>{title}</Txt>
                <Txt color="textMuted" style={{ flex: isMobile ? undefined : 1 }}>{sub}</Txt>
              </View>
            ))}
          </View>
        </View>
      </Band>

      <NetworkSection title={a.presenceTitle} italic={f(a.presenceItalic, { n: o.countries })} sub={d.site.home.networkSub} />
      <CtaSection />
    </PublicSite>
  );
}
