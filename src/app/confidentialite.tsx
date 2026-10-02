import { router } from 'expo-router';
import { View } from 'react-native';

import { PublicPage } from '@/components/PublicPage';
import { Button, Card } from '@/components/ui/primitives';
import { Txt } from '@/components/ui/Txt';
import { useI18n } from '@/i18n';

/**
 * Privacy policy — public URL required by Google Play and the App Store
 * (https://alfk-app.vercel.app/confidentialite). Also documents account deletion.
 */

type Section = [string, string];

const FR: Section[] = [
  ['Qui sommes-nous', "L'application Amicale LFK est éditée par l'Amicale du Lycée Français de Koweït (ALFK), association des anciens élèves du Lycée Français de Koweït. Elle réunit ses membres dans un espace privé : annuaire, événements, publications et messagerie."],
  ['Données collectées', "À l'inscription : prénom, nom, adresse e-mail, mot de passe (stocké chiffré, jamais lisible), genre et statut (alumni ou élève). Facultativement : année de promotion, école ou université, ville, pays, téléphone, date de naissance, photo de profil et courte biographie. En utilisant l'app : vos messages privés, les photos que vous ajoutez aux galeries d'événements, et la date de votre dernière connexion."],
  ['Pourquoi', "Uniquement pour faire fonctionner le réseau : vérifier que vous faites partie de la communauté du LFK, permettre aux membres de se retrouver (annuaire par promo, Repère), échanger des messages et partager des événements. Aucune donnée n'est vendue, ni utilisée pour de la publicité, ni partagée avec des tiers à des fins commerciales."],
  ['Qui voit vos informations', "Rien n'est public : seuls les membres dont le compte a été approuvé par un administrateur voient l'annuaire. Dans Paramètres → Confidentialité, vous choisissez si votre e-mail, votre téléphone et votre anniversaire sont visibles. Les messages privés ne sont visibles que par les deux participants ; un administrateur ne peut consulter une conversation que si elle lui a été signalée pour abus, et cet accès est enregistré dans le journal d'administration."],
  ['Mineurs', "Les élèves encore scolarisés au lycée peuvent avoir moins de 18 ans. Pour leur protection, la messagerie privée est désactivée entre la direction du lycée et les élèves, et les événements de l'Amicale ne leur sont pas ouverts."],
  ['Hébergement et sécurité', "Les données sont hébergées par Supabase (base de données, comptes et photos) et le site par Vercel. Les échanges sont chiffrés (HTTPS) et chaque accès aux données est contrôlé par des règles de sécurité côté serveur."],
  ['Durée de conservation', "Vos données sont conservées tant que votre compte existe. Un compte refusé par un administrateur est supprimé immédiatement."],
  ['Supprimer votre compte', "Dans l'app : Paramètres → Zone sensible → « Supprimer mon compte ». La suppression est immédiate et définitive : profil, messages et photos sont effacés. Si vous n'avez plus accès à votre compte, écrivez-nous via la page Contact en indiquant l'adresse e-mail du compte ; nous le supprimons sous 30 jours."],
  ['Vos droits', "Vous pouvez à tout moment consulter et corriger vos informations depuis « Modifier mon profil », ou demander l'accès, la rectification ou l'effacement de vos données via la page Contact."],
];

const EN: Section[] = [
  ['Who we are', 'The Amicale LFK app is published by the Amicale du Lycée Français de Koweït (ALFK), the alumni association of the French Lycée of Kuwait. It brings members together in a private space: directory, events, publications and messaging.'],
  ['Data we collect', 'At sign-up: first name, last name, email address, password (stored encrypted, never readable), gender and status (alumni or student). Optionally: graduation year, school or university, city, country, phone, date of birth, profile photo and a short bio. While using the app: your private messages, the photos you add to event galleries, and the date of your last sign-in.'],
  ['Why', 'Only to run the network: to check you belong to the LFK community, help members find each other (directory by class, Alumni Map), exchange messages and share events. No data is sold, used for advertising, or shared with third parties for commercial purposes.'],
  ['Who sees your information', 'Nothing is public: only members whose account an administrator approved can see the directory. In Settings → Privacy you choose whether your email, phone and birthday are visible. Private messages are visible only to their two participants; an administrator can open a conversation only if it was reported for abuse, and that access is recorded in the admin log.'],
  ['Minors', 'Current students may be under 18. To protect them, private messaging is disabled between school leadership and students, and Amicale events are not open to them.'],
  ['Hosting and security', 'Data is hosted by Supabase (database, accounts and photos) and the website by Vercel. Traffic is encrypted (HTTPS) and every data access is checked by server-side security rules.'],
  ['Retention', 'Your data is kept as long as your account exists. An account refused by an administrator is deleted immediately.'],
  ['Delete your account', 'In the app: Settings → Danger zone → "Delete my account". Deletion is immediate and permanent: profile, messages and photos are erased. If you can no longer access your account, write to us through the Contact page with the account email address; we delete it within 30 days.'],
  ['Your rights', 'You can view and correct your information at any time from "Edit my profile", or request access, correction or erasure of your data through the Contact page.'],
];

export default function Privacy() {
  const { d, lang } = useI18n();
  const sections = lang === 'fr' ? FR : EN;
  return (
    <PublicPage title={d.legal.privacy} subtitle={d.legal.privacyUpdated}>
      <Card style={{ gap: 24 }}>
        {sections.map(([h, p]) => (
          <View key={h} style={{ gap: 6 }}>
            <Txt variant="h3">{h}</Txt>
            <Txt color="textMuted">{p}</Txt>
          </View>
        ))}
      </Card>
      <Button label={d.nav.contact} icon="mail" variant="secondary" onPress={() => router.push('/contact')} />
    </PublicPage>
  );
}
