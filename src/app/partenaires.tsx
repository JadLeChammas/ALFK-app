import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Linking, View } from 'react-native';

import { PartnersManager } from '@/components/PartnersManager';
import { AppShell } from '@/components/shell/AppShell';
import { Band, CtaSection, Eyebrow, PageHero, PublicSite, SerifTitle } from '@/components/site/PublicSite';
import { Button } from '@/components/ui/primitives';
import { Txt } from '@/components/ui/Txt';
import { usePublicOverview } from '@/data/public';
import { useStore } from '@/data/store';
import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

const LOGOS: Record<string, number> = { lfk: require('@/assets/images/institution-lfk.png') };

/**
 * Partners. Approved members get it inside their space (admins manage the list there);
 * visitors get the public version.
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
  const { colors } = useTheme();
  const { isMobile } = useLayout();
  const o = usePublicOverview();
  const p = d.site.partners;

  return (
    <PublicSite>
      <PageHero eyebrow={p.eyebrow} title={p.title} sub={p.sub} />
      <Band>
        {o.institutions.length === 0 ? (
          <Txt color="textMuted">{p.empty}</Txt>
        ) : (
          <View style={{ gap: 0 }}>
            {o.institutions.map((inst, i) => {
              const logo = inst.logo ? (LOGOS[inst.logo] ?? { uri: inst.logo }) : undefined;
              return (
                <View key={inst.id} style={{ flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 12 : 32, paddingVertical: 28, borderTopWidth: 1, borderTopColor: colors.border, alignItems: isMobile ? 'flex-start' : 'center' }}>
                  <Eyebrow label={`0${i + 1}`} />
                  <View style={{ width: 72, height: 72, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {logo ? <Image source={logo} style={{ width: 60, height: 60 }} contentFit="contain" /> : <Feather name="home" size={26} color={colors.primary} />}
                  </View>
                  <View style={{ flex: isMobile ? undefined : 1, gap: 6 }}>
                    <SerifTitle text={inst.name} size={isMobile ? 28 : 34} />
                    <Txt color="textMuted">{inst.description}</Txt>
                  </View>
                  {inst.website && <Button label={d.honorary.website} icon="external-link" variant="secondary" size="sm" onPress={() => Linking.openURL(inst.website!)} />}
                </View>
              );
            })}
          </View>
        )}
      </Band>
      <Band style={{ paddingTop: 0 }}>
        <View style={{ gap: 16, padding: isMobile ? 24 : 40, borderRadius: radius.hero, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
          <SerifTitle text={p.becomeTitle} italic={p.becomeItalic} size={isMobile ? 34 : 48} />
          <Txt color="textMuted" style={{ maxWidth: 620 }}>{p.becomeSub}</Txt>
          <Button label={p.becomeCta} iconRight="arrow-right" variant="accent" onPress={() => router.push('/contact')} />
        </View>
      </Band>
      <CtaSection />
    </PublicSite>
  );
}
