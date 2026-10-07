import { router } from 'expo-router';

import { LegalText } from '@/components/LegalText';
import { PublicPage } from '@/components/PublicPage';
import { Button, Card } from '@/components/ui/primitives';
import { Txt } from '@/components/ui/Txt';
import { useLegalText } from '@/data/legal';
import { useI18n } from '@/i18n';

/** Terms of use (CGU): the text the admins published (Admin → Textes légaux), or « coming soon ». */
export default function TermsOfUse() {
  const { d, f, lang, formatDate } = useI18n();
  const { text, updatedAt } = useLegalText('cgu', lang);
  return (
    <PublicPage title={d.legal.cgu} subtitle={updatedAt ? f(d.legal.updatedOn, { date: formatDate(updatedAt, { year: true }) }) : undefined}>
      {text ? (
        <LegalText text={text} />
      ) : (
        <Card>
          <Txt color="textMuted">{d.legal.cguSoon}</Txt>
        </Card>
      )}
      <Button label={d.nav.contact} icon="mail" variant="secondary" onPress={() => router.push('/contact')} />
    </PublicPage>
  );
}
