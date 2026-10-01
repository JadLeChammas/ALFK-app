import { router } from 'expo-router';
import { View } from 'react-native';

import { Band, CtaSection, Eyebrow, PageHero, PublicSite, SerifTitle } from '@/components/site/PublicSite';
import { Avatar, Button } from '@/components/ui/primitives';
import { Txt } from '@/components/ui/Txt';
import { usePublicOverview, type PublicPerson } from '@/data/public';
import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

/** Le bureau: the volunteers who run the Amicale, and its honorary members. Public page. */
export default function Bureau() {
  const { d } = useI18n();
  const { isMobile } = useLayout();
  const o = usePublicOverview();
  const b = d.site.bureau;
  const board = o.bureau.filter((p) => p.role === 'admin');
  const honorary = o.bureau.filter((p) => p.role === 'honneur');

  return (
    <PublicSite>
      <PageHero eyebrow={d.app.long} title={b.title} sub={b.sub} />

      <Band>
        <View style={{ gap: 40 }}>
          <Group title={b.board} people={board} fallback={b.member} empty={b.empty} />
          {honorary.length > 0 && <Group title={b.honorary} people={honorary} fallback={d.roles.honneur} />}
        </View>
      </Band>

      <Band style={{ paddingTop: 0 }}>
        <View style={{ gap: 14, alignItems: 'center' }}>
          <SerifTitle text={b.volunteerTitle} italic={b.volunteerItalic} size={isMobile ? 36 : 52} align="center" />
          <Txt color="textMuted" align="center" style={{ maxWidth: 560 }}>{b.volunteerSub}</Txt>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button label={d.site.footer.contact} variant="accent" onPress={() => router.push('/contact')} />
            <Button label={d.site.nav.join} variant="secondary" onPress={() => router.push('/adherer')} />
          </View>
        </View>
      </Band>
      <CtaSection />
    </PublicSite>
  );
}

function Group({ title, people, fallback, empty }: { title: string; people: PublicPerson[]; fallback: string; empty?: string }) {
  const { colors } = useTheme();
  const { isMobile } = useLayout();
  return (
    <View style={{ gap: 20 }}>
      <SerifTitle text={title} size={isMobile ? 32 : 44} />
      {people.length === 0 ? (
        <Txt color="textMuted">{empty}</Txt>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
          {people.map((p) => (
            <View key={p.name} style={{ flexBasis: isMobile ? '100%' : 260, flexGrow: isMobile ? 1 : 0, alignItems: 'center', gap: 12, padding: 24, borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
              <Avatar uri={p.avatar} name={p.name} size={88} />
              <Txt variant="h2" align="center">{p.name}</Txt>
              <Eyebrow label={p.fonction || fallback} align="center" />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
