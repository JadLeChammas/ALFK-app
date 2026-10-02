import { router } from 'expo-router';
import { Linking, View } from 'react-native';

import { PublicPage } from '@/components/PublicPage';
import { Button, Card } from '@/components/ui/primitives';
import { Txt } from '@/components/ui/Txt';
import { PHOTOS } from '@/data/photos';
import { useI18n } from '@/i18n';

const SECTIONS_FR: [string, string][] = [
  ['Éditeur', "Amicale du Lycée Français de Koweït (ALFK), association des anciens élèves du Lycée Français de Koweït."],
  ['Hébergement', "La plateforme et ses données sont hébergées par un prestataire cloud sécurisé. Les coordonnées complètes de l'hébergeur sont disponibles sur demande via la page contact."],
  ['Données personnelles', "Les informations saisies (profil, messages, photos) sont uniquement visibles par les membres approuvés de l'Amicale. Chaque membre choisit dans ses paramètres les informations visibles par les autres. Vous pouvez à tout moment modifier ou supprimer votre compte ; la suppression efface votre profil, vos messages et vos photos."],
  ['Messagerie', "Les conversations privées ne sont visibles que par leurs deux participants. En cas de signalement pour abus, un administrateur peut consulter la conversation concernée ; cet accès est consigné dans le journal d'administration."],
  ['Propriété intellectuelle', "Le logo et le nom de l'Amicale LFK sont la propriété de l'association. Les photos partagées restent la propriété de leurs auteurs, qui en autorisent la diffusion auprès des membres."],
];

const SECTIONS_EN: [string, string][] = [
  ['Publisher', 'Amicale du Lycée Français de Koweït (ALFK), the alumni association of the French Lycée of Kuwait.'],
  ['Hosting', "The platform and its data are hosted by a secure cloud provider. Full hosting details are available on request through the contact page."],
  ['Personal data', 'Information you enter (profile, messages, photos) is visible only to approved Amicale members. Each member chooses in settings what others can see. You can edit or delete your account at any time; deletion removes your profile, messages and photos.'],
  ['Messaging', 'Private conversations are visible only to their two participants. If a conversation is reported for abuse, an administrator may review it; that access is recorded in the admin audit log.'],
  ['Intellectual property', 'The Amicale LFK name and logo belong to the association. Shared photos remain the property of their authors, who allow them to be shown to members.'],
];

export default function Legal() {
  const { d, lang } = useI18n();
  const sections = lang === 'fr' ? SECTIONS_FR : SECTIONS_EN;
  return (
    <PublicPage title={d.legal.title}>
      <Card style={{ gap: 24 }}>
        {sections.map(([h, p]) => (
          <View key={h} style={{ gap: 6 }}>
            <Txt variant="h3">{h}</Txt>
            <Txt color="textMuted">{p}</Txt>
          </View>
        ))}
      </Card>
      {/* Wikimedia Commons photos used on the public pages: author, licence and source, as the licences require. */}
      <Card style={{ gap: 12 }}>
        <Txt variant="h3">{lang === 'fr' ? 'Crédits photos' : 'Photo credits'}</Txt>
        {Object.values(PHOTOS).map((p) => (
          <Txt key={p.page} color="textMuted">
            « {p.title} » — {p.author},{' '}
            <Txt color="primary" onPress={() => Linking.openURL(p.licenseUrl)}>{p.license}</Txt>, {lang === 'fr' ? 'via' : 'via'}{' '}
            <Txt color="primary" onPress={() => Linking.openURL(p.page)}>Wikimedia Commons</Txt>
          </Txt>
        ))}
      </Card>
      <Button label={d.legal.privacy} icon="shield" variant="secondary" onPress={() => router.push('/confidentialite')} />
    </PublicPage>
  );
}
