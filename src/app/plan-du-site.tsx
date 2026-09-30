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
      title: d.app.name,
      items: [
        ['home', d.nav.home, '/'],
        ['users', d.nav.directory, '/annuaire'],
        ['globe', d.nav.repere, '/repere'],
        ['calendar', d.nav.events, '/evenements'],
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
      ],
    },
    {
      title: d.nav.more,
      items: [
        ['log-in', d.auth.signIn, '/connexion'],
        ['user-plus', d.auth.signUp, '/inscription'],
        ['file-text', d.nav.legal, '/mentions-legales'],
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
