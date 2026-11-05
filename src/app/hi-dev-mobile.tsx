import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { type ComponentProps } from 'react';
import { View } from 'react-native';

import { Seo } from '@/components/Seo';
import { ExtLink, PRODUCTS, ProductCard } from '@/components/site/ProductCards';
import { LinkCta, Reveal, Section, SerifHeading, SiteFrame, useTone } from '@/components/site/SiteFrame';
import { Button } from '@/components/ui/primitives';
import { Txt } from '@/components/ui/Txt';
import { HIDEV_LOGO } from '@/data/partners';
import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { brand, fonts, radius } from '@/theme/tokens';

/**
 * « Hi Dev Mobile » — the studio that designs and builds the Amicale's platform (partner page,
 * reached from its card on Partenaires). What they do, and their own products, each with a real,
 * followed link and a descriptive anchor (same text in the pre-rendered HTML, scripts/seo-pages.mjs).
 */

const HIDEV_URL = 'https://www.hidevmobile.com';

type Icon = ComponentProps<typeof Feather>['name'];

const SERVICES: { icon: Icon; fr: [string, string]; en: [string, string] }[] = [
  { icon: 'cpu', fr: ['Intelligence artificielle', 'L’IA mise en place dans votre entreprise : assistants, automatisations, outils sur mesure.'], en: ['Artificial intelligence', 'AI set up in your business: assistants, automations, custom tools.'] },
  { icon: 'smartphone', fr: ['Applications mobiles', 'Des applications iPhone et Android conçues de A à Z.'], en: ['Mobile apps', 'iPhone and Android apps designed end to end.'] },
  { icon: 'globe', fr: ['Sites web', 'Sites et plateformes web rapides, sécurisés et bien référencés.'], en: ['Websites', 'Fast, secure, search-friendly websites and web platforms.'] },
  { icon: 'code', fr: ['Logiciels sur mesure', 'Des outils métier pensés pour votre façon de travailler.'], en: ['Custom software', 'Business tools built around the way you work.'] },
  { icon: 'hard-drive', fr: ['Matériel sur mesure', 'Du prototype au produit : le logiciel et le matériel qui vont avec.'], en: ['Custom hardware', 'From prototype to product: the software and the hardware that goes with it.'] },
];

export default function HiDevMobile() {
  const { bi } = useI18n();
  const { isDesktop, isMobile } = useLayout();

  return (
    <SiteFrame>
      <Seo />
      <Hero />

      <Section>
        <Reveal style={{ marginBottom: 32 }}>
          <SerifHeading title={bi('Ce que fait Hi Dev', 'What Hi Dev does')} lead={bi('Un studio qui construit le logiciel — et le matériel — dont une entreprise a besoin.', 'A studio that builds the software — and the hardware — a business needs.')} />
        </Reveal>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 }}>
          {SERVICES.map((s, i) => (
            <Reveal key={s.icon} index={i % 3} style={{ width: isMobile ? '100%' : isDesktop ? '33.333%' : '50%', padding: 8 }}>
              <Service icon={s.icon} title={bi(s.fr[0], s.en[0])} text={bi(s.fr[1], s.en[1])} />
            </Reveal>
          ))}
        </View>
      </Section>

      <Section tone="navy">
        <Reveal style={{ marginBottom: 32 }}>
          <SerifHeading
            title={bi('Leurs produits', 'Their products')}
            accent={bi('conçus et développés par Hi Dev.', 'designed and built by Hi Dev.')}
            lead={bi('Des applications utilisées chaque jour par des restaurants, des commerces et des professionnels.', 'Apps used every day by restaurants, shops and professionals.')}
          />
        </Reveal>
        <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 16 }}>
          {PRODUCTS.map((p, i) => (
            <Reveal key={p.name} index={i} style={{ flex: isDesktop ? 1 : undefined }}>
              <ProductCard product={p} index={i} />
            </Reveal>
          ))}
        </View>
      </Section>

      <Section>
        <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: isDesktop ? 64 : 24, alignItems: isDesktop ? 'center' : 'flex-start' }}>
          <Reveal style={{ flex: 1, gap: 16 }}>
            <SerifHeading
              title={bi('Ils ont construit', 'They built')}
              accent={bi('la plateforme de l’Amicale.', 'the Amicale’s platform.')}
              lead={bi(
                'alfk.org — l’annuaire des anciens élèves du LFK, la carte des universités, la messagerie, les événements, l’orientation et la sécurité des données des membres — est conçu et développé par Hi Dev Mobile, partenaire technique de l’Amicale.',
                'alfk.org — the LFK alumni directory, the universities map, messaging, events, orientation and the security of members’ data — is designed and built by Hi Dev Mobile, the Amicale’s technical partner.'
              )}
            />
          </Reveal>
          <Reveal index={1} style={{ flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <ExtLink href={HIDEV_URL} label={bi('Hi Dev Mobile — développement d’applications, de sites web et d’IA', 'Hi Dev Mobile — app, website and AI development')}>
              <View pointerEvents="none">
                <Button label="hidevmobile.com" icon="external-link" />
              </View>
            </ExtLink>
            <LinkCta label={bi('Tous nos partenaires', 'All our partners')} onPress={() => router.push('/partenaires')} />
          </Reveal>
        </View>
      </Section>
    </SiteFrame>
  );
}

function Hero() {
  const { bi } = useI18n();
  const { isDesktop, isMobile } = useLayout();
  return (
    <Section tone="navy" style={{ paddingTop: isMobile ? 24 : 40 }}>
      <View style={{ flexDirection: isDesktop ? 'row' : 'column', alignItems: isDesktop ? 'center' : 'flex-start', gap: isDesktop ? 72 : 28 }}>
        <View style={{ flex: isDesktop ? 1.2 : undefined, gap: 22 }}>
          <Reveal style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 28, height: 3, backgroundColor: brand.red }} />
            <Txt style={{ fontFamily: fonts.semibold, fontSize: 12, letterSpacing: 1.6, textTransform: 'uppercase', color: brand.blue }}>{bi('Partenaire technique de l’Amicale', 'The Amicale’s technical partner')}</Txt>
          </Reveal>
          <SerifHeading title="Hi Dev Mobile" accent={bi('Applications, sites web et IA.', 'Apps, websites and AI.')} size="lg" />
          <Reveal index={2}>
            <Txt style={{ fontFamily: fonts.regular, fontSize: isMobile ? 16 : 18, lineHeight: isMobile ? 25 : 29, color: 'rgba(231,236,242,0.82)', maxWidth: 560 }}>
              {bi(
                'Hi Dev Mobile met l’intelligence artificielle au service des entreprises et conçoit des applications mobiles, des sites web, des logiciels et du matériel sur mesure. C’est le studio qui a créé et fait vivre la plateforme de l’Amicale LFK.',
                'Hi Dev Mobile sets up artificial intelligence for businesses and builds mobile apps, websites, custom software and hardware. It is the studio that created and runs the Amicale LFK’s platform.'
              )}
            </Txt>
          </Reveal>
          <Reveal index={3} style={{ flexDirection: 'row', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <ExtLink href={HIDEV_URL} label={bi('Visiter le site de Hi Dev Mobile', 'Visit the Hi Dev Mobile website')}>
              <View pointerEvents="none">
                <Button label={bi('Visiter hidevmobile.com', 'Visit hidevmobile.com')} icon="external-link" size="lg" />
              </View>
            </ExtLink>
            <LinkCta label={bi('Nos partenaires', 'Our partners')} light onPress={() => router.push('/partenaires')} />
          </Reveal>
        </View>
        <Reveal index={1} style={{ alignSelf: 'center' }}>
          <View style={{ width: isMobile ? 150 : 240, height: isMobile ? 150 : 240, borderRadius: isMobile ? 75 : 120, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 30, shadowOffset: { width: 0, height: 16 } }}>
            <Image source={HIDEV_LOGO} style={{ width: isMobile ? 96 : 150, height: isMobile ? 96 : 150 }} contentFit="contain" accessibilityLabel="Hi Dev Mobile" />
          </View>
        </Reveal>
      </View>
    </Section>
  );
}

function Service({ icon, title, text }: { icon: Icon; title: string; text: string }) {
  const t = useTone();
  return (
    <View style={{ flex: 1, padding: 22, borderRadius: radius.hero, backgroundColor: t.card, gap: 10 }}>
      <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(197,59,62,0.12)', alignItems: 'center', justifyContent: 'center' }}>
        <Feather name={icon} size={20} color={brand.red} />
      </View>
      <Txt style={{ fontFamily: fonts.serif, fontSize: 24, lineHeight: 28, color: t.cardFg }}>{title}</Txt>
      <Txt style={{ fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: t.cardMuted }}>{text}</Txt>
    </View>
  );
}
