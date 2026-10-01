import { router } from 'expo-router';

import { PublicPage } from '@/components/PublicPage';
import { Card, ListRow, type IconName } from '@/components/ui/primitives';
import { Grid } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { useStore } from '@/data/store';
import { useI18n } from '@/i18n';

export default function Sitemap() {
  const { d } = useI18n();
  const { me } = useStore();
  const groups: { title: string; items: [IconName, string, string][] }[] = [
    {
      title: d.site.nav.association,
      items: [
        ...(!me ? ([['compass', d.nav.home, '/bienvenue']] as [IconName, string, string][]) : []),
        ['heart', d.site.nav.association, '/association'],
        ['users', d.site.nav.bureau, '/bureau'],
        ['briefcase', d.site.nav.partners, '/partenaires'],
        ['user-plus', d.site.nav.join, '/adherer'],
      ],
    },
    {
      title: d.app.name,
      items: [
        ['home', d.nav.home, '/'],
        ['users', d.nav.directory, '/annuaire'],
        ['globe', d.nav.repere, '/repere'],
        ...(!me || me.role !== 'eleve' ? ([['calendar', d.nav.events, '/evenements']] as [IconName, string, string][]) : []),
        ['book-open', d.nav.publications, '/publications'],
        ['message-circle', d.nav.messages, '/messages'],
      ],
    },
    {
      title: d.nav.profile,
      items: [
        ['user', d.nav.profile, '/profil'],
        ['settings', d.nav.settings, '/parametres'],
        ['bell', d.nav.notifications, '/notifications'],
        ...(me?.role === 'admin' ? ([['shield', d.nav.admin, '/admin']] as [IconName, string, string][]) : []),
        ...(me?.role === 'honneur' ? ([['bar-chart-2', d.nav.stats, '/statistiques']] as [IconName, string, string][]) : []),
      ],
    },
    {
      title: d.nav.more,
      items: [
        ['log-in', d.auth.signIn, '/connexion'],
        ['user-plus', d.auth.signUp, '/inscription'],
        ['file-text', d.nav.legal, '/mentions-legales'],
        ['shield', d.legal.privacy, '/confidentialite'],
        ['mail', d.nav.contact, '/contact'],
      ],
    },
  ];
  return (
    <PublicPage title={d.legal.sitemap}>
      <Grid min={240}>
        {groups.map((g) => (
          <Card key={g.title} style={{ height: '100%' }}>
            <Txt variant="caption" style={{ marginBottom: 4 }}>{g.title}</Txt>
            {g.items.map(([icon, label, href], i) => (
              <ListRow key={href} icon={icon} title={label} onPress={() => router.push(href as never)} last={i === g.items.length - 1} />
            ))}
          </Card>
        ))}
      </Grid>
    </PublicPage>
  );
}
