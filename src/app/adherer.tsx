import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Band, CtaSection, PageHero, PublicSite, SerifTitle, StepsSection } from '@/components/site/PublicSite';
import { Button, Tap, type IconName } from '@/components/ui/primitives';
import { Txt } from '@/components/ui/Txt';
import { useStore } from '@/data/store';
import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

/** Adhérer: who can join, how, and frequent questions. Public page. */
export default function Join() {
  const { d } = useI18n();
  const { colors } = useTheme();
  const { me } = useStore();
  const { isMobile } = useLayout();
  const j = d.site.join;
  const who: [IconName, string, string][] = [
    ['award', j.who1, j.who1Sub],
    ['book-open', j.who2, j.who2Sub],
    ['star', j.who3, j.who3Sub],
  ];
  const faq: [string, string][] = [
    [j.q1, j.a1],
    [j.q2, j.a2],
    [j.q3, j.a3],
    [j.q4, j.a4],
    [j.q5, j.a5],
    [j.q6, j.a6],
  ];

  return (
    <PublicSite>
      <PageHero eyebrow={j.eyebrow} title={j.title} italic={j.italic} sub={j.sub}>
        {!me && (
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
            <Button label={j.createCta} variant="accent" size="lg" onPress={() => router.push('/inscription')} />
            <Button label={d.site.nav.signIn} variant="secondary" size="lg" onPress={() => router.push('/connexion')} />
          </View>
        )}
      </PageHero>

      <Band>
        <View style={{ gap: 28 }}>
          <SerifTitle text={j.whoTitle} italic={j.whoItalic} size={isMobile ? 36 : 52} />
          <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: 16 }}>
            {who.map(([icon, title, sub]) => (
              <View key={title} style={{ flex: 1, gap: 12, padding: 24, borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Feather name={icon} size={20} color={colors.primary} />
                </View>
                <Txt variant="h2">{title}</Txt>
                <Txt color="textMuted">{sub}</Txt>
              </View>
            ))}
          </View>
        </View>
      </Band>

      <StepsSection />

      <Band style={{ paddingTop: 0 }}>
        <View style={{ gap: 24, maxWidth: 860 }}>
          <SerifTitle text={j.faqTitle} italic={j.faqItalic} size={isMobile ? 36 : 52} />
          <View>
            {faq.map(([q, a]) => (
              <Question key={q} q={q} a={a} />
            ))}
          </View>
        </View>
      </Band>
      <CtaSection />
    </PublicSite>
  );
}

function Question({ q, a }: { q: string; a: string }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <View style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
      <Tap onPress={() => setOpen((o) => !o)} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 18 }}>
        <Txt variant="h3" style={{ flex: 1, fontSize: 17 }}>{q}</Txt>
        <Feather name={open ? 'minus' : 'plus'} size={18} color={colors.accent} />
      </Tap>
      {open && <Txt color="textMuted" style={{ paddingBottom: 18, maxWidth: 720 }}>{a}</Txt>}
    </View>
  );
}
